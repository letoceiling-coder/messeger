import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class SmtpService {
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT') || 465;
    const user = this.config.get<string>('MAIL_USERNAME');
    const pass = this.config.get<string>('MAIL_PASSWORD');

    if (!host || !user || !pass) {
      return null;
    }

    const portNum = Number(port);
    this.transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      ...(portNum === 587 && { requireTLS: true }),
    });

    return this.transporter;
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    const transport = this.getTransporter();
    if (!transport) {
      console.warn('[MAIL] SMTP not configured (MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD)');
      return false;
    }

    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('MAIL_USERNAME') || 'noreply@messager.local';

    try {
      await transport.sendMail({
        from,
        to: to.toLowerCase().trim(),
        subject,
        text,
        html: html || text,
      });
      return true;
    } catch (err) {
      console.error('[MAIL] Send failed:', err);
      return false;
    }
  }
}
