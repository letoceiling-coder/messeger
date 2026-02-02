import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ISmsProvider, SmsSendResult } from './sms-provider.interface';

/**
 * Формат номера для SMSC.ru API:
 * - Канонический: 79001234567 (11 цифр, 7 в начале)
 * - Также принимают: +79001234567, 89001234567, 9001234567
 *
 * Маска в AuthPage: +7 (999) 123-45-67 → normalized: +79991234567
 * digits после strip: 9991234567 (10 цифр)
 */
/**
 * Нормализация номера для SMSC.ru: 7XXXXXXXXXX (11 цифр).
 * Маска +7 (999) 123-45-67 → digits 9991234567 → 79991234567
 * 89897625658 → 79897625658
 */
export function normalizePhoneForSmsc(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10); // 10 цифр без кода страны
    return `7${last10}`;
  }
  return digits;
}

@Injectable()
export class SmscService implements ISmsProvider {
  private readonly baseUrl = 'https://smsc.ru';

  constructor(private config: ConfigService) {}

  /**
   * Отправка SMS через SMSC.ru HTTP API.
   * Номер нормализуется в формат 7XXXXXXXXXX.
   */
  async sendSms(phone: string, text: string): Promise<SmsSendResult> {
    const login = this.config.get<string>('SMSC_LOGIN');
    const psw = this.config.get<string>('SMSC_PASSWORD');

    if (!login || !psw) {
      return {
        success: false,
        error: 'SMSC credentials not configured (SMSC_LOGIN, SMSC_PASSWORD)',
        errorCode: -1,
      };
    }

    const phones = normalizePhoneForSmsc(phone);
    if (phones.length < 11) {
      return {
        success: false,
        error: `Invalid phone format: ${phone}`,
        errorCode: -2,
      };
    }

    try {
      // POST с JSON — корректная передача UTF-8, без проблем с URL-кодировкой кириллицы
      const url = `${this.baseUrl}/rest/send/`;
      const body = {
        login,
        psw,
        phones,
        mes: text,
        charset: 'utf-8',
        fmt: 3,
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { id?: number; cnt?: number; error?: string; error_code?: number };

      if (data.error || data.error_code) {
        return {
          success: false,
          error: data.error ?? 'Unknown error',
          errorCode: data.error_code ?? -1,
        };
      }

      return {
        success: true,
        id: data.id,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `SMSC request failed: ${message}`,
        errorCode: -3,
      };
    }
  }
}
