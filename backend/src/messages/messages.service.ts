import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateMessageDto {
  chatId: string;
  userId: string;
  content: string;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptedKey?: string;
  iv?: string;
  replyToId?: string;
}

interface CreateVoiceMessageDto {
  chatId: string;
  userId: string;
  audioUrl: string;
  duration?: string;
}

export interface CreateMediaMessageDto {
  chatId: string;
  userId: string;
  mediaUrl: string;
  messageType: 'image' | 'video';
  caption?: string;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(dto: CreateMessageDto) {
    // Создание сообщения в транзакции
    const result = await this.prisma.$transaction(async (tx) => {
      // Создание сообщения
      const message = await tx.message.create({
        data: {
          chatId: dto.chatId,
          userId: dto.userId,
          content: dto.content,
          isEncrypted: dto.isEncrypted || false,
          encryptedContent: dto.encryptedContent || null,
          encryptedKey: dto.encryptedKey || null,
          iv: dto.iv || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              userId: true,
            },
          },
        },
      });

      // Получение всех участников чата (кроме отправителя)
      const chatMembers = await tx.chatMember.findMany({
        where: {
          chatId: dto.chatId,
          userId: { not: dto.userId },
          leftAt: null, // Только активные участники
        },
        select: {
          userId: true,
        },
      });

      // Создание записей доставки для всех получателей
      if (chatMembers.length > 0) {
        await tx.messageDelivery.createMany({
          data: chatMembers.map((member) => ({
            messageId: message.id,
            userId: member.userId,
            status: 'sent',
          })),
        });
      }

      // Обновление чата (last_message_at, updated_at)
      await tx.chat.update({
        where: { id: dto.chatId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return message;
    });

    return result;
  }

  async createVoiceMessage(dto: CreateVoiceMessageDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId: dto.chatId,
          userId: dto.userId,
          content: dto.duration ? `Голосовое сообщение (${dto.duration}с)` : 'Голосовое сообщение',
          messageType: 'voice',
          audioUrl: dto.audioUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      const chatMembers = await tx.chatMember.findMany({
        where: {
          chatId: dto.chatId,
          userId: { not: dto.userId },
          leftAt: null,
        },
        select: {
          userId: true,
        },
      });

      if (chatMembers.length > 0) {
        await tx.messageDelivery.createMany({
          data: chatMembers.map((member) => ({
            messageId: message.id,
            userId: member.userId,
            status: 'sent',
          })),
        });
      }

      await tx.chat.update({
        where: { id: dto.chatId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return message;
    });

    return result;
  }

  async createMediaMessage(dto: CreateMediaMessageDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const content =
        dto.caption?.trim() ||
        (dto.messageType === 'image' ? 'Фото' : 'Видео');
      const message = await tx.message.create({
        data: {
          chatId: dto.chatId,
          userId: dto.userId,
          content,
          messageType: dto.messageType,
          mediaUrl: dto.mediaUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      const chatMembers = await tx.chatMember.findMany({
        where: {
          chatId: dto.chatId,
          userId: { not: dto.userId },
          leftAt: null,
        },
        select: {
          userId: true,
        },
      });

      if (chatMembers.length > 0) {
        await tx.messageDelivery.createMany({
          data: chatMembers.map((member) => ({
            messageId: message.id,
            userId: member.userId,
            status: 'sent',
          })),
        });
      }

      await tx.chat.update({
        where: { id: dto.chatId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return message;
    });

    return result;
  }

  async getMessages(
    chatId: string,
    userId: string | undefined,
    limit: number = 50,
    offset: number = 0,
  ) {
    if (userId) {
      const member = await this.prisma.chatMember.findFirst({
        where: {
          chatId,
          userId,
          leftAt: null,
        },
      });
      if (!member) {
        throw new ForbiddenException('Нет доступа к этому чату');
      }
    }

    const baseInclude = {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          messageType: true,
          userId: true,
        },
      },
      messageDeliveries: {
        select: { status: true, deliveredAt: true, readAt: true },
      },
    };

    try {
      return await this.prisma.message.findMany({
        where: {
          chatId,
          isDeleted: false,
        },
        include: baseInclude,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });
    } catch {
      try {
        return await this.prisma.message.findMany({
          where: {
            chatId,
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        });
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
  }

  /** Мягкое удаление сообщения (только автор) */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, userId, isDeleted: false },
    });
    if (!message) return null;
    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, updatedAt: new Date() },
    });
    return messageId;
  }

  /** Мягкое удаление нескольких сообщений (только свои) */
  async deleteMessages(messageIds: string[], userId: string) {
    const result = await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        userId,
        isDeleted: false,
      },
      data: { isDeleted: true, updatedAt: new Date() },
    });
    return result.count;
  }

  /** Удалить сообщение у всех (только автор, сообщение скрывается для всех) */
  async deleteForEveryone(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, userId, isDeleted: false },
    });
    if (!message) return null;
    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, updatedAt: new Date() },
    });
    return { messageId, chatId: message.chatId };
  }

  /** Переслать сообщение в другой чат (создаёт новое сообщение с тем же содержимым и пометкой) */
  async forwardMessage(messageId: string, targetChatId: string, userId: string) {
    const source = await this.prisma.message.findFirst({
      where: { id: messageId, isDeleted: false },
    });
    if (!source) return null;
    const inTarget = await this.prisma.chatMember.findFirst({
      where: { chatId: targetChatId, userId, leftAt: null },
    });
    if (!inTarget) return null;
    const prefix = 'Пересланное: ';
    const content = source.content?.startsWith(prefix)
      ? source.content
      : prefix + (source.content || '');

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId: targetChatId,
          userId,
          content,
          messageType: source.messageType,
          audioUrl: source.audioUrl,
          mediaUrl: source.mediaUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      const chatMembers = await tx.chatMember.findMany({
        where: {
          chatId: targetChatId,
          userId: { not: userId },
          leftAt: null,
        },
        select: { userId: true },
      });
      if (chatMembers.length > 0) {
        await tx.messageDelivery.createMany({
          data: chatMembers.map((m) => ({
            messageId: message.id,
            userId: m.userId,
            status: 'sent',
          })),
        });
      }
      await tx.chat.update({
        where: { id: targetChatId },
        data: { lastMessageAt: new Date(), updatedAt: new Date() },
      });
      return message;
    });
    return result;
  }
}
