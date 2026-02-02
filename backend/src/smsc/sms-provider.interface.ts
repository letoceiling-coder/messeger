/**
 * Интерфейс SMS-провайдера для сменяемости сервиса.
 * Реализации: SmscProvider (SMSC.ru), MockSmsProvider (тесты), и др.
 */
export interface SmsSendResult {
  success: boolean;
  id?: string | number;
  error?: string;
  errorCode?: number;
}

export interface ISmsProvider {
  sendSms(phone: string, text: string): Promise<SmsSendResult>;
}
