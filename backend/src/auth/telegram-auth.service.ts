import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramInitData {
  user?: string;
  auth_date: string;
  hash: string;
}

@Injectable()
export class TelegramAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Проверка подписи initData от Telegram
   */
  verifyInitData(initData: string): TelegramUser {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Telegram Bot Token не настроен');
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Создание data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Вычисление секретного ключа
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисление hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверка hash
    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Невалидная подпись initData');
    }

    // Проверка времени (не старше 24 часов)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 86400) {
      throw new UnauthorizedException('initData устарел');
    }

    // Парсинг пользователя
    const userStr = urlParams.get('user');
    if (!userStr) {
      throw new UnauthorizedException('Пользователь не найден в initData');
    }

    return JSON.parse(userStr) as TelegramUser;
  }

  /**
   * Создание или обновление пользователя по Telegram ID
   */
  async createOrUpdateUser(telegramUser: TelegramUser) {
    const telegramId = telegramUser.id.toString();

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        username: telegramUser.username || `user_${telegramId}`,
        avatarUrl: telegramUser.photo_url,
        lastSeenAt: new Date(),
      },
      create: {
        email: `telegram_${telegramId}@telegram.local`,
        username: telegramUser.username || `user_${telegramId}`,
        passwordHash: crypto.randomBytes(32).toString('hex'), // Заглушка, пароль не используется
        telegramId,
        avatarUrl: telegramUser.photo_url,
      },
    });

    return user;
  }

  /**
   * Генерация JWT токена для пользователя
   */
  async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Полная аутентификация через Telegram
   */
  async authenticate(initData: string): Promise<{ token: string; user: any }> {
    const telegramUser = this.verifyInitData(initData);
    const user = await this.createOrUpdateUser(telegramUser);
    const token = await this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
