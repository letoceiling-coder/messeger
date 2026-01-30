import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @CurrentUser() user: User,
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.usersService.searchUsers(query.trim(), user.id);
  }
}
