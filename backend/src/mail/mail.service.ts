import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpService } from './smtp.service';

/**
 * Универсальный сервис отправки писем.
 * Приоритет: RESEND (HTTP, порт 443) → SMTP.
 * Resend обходит блокировку портов 25/465/587 на VPS.
 */
@Injectable()
export class MailService {
  constructor(
    private config: ConfigService,
    private smtpService: SmtpService,
  ) {}

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    if (resendKey) {
      const ok = await this.sendViaResend(to, subject, text, html, resendKey);
      if (ok) return true;
      console.warn('[MAIL] Resend failed, falling back to SMTP');
    }

    return this.smtpService.sendMail(to, subject, text, html);
  }

  private async sendViaResend(
    to: string,
    subject: string,
    text: string,
    html: string | undefined,
    apiKey: string,
  ): Promise<boolean> {
    const from = this.config.get<string>('RESEND_FROM') || this.config.get<string>('MAIL_FROM') || 'Messager <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [to.toLowerCase().trim()],
          subject,
          text,
          html: html || text,
        }),
      });
      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        console.error('[MAIL] Resend error:', res.status, data);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[MAIL] Resend failed:', err);
      return false;
    }
  }
}
