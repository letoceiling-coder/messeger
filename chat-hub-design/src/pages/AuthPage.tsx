import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Маска: +7 (XXX) XXX-XX-XX. value — только цифры (до 10 после 7). */
function formatPhone(value: string): { formatted: string; digits: string } {
  const digits = value.replace(/\D/g, '').replace(/^[78]?/, '').slice(0, 10);
  if (digits.length === 0) return { formatted: '+7 ', digits: '' };
  const d = digits.split('');
  const a = d[0] ?? '';
  const b = d[1] ?? '';
  const c = d[2] ?? '';
  const rest = d.slice(3).join('');
  let formatted = `+7 (${a}${b}${c}`;
  if (d.length > 3) formatted += `) ${rest.slice(0, 3)}`;
  if (d.length > 6) formatted += `-${rest.slice(3, 5)}`;
  if (d.length > 8) formatted += `-${rest.slice(5, 7)}`;
  return { formatted, digits };
}

function formatPhoneDisplay(formatted: string): string {
  return formatted.trim() || '+7 ';
}

/** Форматировать номер для отображения (например +79991234567 → +7 (999) 123-45-67) */
function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^[78]?/, '').slice(-10);
  return formatPhone(digits).formatted;
}

export default function AuthPage() {
  const { requestCode, verifyCode, pendingPhone, error, clearError } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>(pendingPhone ? 'code' : 'phone');
  const [phoneValue, setPhoneValue] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pendingPhone) setStep('code');
  }, [pendingPhone]);

  const { formatted: phoneFormatted, digits: phoneDigits } = formatPhone(phoneValue);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').replace(/^[78]?/, '').slice(0, 10);
    setPhoneValue(raw);
    clearError();
  }, [clearError]);

  const handlePhoneSubmit = useCallback(async () => {
    const digits = phoneValue.replace(/\D/g, '').replace(/^[78]?/, '').slice(0, 10);
    if (digits.length < 10) return;
    const normalized = `+7${digits}`;
    setLoading(true);
    try {
      await requestCode(normalized);
      setStep('code');
    } catch {
      // ошибка уже в error из контекста
    } finally {
      setLoading(false);
    }
  }, [phoneValue, requestCode]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCodeValue(v);
    clearError();
  }, [clearError]);

  const handleCodeSubmit = useCallback(async () => {
    if (codeValue.length !== 4) return;
    setLoading(true);
    try {
      const ok = await verifyCode(codeValue);
      if (!ok) return;
      setCodeValue('');
    } finally {
      setLoading(false);
    }
  }, [codeValue, verifyCode]);

  const handleBackToPhone = useCallback(() => {
    setStep('phone');
    setCodeValue('');
    clearError();
  }, [clearError]);

  const phoneComplete = phoneDigits.length >= 10;
  const displayPhoneFormatted = pendingPhone ? displayPhone(pendingPhone) : formatPhoneDisplay(phoneFormatted);
  const codeError = !!error && step === 'code';

  return (
    <div className="min-h-screen flex flex-col bg-background pt-safe">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            {step === 'phone' ? 'Введите номер телефона' : 'Код из SMS'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 'phone'
              ? 'Мы отправим вам SMS с кодом подтверждения'
              : `Код отправлен на ${displayPhoneFormatted}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="+7 (999) 123-45-67"
                value={formatPhoneDisplay(phoneFormatted)}
                onChange={handlePhoneChange}
                className={cn(
                  'h-12 rounded-xl border-2 text-base transition-colors',
                  'border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20'
                )}
                aria-label="Номер телефона"
              />
            </div>
            {error && step === 'phone' && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
              disabled={!phoneComplete || loading}
              onClick={handlePhoneSubmit}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="1234"
              value={codeValue}
              onChange={handleCodeChange}
              maxLength={4}
              className={cn(
                'h-12 rounded-xl border-2 text-center text-lg tracking-[0.4em] transition-colors',
                'border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20',
                codeError && 'border-destructive focus-visible:border-destructive'
              )}
              aria-label="Код подтверждения"
              aria-invalid={codeError}
            />
            {(codeError || error) && (
              <p className="text-sm text-destructive text-center">{error || 'Неверный код'}</p>
            )}
            <Button
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
              disabled={codeValue.length !== 4 || loading}
              onClick={handleCodeSubmit}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleBackToPhone}
            >
              Изменить номер
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
