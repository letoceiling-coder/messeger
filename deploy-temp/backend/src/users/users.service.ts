import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  async getAllUsers(currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        isOnline: true,
        lastSeenAt: true,
      },
      orderBy: {
        username: 'asc',
      },
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query } },
              { email: { contains: query } },
            ],
          },
          { id: { not: currentUserId } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        isOnline: true,
      },
      take: 20,
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Проверка уникальности username, если он обновляется
    if (updateProfileDto.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateProfileDto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Это имя пользователя уже занято');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }
}
