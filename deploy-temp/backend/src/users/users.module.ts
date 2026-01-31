import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Создать папку для аватаров если её нет
const uploadPath = join(process.cwd(), 'uploads', 'avatars');
try {
  mkdirSync(uploadPath, { recursive: true });
} catch (err) {
  // Папка уже существует
}

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/avatars',
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
