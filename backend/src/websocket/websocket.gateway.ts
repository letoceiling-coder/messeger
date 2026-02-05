import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageDeliveredDto } from './dto/message-delivered.dto';
import { MessageReadDto } from './dto/message-read.dto';
import { JoinChatDto } from './dto/join-chat.dto';
import { CallInitiateDto } from './dto/call-initiate.dto';
import { CallAnswerDto } from './dto/call-answer.dto';
import { CallIceCandidateDto } from './dto/call-ice-candidate.dto';
import { TypingDto } from './dto/typing.dto';
import { setupRedisAdapter } from './redis-adapter.config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class MessagerWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private activeCalls = new Map<string, { callerId: string; receiverId: string }>(); // chatId -> call info
  /** Таймауты «не ответил» по chatId — очищаются при answer/reject/end */
  private callNoAnswerTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Кэш ранних ICE кандидатов (пришли до call:initiate/answer) */
  private pendingIceCandidates = new Map<string, Array<{ candidate: any; fromUserId: string }>>();
  /** Пользователи, которые сейчас на звонке: userId -> chatId */
  private usersInCall = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  async afterInit(server: Server) {
    await setupRedisAdapter(server);
  }

  /**
   * Рассылка сообщения в комнату чата (для голосовых, созданных через HTTP upload).
   */
  broadcastMessageToChat(payload: {
    id: string;
    chatId: string;
    userId: string;
    content?: string;
    messageType: string;
    audioUrl?: string | null;
    mediaUrl?: string | null;
    isEncrypted?: boolean;
    encryptedContent?: string | null;
    encryptedKey?: string | null;
    iv?: string | null;
    createdAt: Date;
  }) {
    const data = {
      ...payload,
      createdAt: payload.createdAt,
    };
    this.server.to(`chat:${payload.chatId}`).emit('message:received', data);
  }

  emitMessageDeleted(chatId: string, messageId: string) {
    this.server.to(`chat:${chatId}`).emit('message:deleted', { messageId, chatId });
  }

  emitMessageEdited(chatId: string, payload: { id: string; content: string; isEdited: boolean; updatedAt: Date }) {
    this.server.to(`chat:${chatId}`).emit('message:edited', { ...payload, chatId });
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Извлечение токена из query параметра или auth
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token?.toString();

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Валидация токена
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Сохранение userId в socket
      client.userId = payload.sub;

      // Сохранение связи userId -> socketId
      this.connectedUsers.set(payload.sub, client.id);

      // Обновление статуса пользователя
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: {
          isOnline: true,
          lastSeenAt: new Date(),
        },
      });

      // Присоединение к комнатам чатов пользователя
      await this.joinUserChatRooms(client, payload.sub);

      // Комната user:userId — для доставки message:delivery_status отправителю (работает при нескольких инстансах)
      client.join(`user:${payload.sub}`);

      this.logger.log(`User connected: ${payload.sub} (socket: ${client.id})`);

      // Уведомление участников чатов о подключении
      await this.notifyUserOnline(payload.sub);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) {
      return;
    }

    const userId = client.userId;

    // Проверка, был ли пользователь на звонке
    const chatId = this.usersInCall.get(userId);
    if (chatId) {
      const callInfo = this.activeCalls.get(chatId);
      if (callInfo) {
        // Определение собеседника
        const otherUserId =
          callInfo.callerId === userId ? callInfo.receiverId : callInfo.callerId;
        const otherSocketId = this.connectedUsers.get(otherUserId);

        // Уведомление собеседника о разрыве соединения
        if (otherSocketId) {
          this.server.to(otherSocketId).emit('call:end', {
            chatId,
            reason: 'connection_lost',
          });
        }

        // Очистка данных о звонке
        this.activeCalls.delete(chatId);
        this.usersInCall.delete(callInfo.callerId);
        this.usersInCall.delete(callInfo.receiverId);
        this.clearCallNoAnswerTimer(chatId);

        this.logger.log(`Call ended due to disconnect: ${chatId} (user: ${userId})`);
      }
    }

    // Удаление из connectedUsers
    this.connectedUsers.delete(userId);

    // Обновление статуса пользователя
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
      },
    });

    this.logger.log(`User disconnected: ${userId} (socket: ${client.id})`);

    // Уведомление участников чатов об отключении
    await this.notifyUserOffline(userId);
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    // Валидация DTO
    const dto = plainToInstance(SendMessageDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();
      client.emit('error', {
        message: errorMessages.join(', '),
      });
      return;
    }

    try {
      // Проверка участия в чате
      const chatMember = await this.prisma.chatMember.findFirst({
        where: {
          chatId: dto.chatId,
          userId: client.userId,
          leftAt: null, // Активный участник
        },
      });

      if (!chatMember) {
        client.emit('error', {
          message: 'Вы не являетесь участником этого чата',
        });
        return;
      }

      // Создание сообщения (текстовое или голосовое)
      let message;
      if (dto.audioUrl) {
        // Голосовое сообщение
        message = await this.messagesService.createVoiceMessage({
          chatId: dto.chatId,
          userId: client.userId,
          audioUrl: dto.audioUrl,
        });
      } else {
        // Текстовое сообщение (может быть зашифрованным)
        message = await this.messagesService.createMessage({
          chatId: dto.chatId,
          userId: client.userId,
          content: dto.content || '',
          isEncrypted: dto.isEncrypted || false,
          encryptedContent: dto.encryptedContent,
          encryptedKey: dto.encryptedKey,
          iv: dto.iv,
          replyToId: dto.replyToId || undefined,
        });
      }

      const msg = message as any;
      const payload = {
        id: msg.id,
        chatId: msg.chatId,
        userId: msg.userId,
        content: msg.content,
        messageType: msg.messageType,
        audioUrl: msg.audioUrl,
        mediaUrl: msg.mediaUrl,
        replyToId: msg.replyToId,
        replyTo: msg.replyTo,
        isEncrypted: msg.isEncrypted,
        encryptedContent: msg.encryptedContent,
        encryptedKey: msg.encryptedKey,
        iv: msg.iv,
        createdAt: msg.createdAt,
      };

      // Всем в комнате чата (получатели)
      this.server.to(`chat:${dto.chatId}`).emit('message:received', payload);
      // Явно отправителю — иначе в части конфигураций Socket.IO отправитель не получает событие из room
      client.emit('message:received', payload);

      this.logger.log(
        `Message sent: ${message.id} in chat ${dto.chatId} by user ${client.userId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', {
        message: 'Ошибка при отправке сообщения',
      });
    }
  }

  @SubscribeMessage('message:delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    // Валидация DTO
    const dto = plainToInstance(MessageDeliveredDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();
      client.emit('error', {
        message: errorMessages.join(', '),
      });
      return;
    }

    try {
      // Обновление статуса доставки
      const delivery = await this.prisma.messageDelivery.updateMany({
        where: {
          messageId: dto.messageId,
          userId: client.userId,
          status: 'sent',
        },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
        },
      });

      if (delivery.count > 0) {
        const message = await this.prisma.message.findUnique({
          where: { id: dto.messageId },
          select: { userId: true, chatId: true },
        });

        if (message && message.userId !== client.userId) {
          this.server.to(`user:${message.userId}`).emit('message:delivery_status', {
            messageId: dto.messageId,
            chatId: message.chatId,
            userId: client.userId,
            status: 'delivered',
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error updating delivery status: ${error.message}`);
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    const dto = plainToInstance(MessageReadDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      client.emit('error', {
        message: 'Невалидный messageId',
      });
      return;
    }

    try {
      const delivery = await this.prisma.messageDelivery.updateMany({
        where: {
          messageId: dto.messageId,
          userId: client.userId,
          status: { in: ['sent', 'delivered'] },
        },
        data: {
          status: 'read',
          readAt: new Date(),
        },
      });

      if (delivery.count > 0) {
        const message = await this.prisma.message.findUnique({
          where: { id: dto.messageId },
          select: { userId: true, chatId: true },
        });

        if (message && message.userId !== client.userId) {
          this.server.to(`user:${message.userId}`).emit('message:delivery_status', {
            messageId: dto.messageId,
            chatId: message.chatId,
            userId: client.userId,
            status: 'read',
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error updating read status: ${error.message}`);
    }
  }

  /**
   * Явное присоединение к комнате чата (при открытии чата на клиенте).
   * Нужно, чтобы пользователь получал сообщения в реальном времени, если чат был создан после его подключения.
   */
  @SubscribeMessage('chat:join')
  async handleChatJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    const dto = plainToInstance(JoinChatDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      client.emit('error', {
        message: 'Невалидный chatId',
      });
      return;
    }

    try {
      const chatMember = await this.prisma.chatMember.findFirst({
        where: {
          chatId: dto.chatId,
          userId: client.userId,
          leftAt: null,
        },
      });

      if (!chatMember) {
        client.emit('error', {
          message: 'Вы не являетесь участником этого чата',
        });
        return;
      }

      client.join(`chat:${dto.chatId}`);
      this.logger.debug(`User ${client.userId} joined chat:${dto.chatId}`);
    } catch (error) {
      this.logger.error(`Error joining chat: ${error.message}`);
      client.emit('error', {
        message: 'Ошибка при присоединении к чату',
      });
    }
  }

  /**
   * Присоединение пользователя ко всем его чатам
   */
  private async joinUserChatRooms(client: AuthenticatedSocket, userId: string) {
    const chatMembers = await this.prisma.chatMember.findMany({
      where: {
        userId,
        leftAt: null, // Только активные чаты
      },
      select: {
        chatId: true,
      },
    });

    for (const member of chatMembers) {
      client.join(`chat:${member.chatId}`);
      this.logger.debug(`User ${userId} joined chat:${member.chatId}`);
    }
  }

  /**
   * Уведомление участников чатов о том, что пользователь онлайн
   */
  private async notifyUserOnline(userId: string) {
    const userChats = await this.prisma.chatMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        chatId: true,
      },
    });

    for (const chat of userChats) {
      // Отправка всем участникам чата (кроме самого пользователя)
      this.server.to(`chat:${chat.chatId}`).emit('user:online', {
        userId,
      });
    }
  }

  /**
   * Уведомление участников чатов о том, что пользователь оффлайн
   */
  private async notifyUserOffline(userId: string) {
    const userChats = await this.prisma.chatMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        chatId: true,
      },
    });

    for (const chat of userChats) {
      this.server.to(`chat:${chat.chatId}`).emit('user:offline', {
        userId,
      });
    }
  }

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    const dto = plainToInstance(CallInitiateDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      client.emit('call:error', {
        message: 'Невалидные данные для звонка',
      });
      return;
    }

    try {
      // Проверка участия в чате
      const chatMembers = await this.prisma.chatMember.findMany({
        where: {
          chatId: dto.chatId,
          leftAt: null,
        },
        select: {
          userId: true,
        },
      });

      if (chatMembers.length !== 2) {
        client.emit('call:error', {
          message: 'Звонки доступны только в 1-на-1 чатах',
        });
        return;
      }

      const receiver = chatMembers.find((m) => m.userId !== client.userId);
      if (!receiver) {
        client.emit('call:error', {
          message: 'Получатель не найден',
        });
        return;
      }

      // Проверка, что получатель онлайн
      const receiverSocketId = this.connectedUsers.get(receiver.userId);
      if (!receiverSocketId) {
        client.emit('call:error', {
          message: 'Пользователь оффлайн',
        });
        return;
      }

      // Проверка, что получатель не занят другим звонком
      if (this.usersInCall.has(receiver.userId)) {
        const busyChatId = this.usersInCall.get(receiver.userId);
        client.emit('call:busy', {
          message: 'Пользователь занят другим звонком',
          chatId: dto.chatId,
          busyChatId,
        });
        this.logger.log(
          `Call blocked - user busy: ${receiver.userId} in chat ${busyChatId}`,
        );
        return;
      }

      // Проверка, что инициатор не занят другим звонком
      if (this.usersInCall.has(client.userId)) {
        const busyChatId = this.usersInCall.get(client.userId);
        client.emit('call:error', {
          message: 'Вы уже находитесь на другом звонке',
          busyChatId,
        });
        return;
      }

      // Сохранение информации о звонке
      this.activeCalls.set(dto.chatId, {
        callerId: client.userId,
        receiverId: receiver.userId,
      });

      // Отправка offer получателю
      this.server.to(receiverSocketId).emit('call:offer', {
        chatId: dto.chatId,
        offer: dto.offer,
        callerId: client.userId,
        videoMode: dto.videoMode ?? true, // По умолчанию видеозвонок для обратной совместимости
      });

      // Таймаут «собеседник не ответил» (сек, из env или 45)
      const noAnswerSec = Math.max(30, parseInt(process.env.CALL_NO_ANSWER_TIMEOUT_SEC || '45', 10));
      const timer = setTimeout(() => {
        this.callNoAnswerTimers.delete(dto.chatId);
        if (!this.activeCalls.has(dto.chatId)) return;
        const info = this.activeCalls.get(dto.chatId)!;
        this.activeCalls.delete(dto.chatId);
        // Удалить из usersInCall на случай, если пользователи были добавлены
        this.usersInCall.delete(info.callerId);
        this.usersInCall.delete(info.receiverId);
        const callerSocketId = this.connectedUsers.get(info.callerId);
        if (callerSocketId) {
          this.server.to(callerSocketId).emit('call:no-answer', { chatId: dto.chatId });
        }
        this.logger.log(`Call no answer: ${dto.chatId}`);
      }, noAnswerSec * 1000);
      this.callNoAnswerTimers.set(dto.chatId, timer);

      this.logger.log(
        `Call initiated: ${client.userId} -> ${receiver.userId} in chat ${dto.chatId}`,
      );
    } catch (error) {
      this.logger.error(`Error initiating call: ${error.message}`);
      client.emit('call:error', {
        message: 'Ошибка при инициации звонка',
      });
    }
  }

  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('Не авторизован');
    }

    const dto = plainToInstance(CallAnswerDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      client.emit('call:error', {
        message: 'Невалидные данные для ответа',
      });
      return;
    }

    try {
      this.clearCallNoAnswerTimer(dto.chatId);
      const callInfo = this.activeCalls.get(dto.chatId);
      if (!callInfo) {
        client.emit('call:error', {
          message: 'Звонок не найден',
        });
        return;
      }

      // Отправка answer инициатору (звонящему)
      const callerSocketId = this.connectedUsers.get(callInfo.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:answer', {
          chatId: dto.chatId,
          answer: dto.answer,
        });
        this.logger.log(`Call answer sent to caller socket ${callerSocketId} chatId=${dto.chatId}`);
      } else {
        this.logger.warn(`Call answer: caller socket not found (callerId=${callInfo.callerId}) chatId=${dto.chatId}`);
      }

      // Применяем кэшированные ICE кандидаты (если были)
      this.drainPendingIceCandidates(dto.chatId);

      // Отметить обоих пользователей как "на звонке"
      this.usersInCall.set(callInfo.callerId, dto.chatId);
      this.usersInCall.set(callInfo.receiverId, dto.chatId);

      this.logger.log(`Call answered: ${dto.chatId}`);
    } catch (error) {
      this.logger.error(`Error answering call: ${error.message}`);
      client.emit('call:error', {
        message: 'Ошибка при ответе на звонок',
      });
    }
  }

  @SubscribeMessage('call:ice-candidate')
  async handleCallIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      return;
    }

    const dto = plainToInstance(CallIceCandidateDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return;
    }

    try {
      const callInfo = this.activeCalls.get(dto.chatId);
      if (!callInfo) {
        // Кэшируем ранний ICE кандидат (звонок ещё не активен)
        if (!this.pendingIceCandidates.has(dto.chatId)) {
          this.pendingIceCandidates.set(dto.chatId, []);
        }
        this.pendingIceCandidates.get(dto.chatId)!.push({
          candidate: dto.candidate,
          fromUserId: client.userId!,
        });
        this.logger.log(`ICE candidate cached for pending call: ${dto.chatId} (total: ${this.pendingIceCandidates.get(dto.chatId)!.length})`);
        // Автоочистка через 10 секунд (если звонок не начнётся)
        setTimeout(() => {
          if (this.pendingIceCandidates.has(dto.chatId)) {
            this.pendingIceCandidates.delete(dto.chatId);
          }
        }, 10000);
        return;
      }

      // Определение получателя
      const receiverId =
        callInfo.callerId === client.userId
          ? callInfo.receiverId
          : callInfo.callerId;

      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('call:ice-candidate', {
          chatId: dto.chatId,
          candidate: dto.candidate,
        });
        this.logger.log(`ICE candidate relayed: from userId=${client.userId} to userId=${receiverId} (socket=${receiverSocketId})`);
      } else {
        this.logger.warn(`ICE candidate receiver not connected: userId=${receiverId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling ICE candidate: ${error.message}`);
    }
  }

  private clearCallNoAnswerTimer(chatId: string) {
    const t = this.callNoAnswerTimers.get(chatId);
    if (t) {
      clearTimeout(t);
      this.callNoAnswerTimers.delete(chatId);
    }
  }

  private drainPendingIceCandidates(chatId: string) {
    const pending = this.pendingIceCandidates.get(chatId);
    if (!pending || pending.length === 0) return;

    const callInfo = this.activeCalls.get(chatId);
    if (!callInfo) return;

    this.logger.log(`Draining ${pending.length} pending ICE candidates for call ${chatId}`);

    for (const item of pending) {
      const receiverId =
        callInfo.callerId === item.fromUserId
          ? callInfo.receiverId
          : callInfo.callerId;

      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('call:ice-candidate', {
          chatId,
          candidate: item.candidate,
        });
      }
    }

    this.pendingIceCandidates.delete(chatId);
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return;
    }

    try {
      this.clearCallNoAnswerTimer(data.chatId);
      const callInfo = this.activeCalls.get(data.chatId);
      if (!callInfo) {
        return;
      }

      // Определение получателя
      const receiverId =
        callInfo.callerId === client.userId
          ? callInfo.receiverId
          : callInfo.callerId;

      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('call:end', {
          chatId: data.chatId,
        });
      }

      // Удаление информации о звонке
      this.activeCalls.delete(data.chatId);

      // Удалить пользователей из статуса "на звонке"
      this.usersInCall.delete(callInfo.callerId);
      this.usersInCall.delete(callInfo.receiverId);

      this.logger.log(`Call ended: ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Error ending call: ${error.message}`);
    }
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return;
    }

    try {
      this.clearCallNoAnswerTimer(data.chatId);
      const callInfo = this.activeCalls.get(data.chatId);
      if (!callInfo) {
        return;
      }

      const callerSocketId = this.connectedUsers.get(callInfo.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:rejected', {
          chatId: data.chatId,
        });
      }

      this.activeCalls.delete(data.chatId);

      // Удалить пользователей из статуса "на звонке" (если звонок был отклонён до answer, они могут не быть в usersInCall)
      this.usersInCall.delete(callInfo.callerId);
      this.usersInCall.delete(callInfo.receiverId);

      this.logger.log(`Call rejected: ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error.message}`);
    }
  }

  /**
   * Событие "пользователь начал печатать"
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      return;
    }

    const dto = plainToInstance(TypingDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return;
    }

    try {
      // Проверка участия в чате
      const chatMember = await this.prisma.chatMember.findFirst({
        where: {
          chatId: dto.chatId,
          userId: client.userId,
          leftAt: null,
        },
      });

      if (!chatMember) {
        return;
      }

      // Отправка всем участникам чата (кроме отправителя)
      client.to(`chat:${dto.chatId}`).emit('typing:start', {
        chatId: dto.chatId,
        userId: client.userId,
      });

      this.logger.debug(`User ${client.userId} started typing in chat ${dto.chatId}`);
    } catch (error) {
      this.logger.error(`Error handling typing start: ${error.message}`);
    }
  }

  /**
   * Событие "пользователь прекратил печатать"
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    if (!client.userId) {
      return;
    }

    const dto = plainToInstance(TypingDto, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return;
    }

    try {
      // Проверка участия в чате
      const chatMember = await this.prisma.chatMember.findFirst({
        where: {
          chatId: dto.chatId,
          userId: client.userId,
          leftAt: null,
        },
      });

      if (!chatMember) {
        return;
      }

      // Отправка всем участникам чата (кроме отправителя)
      client.to(`chat:${dto.chatId}`).emit('typing:stop', {
        chatId: dto.chatId,
        userId: client.userId,
      });

      this.logger.debug(`User ${client.userId} stopped typing in chat ${dto.chatId}`);
    } catch (error) {
      this.logger.error(`Error handling typing stop: ${error.message}`);
    }
  }
}
