import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateVoiceMessageDto } from './dto/create-voice-message.dto';
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
  ) {
    return this.messagesService.getMessages(
      chatId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
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
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Только видео разрешены'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chatId: string; caption?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Файл не загружен');
    }
    const mediaUrl = `/uploads/videos/${file.filename}`;
    const message = await this.messagesService.createMediaMessage({
      chatId: body.chatId,
      userId: user.id,
      mediaUrl,
      messageType: 'video',
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

  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @CurrentUser() user: any) {
    await this.messagesService.deleteMessage(id, user.id);
    return { success: true };
  }

  @Post('delete-many')
  async deleteMessages(@Body() body: { messageIds: string[] }, @CurrentUser() user: any) {
    const ids = Array.isArray(body.messageIds) ? body.messageIds : [];
    const count = await this.messagesService.deleteMessages(ids, user.id);
    return { deleted: count };
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
}
