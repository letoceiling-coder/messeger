import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SmsCodeService } from './sms-code.service';
import { EmailCodeService } from './email-code.service';
import { normalizePhoneForSmsc } from '../smsc/smsc.service';

type AuthMode = 'phone' | 'email' | 'both';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsCodeService: SmsCodeService,
    private emailCodeService: EmailCodeService,
  ) {}

  getAuthModes(): AuthMode[] {
    const mode = (this.configService.get<string>('AUTH_MODE') || 'both').toLowerCase();
    if (mode === 'phone') return ['phone'];
    if (mode === 'email') return ['email'];
    return ['phone', 'email'];
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    console.log('[AUTH] Register attempt:', {
      email: dto.email,
      username: dto.username,
      passwordLength: dto.password?.length,
      passwordFirst3: dto.password?.substring(0, 3),
      passwordType: typeof dto.password,
    });
    
    // Нормализация email (case-insensitive)
    const emailNormalized = dto.email.toLowerCase().trim();
    
    // Проверка существования email (case-insensitive - ищем по нормализованному и оригинальному)
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailNormalized },
          { email: dto.email.trim() },
        ],
      },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Проверка существования username
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('Пользователь с таким username уже существует');
    }

    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Создание пользователя (email сохраняем в нормализованном виде)
    const user = await this.prisma.user.create({
      data: {
        email: emailNormalized,
        username: dto.username,
        passwordHash,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        username: true,
        avatarUrl: true,
      },
    });

    // Генерация JWT токена
    const accessToken = await this.generateToken(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        username: user.username,
        avatarUrl: user.avatarUrl ?? undefined,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Нормализация email (case-insensitive)
    const emailNormalized = dto.email.toLowerCase().trim();
    
    console.log('[AUTH] Login attempt:', { 
      email: dto.email, 
      normalized: emailNormalized,
      passwordLength: dto.password?.length,
      passwordFirst3: dto.password?.substring(0, 3),
      passwordType: typeof dto.password,
    });
    
    // Поиск пользователя по email (пробуем нормализованный и оригинальный)
    const foundUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailNormalized },
          { email: dto.email.trim() },
        ],
      },
    });

    console.log('[AUTH] User found:', foundUser ? foundUser.email : 'null');

    if (!foundUser) {
      console.log('[AUTH] User not found, throwing UnauthorizedException');
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!foundUser.passwordHash) {
      throw new UnauthorizedException('Войдите через SMS по номеру телефона');
    }

    // Проверка пароля
    console.log('[AUTH] Comparing password...');
    const isPasswordValid = await bcrypt.compare(dto.password, foundUser.passwordHash);
    console.log('[AUTH] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[AUTH] Password invalid, throwing UnauthorizedException');
      throw new UnauthorizedException('Неверный email или пароль');
    }

    console.log('[AUTH] Login successful for:', foundUser.email);

    // Генерация JWT токена
    const accessToken = await this.generateToken(foundUser.id);

    return {
      accessToken,
      user: {
        id: foundUser.id,
        email: foundUser.email ?? undefined,
        phone: foundUser.phone ?? undefined,
        username: foundUser.username,
        avatarUrl: foundUser.avatarUrl ?? undefined,
      },
    };
  }

  async sendCode(dto: SendCodeDto): Promise<{ success: boolean }> {
    const modes = this.getAuthModes();
    const hasPhone = !!dto.phone?.trim();
    const hasEmail = !!dto.email?.trim();

    if (hasPhone && hasEmail) {
      throw new BadRequestException('Укажите только телефон или только email');
    }
    if (!hasPhone && !hasEmail) {
      throw new BadRequestException('Укажите телефон или email');
    }

    if (hasPhone) {
      if (!modes.includes('phone')) throw new BadRequestException('Авторизация по телефону недоступна');
      await this.smsCodeService.sendCode(dto.phone!);
    } else {
      if (!modes.includes('email')) throw new BadRequestException('Авторизация по email недоступна');
      await this.emailCodeService.sendCode(dto.email!);
    }
    return { success: true };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<AuthResponseDto> {
    const hasPhone = !!dto.phone?.trim();
    const hasEmail = !!dto.email?.trim();

    if (hasPhone && hasEmail) throw new BadRequestException('Укажите только телефон или только email');
    if (!hasPhone && !hasEmail) throw new BadRequestException('Укажите телефон или email');

    let ok: boolean;
    if (hasPhone) {
      ok = await this.smsCodeService.verifyCode(dto.phone!, dto.code);
    } else {
      ok = await this.emailCodeService.verifyCode(dto.email!, dto.code);
    }
    if (!ok) throw new BadRequestException('Неверный или истёкший код');

    if (hasPhone) {
      const normalized = normalizePhoneForSmsc(dto.phone!);
      const phoneFormatted = normalized.startsWith('+') ? normalized : `+${normalized}`;
      let user = await this.prisma.user.findUnique({
        where: { phone: phoneFormatted },
        select: { id: true, phone: true, email: true, username: true, avatarUrl: true },
      });
      if (!user) {
        const username = `user_${normalized.slice(-6)}`;
        const existing = await this.prisma.user.findUnique({ where: { username } });
        const finalUsername = existing ? `user_${normalized.slice(-6)}_${Date.now().toString(36)}` : username;
        user = await this.prisma.user.create({
          data: { phone: phoneFormatted, username: finalUsername },
          select: { id: true, phone: true, email: true, username: true, avatarUrl: true },
        });
      }
      const accessToken = await this.generateToken(user.id);
      return { accessToken, user: { id: user.id, phone: user.phone ?? undefined, email: user.email ?? undefined, username: user.username, avatarUrl: user.avatarUrl ?? undefined } };
    } else {
      const emailNorm = dto.email!.toLowerCase().trim();
      let user = await this.prisma.user.findUnique({
        where: { email: emailNorm },
        select: { id: true, phone: true, email: true, username: true, avatarUrl: true },
      });
      if (!user) {
        const base = emailNorm.split('@')[0]?.replace(/\W/g, '') || 'user';
        const username = base.length >= 3 ? base : `user_${base}`;
        const existing = await this.prisma.user.findUnique({ where: { username } });
        const finalUsername = existing ? `${username}_${Date.now().toString(36)}` : username;
        user = await this.prisma.user.create({
          data: { email: emailNorm, username: finalUsername },
          select: { id: true, phone: true, email: true, username: true, avatarUrl: true },
        });
      }
      const accessToken = await this.generateToken(user.id);
      return { accessToken, user: { id: user.id, phone: user.phone ?? undefined, email: user.email ?? undefined, username: user.username, avatarUrl: user.avatarUrl ?? undefined } };
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
      },
    });

    return user;
  }

  private async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    return this.jwtService.signAsync(payload, { expiresIn });
  }
}
