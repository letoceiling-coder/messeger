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
        });
      }

      const payload = {
        id: message.id,
        chatId: message.chatId,
        userId: message.userId,
        content: message.content,
        messageType: message.messageType,
        audioUrl: message.audioUrl,
        isEncrypted: message.isEncrypted,
        encryptedContent: message.encryptedContent,
        encryptedKey: message.encryptedKey,
        iv: message.iv,
        createdAt: message.createdAt,
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
        // Получение информации о сообщении для отправки отправителю
        const message = await this.prisma.message.findUnique({
          where: { id: dto.messageId },
          select: { userId: true },
        });

        if (message && message.userId !== client.userId) {
          // Отправка статуса доставки отправителю
          const senderSocketId = this.connectedUsers.get(message.userId);
          if (senderSocketId) {
            this.server.to(senderSocketId).emit('message:delivery_status', {
              messageId: dto.messageId,
              userId: client.userId,
              status: 'delivered',
            });
          }
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
          select: { userId: true },
        });

        if (message && message.userId !== client.userId) {
          const senderSocketId = this.connectedUsers.get(message.userId);
          if (senderSocketId) {
            this.server.to(senderSocketId).emit('message:delivery_status', {
              messageId: dto.messageId,
              userId: client.userId,
              status: 'read',
            });
          }
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
      });

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
      const callInfo = this.activeCalls.get(dto.chatId);
      if (!callInfo) {
        client.emit('call:error', {
          message: 'Звонок не найден',
        });
        return;
      }

      // Отправка answer инициатору
      const callerSocketId = this.connectedUsers.get(callInfo.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:answer', {
          chatId: dto.chatId,
          answer: dto.answer,
        });
      }

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
      }
    } catch (error) {
      this.logger.error(`Error handling ICE candidate: ${error.message}`);
    }
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

      this.logger.log(`Call rejected: ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error.message}`);
    }
  }
}
