import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  /** Создать или получить личный чат с пользователем */
  async createOrGetDirectChat(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('Нельзя создать чат с самим собой');
    }

    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
    });
    if (!other) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Ищем личные чаты, где я участник; затем выбираем чат с этим пользователем
    const myChats = await this.prisma.chat.findMany({
      where: {
        type: 'direct',
        members: {
          some: { userId: currentUserId, leftAt: null },
        },
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    const existing = myChats.find((c) => {
      const ids = c.members.map((m) => m.userId);
      return ids.length === 2 && ids.includes(currentUserId) && ids.includes(otherUserId);
    });

    if (existing) return existing;

    // Создаём новый личный чат
    return this.prisma.chat.create({
      data: {
        type: 'direct',
        members: {
          create: [
            { userId: currentUserId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });
  }

  async getChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    const chatIds = chats.map((c) => c.id);
    const unreadDeliveries = await this.prisma.messageDelivery.findMany({
      where: {
        userId,
        status: { in: ['sent', 'delivered'] },
        message: {
          chatId: { in: chatIds },
          isDeleted: false,
        },
      },
      select: { message: { select: { chatId: true } } },
    });
    const unreadByChat: Record<string, number> = {};
    unreadDeliveries.forEach((d) => {
      const cid = d.message.chatId;
      unreadByChat[cid] = (unreadByChat[cid] || 0) + 1;
    });

    return chats.map((chat) => ({
      ...chat,
      unreadCount: unreadByChat[chat.id] ?? 0,
    }));
  }

  async getChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    return chat;
  }
}
