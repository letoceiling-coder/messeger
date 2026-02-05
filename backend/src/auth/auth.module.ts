import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { SmsCodeService } from './sms-code.service';
import { EmailCodeService } from './email-code.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { SmscModule } from '../smsc/smsc.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    SmscModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TelegramAuthService, SmsCodeService, EmailCodeService, JwtStrategy],
  exports: [AuthService, TelegramAuthService],
})
export class AuthModule {}
