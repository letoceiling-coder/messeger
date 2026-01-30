import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateMessageDto {
  chatId: string;
  userId: string;
  content: string;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptedKey?: string;
  iv?: string;
}

interface CreateVoiceMessageDto {
  chatId: string;
  userId: string;
  audioUrl: string;
  duration?: string;
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

  async getMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.message.findMany({
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
        messageDeliveries: {
          select: { status: true, deliveredAt: true, readAt: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
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
}
