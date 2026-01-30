import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
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
        email: true,
        username: true,
      },
    });

    // Генерация JWT токена
    const accessToken = await this.generateToken(user.id, user.email);

    return {
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Нормализация email (case-insensitive)
    const emailNormalized = dto.email.toLowerCase().trim();
    
    console.log('[AUTH] Login attempt:', { email: dto.email, normalized: emailNormalized });
    
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
    const accessToken = await this.generateToken(foundUser.id, foundUser.email);

    return {
      accessToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    return user;
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    return this.jwtService.signAsync(payload, { expiresIn });
  }
}
