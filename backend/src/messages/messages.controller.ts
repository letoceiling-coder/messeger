import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateVoiceMessageDto } from './dto/create-voice-message.dto';
import { CreateTextMessageDto } from './dto/create-text-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { MessagerWebSocketGateway } from '../websocket/websocket.gateway';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => MessagerWebSocketGateway))
    private readonly wsGateway: MessagerWebSocketGateway,
  ) {}

  @Get()
  async getMessages(
    @Query('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!chatId || typeof chatId !== 'string') {
      throw new BadRequestException('chatId обязателен');
    }
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));
    const offsetNum = Math.max(0, parseInt(offset || '0', 10) || 0);
    return this.messagesService.getMessages(chatId, user?.id, limitNum, offsetNum);
  }

  /** Поиск сообщений в чате */
  @Get('search/chat/:chatId')
  async searchInChat(
    @Param('chatId') chatId: string,
    @Query('q') query: string,
    @CurrentUser() user: { id: string },
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.messagesService.searchInChat(chatId, user.id, query);
  }

  /** Глобальный поиск по всем чатам */
  @Get('search/global')
  async searchGlobal(
    @Query('q') query: string,
    @CurrentUser() user: { id: string },
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.messagesService.searchGlobal(user.id, query);
  }

  /** Отправка текстового сообщения (REST, дублирует WebSocket message:send) */
  @Post()
  async createTextMessage(
    @Body() dto: CreateTextMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    const message = await this.messagesService.createMessage({
      chatId: dto.chatId,
      userId: user.id,
      content: dto.content || '',
      replyToId: dto.replyToId,
    });
    const msg = message as any;
    this.wsGateway.broadcastMessageToChat({
      id: msg.id,
      chatId: msg.chatId,
      userId: msg.userId,
      content: msg.content,
      messageType: msg.messageType,
      createdAt: msg.createdAt,
    });
    return message;
  }

  @Post('upload-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/audio',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `voice-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Только аудио файлы разрешены'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chatId: string; duration?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Файл не загружен');
    }

    const audioUrl = `/uploads/audio/${file.filename}`;
    
    const message = await this.messagesService.createVoiceMessage({
      chatId: body.chatId,
      userId: user.id,
      audioUrl,
      duration: body.duration,
    });

    this.wsGateway.broadcastMessageToChat({
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
    });

    return {
      message,
      audioUrl,
    };
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `img-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Только изображения разрешены'), false);
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chatId: string; caption?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Файл не загружен');
    }
    const mediaUrl = `/uploads/images/${file.filename}`;
    const message = await this.messagesService.createMediaMessage({
      chatId: body.chatId,
      userId: user.id,
      mediaUrl,
      messageType: 'image',
      caption: body.caption,
    });
    this.wsGateway.broadcastMessageToChat({
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      content: message.content,
      messageType: message.messageType,
      audioUrl: message.audioUrl,
      mediaUrl: message.mediaUrl,
      isEncrypted: message.isEncrypted,
      encryptedContent: message.encryptedContent,
      encryptedKey: message.encryptedKey,
      iv: message.iv,
      createdAt: message.createdAt,
    });
    return { message, mediaUrl };
  }

  @Post('upload-video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.mp4';
          cb(null, `vid-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ok = file.mimetype?.startsWith('video/') || /\.(webm|mp4|mov|avi|mkv)$/i.test(file.originalname || '');
        cb(null, ok);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chatId?: string; caption?: string; messageType?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Файл не загружен');
    }
    const chatId = body?.chatId;
    if (!chatId) {
      throw new Error('chatId обязателен');
    }
    const mediaUrl = `/uploads/videos/${file.filename}`;
    const message = await this.messagesService.createMediaMessage({
      chatId,
      userId: user.id,
      mediaUrl,
      messageType: body?.messageType === 'video_note' ? 'video_note' : 'video',
      caption: body?.caption,
    });
    this.wsGateway.broadcastMessageToChat({
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      content: message.content,
      messageType: message.messageType,
      audioUrl: message.audioUrl,
      mediaUrl: message.mediaUrl,
      isEncrypted: message.isEncrypted,
      encryptedContent: message.encryptedContent,
      encryptedKey: message.encryptedKey,
      iv: message.iv,
      createdAt: message.createdAt,
    });
    return { message, mediaUrl };
  }

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chatId: string; caption?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Файл не загружен');
    }
    const documentUrl = `/uploads/documents/${file.filename}`;
    const message = await this.messagesService.createDocumentMessage({
      chatId: body.chatId,
      userId: user.id,
      documentUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      caption: body.caption,
    });
    this.wsGateway.broadcastMessageToChat({
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      content: message.content,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl,
      audioUrl: message.audioUrl,
      isEncrypted: message.isEncrypted,
      encryptedContent: message.encryptedContent,
      encryptedKey: message.encryptedKey,
      iv: message.iv,
      createdAt: message.createdAt,
    });
    return { message, documentUrl };
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @CurrentUser() user: any) {
    await this.messagesService.deleteMessage(id, user.id);
    return { success: true };
  }

  @Post('delete-many')
  async deleteMessages(@Body() body: { messageIds: string[] }, @CurrentUser() user: any) {
    const ids = Array.isArray(body.messageIds) ? body.messageIds : [];
    const result = await this.messagesService.deleteMessages(ids, user.id);
    
    // Отправляем WebSocket события для удаленных сообщений
    if (result.deletedMessages && result.deletedMessages.length > 0) {
      result.deletedMessages.forEach(msg => {
        this.wsGateway.emitMessageDeleted(msg.chatId, msg.id);
      });
    }
    
    return { deleted: result.count };
  }

  @Post('delete-for-everyone')
  async deleteForEveryone(@Body() body: { messageId: string }, @CurrentUser() user: any) {
    const result = await this.messagesService.deleteForEveryone(body.messageId, user.id);
    if (result) {
      this.wsGateway.emitMessageDeleted(result.chatId, result.messageId);
    }
    return { success: !!result };
  }

  @Post('forward')
  async forwardMessage(
    @Body() body: { messageId: string; targetChatId: string },
    @CurrentUser() user: any,
  ) {
    const message = await this.messagesService.forwardMessage(
      body.messageId,
      body.targetChatId,
      user.id,
    );
    if (!message) {
      return { success: false, message: 'Не удалось переслать' };
    }
    const msg = message as any;
    this.wsGateway.broadcastMessageToChat({
      id: msg.id,
      chatId: msg.chatId,
      userId: msg.userId,
      content: msg.content,
      messageType: msg.messageType,
      audioUrl: msg.audioUrl,
      mediaUrl: msg.mediaUrl,
      isEncrypted: msg.isEncrypted,
      encryptedContent: msg.encryptedContent,
      encryptedKey: msg.encryptedKey,
      iv: msg.iv,
      createdAt: msg.createdAt,
    });
    return { success: true, message };
  }

  @Patch(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: any,
  ) {
    const message = await this.messagesService.updateMessage(id, dto.content, user.id);
    if (!message) {
      throw new BadRequestException('Сообщение не найдено или не может быть отредактировано');
    }
    
    // Уведомить через WebSocket
    this.wsGateway.emitMessageEdited(message.chatId, {
      id: message.id,
      content: message.content,
      isEdited: message.isEdited,
      updatedAt: message.updatedAt,
    });
    
    return message;
  }

  /** Добавить/удалить реакцию на сообщение */
  @Post(':id/reactions')
  async toggleReaction(
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.messagesService.toggleReaction(id, user.id, dto.emoji);
    
    // Отправить событие через WebSocket (chatId для обновления на клиенте)
    if (result.chatId) {
      this.wsGateway.server.emit('reaction:updated', {
        messageId: id,
        chatId: result.chatId,
        emoji: dto.emoji,
        action: result.action,
        userId: user.id,
      });
    }
    
    return result;
  }

  /** Получить реакции для сообщения */
  @Get(':id/reactions')
  async getReactions(@Param('id') id: string) {
    return this.messagesService.getReactions(id);
  }
}
