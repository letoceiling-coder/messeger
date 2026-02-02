import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmtpService } from '../mail/smtp.service';

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

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

@Injectable()
export class EmailCodeService {
  constructor(
    private prisma: PrismaService,
    private smtpService: SmtpService,
  ) {}

  async sendCode(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('Введите корректный email');
    }

    const recent = await this.prisma.emailCode.findFirst({
      where: { email: normalized },
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

    await this.prisma.emailCode.create({
      data: { email: normalized, code, expiresAt },
    });

    const subject = 'Код подтверждения — Messager';
    const text = `Ваш код: ${code}. Действует ${CODE_TTL_MINUTES} минут. Messager.`;
    const html = `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Действует ${CODE_TTL_MINUTES} минут.</p><p>Messager</p>`;

    const ok = await this.smtpService.sendMail(normalized, subject, text, html);
    if (!ok) {
      throw new BadRequestException('Не удалось отправить письмо. Проверьте настройки почты.');
    }
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const normalized = normalizeEmail(email);
    const trimmed = code.trim().replace(/\D/g, '');

    if (trimmed.length !== CODE_LENGTH) return false;

    const record = await this.prisma.emailCode.findFirst({
      where: {
        email: normalized,
        code: trimmed,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return false;

    await this.prisma.emailCode.delete({ where: { id: record.id } });
    return true;
  }
}
