import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(@CurrentUser() user: User) {
    return this.usersService.getAllUsers(user.id);
  }

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

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Недопустимый формат файла. Разрешены: JPEG, PNG, GIF, WebP'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(user.id, { avatarUrl });

    return {
      avatarUrl,
      message: 'Аватар успешно загружен',
    };
  }
}
