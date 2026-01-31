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

export interface CreateDocumentMessageDto {
  chatId: string;
  userId: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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

  async createDocumentMessage(dto: CreateDocumentMessageDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId: dto.chatId,
          userId: dto.userId,
          content: dto.caption || 'Документ',
          messageType: 'document',
          mediaUrl: dto.documentUrl,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          mimeType: dto.mimeType,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Обновить lastMessageAt для чата
      await tx.chat.update({
        where: { id: dto.chatId },
        data: { lastMessageAt: new Date() },
      });

      // Создать записи доставки для всех участников чата (кроме отправителя)
      const chatMembers = await tx.chatMember.findMany({
        where: {
          chatId: dto.chatId,
          leftAt: null,
          userId: { not: dto.userId },
        },
        select: { userId: true },
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

  /** Поиск сообщений в конкретном чате */
  async searchInChat(chatId: string, userId: string, query: string) {
    // Проверяем, что пользователь участник чата
    const chatMember = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    if (!chatMember) {
      throw new Error('Вы не участник этого чата');
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Поиск по содержимому сообщений
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
        content: {
          contains: query.trim(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Ограничиваем результаты
    });

    return messages;
  }

  /** Глобальный поиск по всем чатам пользователя */
  async searchGlobal(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Получаем все чаты пользователя
    const userChats = await this.prisma.chatMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        chatId: true,
      },
    });

    const chatIds = userChats.map((cm) => cm.chatId);

    // Поиск по сообщениям во всех чатах
    const messages = await this.prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        isDeleted: false,
        content: {
          contains: query.trim(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        chat: {
          select: {
            id: true,
            type: true,
            name: true,
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Больше результатов для глобального поиска
    });

    return messages;
  }

  /** Редактирование текстового сообщения (только автор) */
  async updateMessage(messageId: string, newContent: string, userId: string) {
    // Проверяем, что сообщение существует, принадлежит пользователю и не удалено
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, userId, isDeleted: false },
    });
    
    if (!message) {
      return null;
    }
    
    // Обновляем сообщение
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        updatedAt: new Date(),
      },
    });
    
    return updated;
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
    // Сначала получаем сообщения для WebSocket уведомлений
    const messagesToDelete = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
        userId,
        isDeleted: false,
      },
      select: { id: true, chatId: true },
    });
    
    // Помечаем как удаленные
    const result = await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        userId,
        isDeleted: false,
      },
      data: { isDeleted: true, updatedAt: new Date() },
    });
    
    return { count: result.count, deletedMessages: messagesToDelete };
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

  /** Добавить или удалить реакцию на сообщение */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    // Проверяем, существует ли сообщение
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: {
              where: { userId, leftAt: null },
            },
          },
        },
      },
    });

    if (!message || message.chat.members.length === 0) {
      throw new Error('Сообщение не найдено или у вас нет доступа');
    }

    // Проверяем, есть ли уже такая реакция от этого пользователя
    const existingReaction = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Удаляем реакцию
      await this.prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      return { action: 'removed', emoji };
    } else {
      // Добавляем реакцию
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
      return { action: 'added', emoji };
    }
  }

  /** Получить реакции для сообщения */
  async getReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Группируем по эмодзи
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        username: reaction.user.username,
        avatarUrl: reaction.user.avatarUrl,
      });
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: any[] }>);

    return Object.values(grouped);
  }
}
