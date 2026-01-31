import { Body, Controller, Get, Param, Post, Patch, Delete, UseGuards } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

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

  /** Создать групповой чат */
  @Post('group')
  async createGroupChat(
    @Body() dto: CreateGroupChatDto,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.createGroupChat(
      user.id,
      dto.name,
      dto.memberIds,
      dto.description,
    );
  }

  /** Обновить информацию о групповом чате */
  @Patch(':id/group')
  async updateGroupChat(
    @Param('id') id: string,
    @Body() dto: UpdateGroupChatDto,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.updateGroupChat(id, user.id, dto.name, dto.description);
  }

  /** Добавить участника в группу */
  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.addMember(id, user.id, dto.userId);
  }

  /** Удалить участника из группы */
  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.removeMember(id, user.id, userId);
  }

  /** Покинуть группу */
  @Post(':id/leave')
  async leaveGroup(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.leaveGroup(id, user.id);
  }

  /** Изменить роль участника */
  /** Закрепить сообщение */
  @Post(':id/pin/:messageId')
  async pinMessage(
    @Param('id') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatsService.pinMessage(chatId, messageId, user.id);
  }

  /** Открепить сообщение */
  @Delete(':id/pin')
  async unpinMessage(
    @Param('id') chatId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatsService.unpinMessage(chatId, user.id);
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.chatsService.updateMemberRole(id, user.id, userId, dto.role);
  }
}
