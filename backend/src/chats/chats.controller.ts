import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

export class CreateDirectChatDto {
  @IsUUID()
  userId: string;
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getChats(@CurrentUser() user: User) {
    return this.chatsService.getChats(user.id);
  }

  @Post('direct')
  async createDirectChat(
    @Body() dto: CreateDirectChatDto,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.createOrGetDirectChat(user.id, dto.userId);
  }

  @Get(':id')
  async getChat(@Param('id') id: string, @CurrentUser() user: User) {
    return this.chatsService.getChat(id, user.id);
  }
}
