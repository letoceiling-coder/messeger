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

  /** Создать групповой чат */
  async createGroupChat(currentUserId: string, name: string, memberIds: string[], description?: string) {
    // Проверяем, что все участники существуют
    const users = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
    });

    if (users.length !== memberIds.length) {
      throw new BadRequestException('Один или несколько пользователей не найдены');
    }

    // Создаём групповой чат (создатель = admin)
    const groupChat = await this.prisma.chat.create({
      data: {
        type: 'group',
        name,
        members: {
          create: [
            { userId: currentUserId, role: 'admin' }, // Создатель — админ
            ...memberIds.map(id => ({ userId: id, role: 'member' })),
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

    return groupChat;
  }

  /** Обновить информацию о групповом чате */
  async updateGroupChat(chatId: string, currentUserId: string, name?: string, description?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { userId: currentUserId, leftAt: null },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.type !== 'group') {
      throw new BadRequestException('Это не групповой чат');
    }

    const member = chat.members[0];
    if (!member || member.role !== 'admin') {
      throw new BadRequestException('Только администратор может изменять чат');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        name: name ?? chat.name,
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

  /** Добавить участника в группу */
  async addMember(chatId: string, currentUserId: string, newUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.type !== 'group') {
      throw new BadRequestException('Это не групповой чат');
    }

    // Проверяем, что текущий пользователь — админ
    const currentMember = chat.members.find(m => m.userId === currentUserId);
    if (!currentMember || currentMember.role !== 'admin') {
      throw new BadRequestException('Только администратор может добавлять участников');
    }

    // Проверяем, что новый пользователь не в чате
    const alreadyMember = chat.members.find(m => m.userId === newUserId);
    if (alreadyMember) {
      throw new BadRequestException('Пользователь уже в чате');
    }

    // Проверяем, что новый пользователь существует
    const newUser = await this.prisma.user.findUnique({
      where: { id: newUserId },
    });
    if (!newUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Добавляем участника
    await this.prisma.chatMember.create({
      data: {
        chatId,
        userId: newUserId,
        role: 'member',
      },
    });

    return this.getChat(chatId, currentUserId);
  }

  /** Удалить участника из группы */
  async removeMember(chatId: string, currentUserId: string, userIdToRemove: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.type !== 'group') {
      throw new BadRequestException('Это не групповой чат');
    }

    const currentMember = chat.members.find(m => m.userId === currentUserId);
    if (!currentMember || currentMember.role !== 'admin') {
      throw new BadRequestException('Только администратор может удалять участников');
    }

    const memberToRemove = chat.members.find(m => m.userId === userIdToRemove);
    if (!memberToRemove) {
      throw new NotFoundException('Участник не найден');
    }

    // Помечаем как покинувшего
    await this.prisma.chatMember.update({
      where: { id: memberToRemove.id },
      data: { leftAt: new Date() },
    });

    return this.getChat(chatId, currentUserId);
  }

  /** Покинуть группу */
  async leaveGroup(chatId: string, currentUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.type !== 'group') {
      throw new BadRequestException('Это не групповой чат');
    }

    const currentMember = chat.members.find(m => m.userId === currentUserId);
    if (!currentMember) {
      throw new NotFoundException('Вы не участник этого чата');
    }

    // Помечаем как покинувшего
    await this.prisma.chatMember.update({
      where: { id: currentMember.id },
      data: { leftAt: new Date() },
    });

    return { message: 'Вы покинули группу' };
  }

  /** Изменить роль участника */
  async updateMemberRole(chatId: string, currentUserId: string, targetUserId: string, newRole: 'admin' | 'member') {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.type !== 'group') {
      throw new BadRequestException('Это не групповой чат');
    }

    const currentMember = chat.members.find(m => m.userId === currentUserId);
    if (!currentMember || currentMember.role !== 'admin') {
      throw new BadRequestException('Только администратор может изменять роли');
    }

    const targetMember = chat.members.find(m => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundException('Участник не найден');
    }

    await this.prisma.chatMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
    });

    return this.getChat(chatId, currentUserId);
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

  async pinMessage(chatId: string, messageId: string, userId: string) {
    // Проверка участия в чате
    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    if (!member) {
      throw new BadRequestException('Вы не являетесь участником этого чата');
    }

    // Проверка существования сообщения в этом чате
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        chatId,
      },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено в этом чате');
    }

    // Обновить чат
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { pinnedMessageId: messageId },
      include: {
        pinnedMessage: {
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
        },
      },
    });
  }

  async unpinMessage(chatId: string, userId: string) {
    // Проверка участия в чате
    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    if (!member) {
      throw new BadRequestException('Вы не являетесь участником этого чата');
    }

    // Открепить сообщение
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { pinnedMessageId: null },
    });
  }
}
