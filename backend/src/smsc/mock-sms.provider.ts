import { Injectable } from '@nestjs/common';
import type { ISmsProvider, SmsSendResult } from './sms-provider.interface';

/**
 * Mock SMS-провайдер для тестов и dev без реальной отправки.
 * Логирует в консоль, возвращает success.
 */
@Injectable()
export class MockSmsProvider implements ISmsProvider {
  async sendSms(phone: string, text: string): Promise<SmsSendResult> {
    console.log(`[MockSms] Отправка на ${phone}: ${text}`);
    return { success: true, id: 'mock-' + Date.now() };
  }
}
