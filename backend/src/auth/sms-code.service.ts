import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER } from '../smsc/smsc.module';
import type { ISmsProvider } from '../smsc/sms-provider.interface';
import { normalizePhoneForSmsc } from '../smsc/smsc.service';

const CODE_LENGTH = 4;
const CODE_TTL_MINUTES = 5;
const RATE_LIMIT_SECONDS = 60;

function generateCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

@Injectable()
export class SmsCodeService {
  constructor(
    private prisma: PrismaService,
    @Inject(SMS_PROVIDER) private smsProvider: ISmsProvider,
  ) {}

  async sendCode(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      throw new BadRequestException('Неверный формат номера телефона');
    }

    // Rate limit: не чаще 1 раза в RATE_LIMIT_SECONDS
    const recent = await this.prisma.smsCode.findFirst({
      where: { phone: normalized },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
      if (elapsed < RATE_LIMIT_SECONDS) {
        throw new BadRequestException(
          `Повторная отправка через ${Math.ceil(RATE_LIMIT_SECONDS - elapsed)} сек`,
        );
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await this.prisma.smsCode.create({
      data: { phone: normalized, code, expiresAt },
    });

    const text = `Код подтверждения: ${code}. Messager.`;
    const result = await this.smsProvider.sendSms(phone, text);

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Не удалось отправить SMS',
      );
    }
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    const normalized = normalizePhone(phone);
    const trimmed = code.trim().replace(/\D/g, '');

    if (trimmed.length !== CODE_LENGTH) {
      return false;
    }

    const record = await this.prisma.smsCode.findFirst({
      where: {
        phone: normalized,
        code: trimmed,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return false;
    }

    await this.prisma.smsCode.delete({ where: { id: record.id } });
    return true;
  }
}

function normalizePhone(phone: string): string {
  return normalizePhoneForSmsc(phone);
}
