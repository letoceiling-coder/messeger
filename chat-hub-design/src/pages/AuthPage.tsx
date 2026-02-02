import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AuthChannel } from '@/context/AuthContext';

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

/** Форматировать номер для отображения (например +79991234567 → +7 (999) 123-45-67) */
function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^[78]?/, '').slice(-10);
  return formatPhone(digits).formatted;
}

/** Маскировать email для отображения (user@domain.com → u***r@domain.com) */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export default function AuthPage() {
  const { requestCode, verifyCode, pendingIdentifier, pendingChannel, authModes, error, clearError } = useAuth();
  const [step, setStep] = useState<'input' | 'code'>(pendingIdentifier ? 'code' : 'input');
  const [channel, setChannel] = useState<AuthChannel>(authModes.includes('phone') ? 'phone' : 'email');
  const [phoneValue, setPhoneValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pendingIdentifier) setStep('code');
  }, [pendingIdentifier]);

  useEffect(() => {
    if (authModes.length === 1) setChannel(authModes[0]);
  }, [authModes]);

  const { formatted: phoneFormatted, digits: phoneDigits } = formatPhone(phoneValue);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').replace(/^[78]?/, '').slice(0, 10);
    setPhoneValue(raw);
    clearError();
  }, [clearError]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value.trim());
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(async () => {
    if (channel === 'phone') {
      const digits = phoneValue.replace(/\D/g, '').replace(/^[78]?/, '').slice(0, 10);
      if (digits.length < 10) return;
      const normalized = `+7${digits}`;
      setLoading(true);
      try {
        await requestCode(normalized, 'phone');
        setStep('code');
      } finally {
        setLoading(false);
      }
    } else {
      const email = emailValue.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      setLoading(true);
      try {
        await requestCode(email, 'email');
        setStep('code');
      } finally {
        setLoading(false);
      }
    }
  }, [channel, phoneValue, emailValue, requestCode]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodeValue(v);
    clearError();
  }, [clearError]);

  const handleCodeSubmit = useCallback(async () => {
    if (codeValue.length < 4) return;
    setLoading(true);
    try {
      const ok = await verifyCode(codeValue);
      if (!ok) return;
      setCodeValue('');
    } finally {
      setLoading(false);
    }
  }, [codeValue, verifyCode]);

  const handleBack = useCallback(() => {
    setStep('input');
    setCodeValue('');
    clearError();
  }, [clearError]);

  const canSubmit =
    channel === 'phone'
      ? phoneDigits.length >= 10
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim());

  const displayIdentifier = pendingIdentifier
    ? pendingChannel === 'phone'
      ? displayPhone(pendingIdentifier)
      : maskEmail(pendingIdentifier)
    : '';

  const codePlaceholder = channel === 'phone' ? '1234' : 'Введите код из письма';

  return (
    <div className="min-h-screen flex flex-col bg-background pt-safe">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            {step === 'input'
              ? channel === 'phone'
                ? 'Введите номер телефона'
                : 'Введите email'
              : 'Код подтверждения'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 'input'
              ? channel === 'phone'
                ? 'Мы отправим SMS с кодом подтверждения'
                : 'Мы отправим код на вашу почту'
              : pendingChannel === 'phone'
                ? `Код отправлен на ${displayIdentifier}`
                : `Код отправлен на ${displayIdentifier}`}
          </p>
        </div>

        {step === 'input' ? (
          <div className="space-y-4">
            {authModes.length > 1 && (
              <div className="flex rounded-xl border border-input overflow-hidden">
                {authModes.includes('phone') && (
                  <button
                    type="button"
                    onClick={() => { setChannel('phone'); clearError(); }}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-medium transition-colors',
                      channel === 'phone'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Телефон
                  </button>
                )}
                {authModes.includes('email') && (
                  <button
                    type="button"
                    onClick={() => { setChannel('email'); clearError(); }}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-medium transition-colors',
                      channel === 'email'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Email
                  </button>
                )}
              </div>
            )}

            {channel === 'phone' ? (
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="+7 (999) 123-45-67"
                value={phoneFormatted.trim() || '+7 '}
                onChange={handlePhoneChange}
                className="h-12 rounded-xl border-2 text-base border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20"
                aria-label="Номер телефона"
              />
            ) : (
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={emailValue}
                onChange={handleEmailChange}
                className="h-12 rounded-xl border-2 text-base border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20"
                aria-label="Email"
              />
            )}

            {error && step === 'input' && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={codePlaceholder}
              value={codeValue}
              onChange={handleCodeChange}
              maxLength={6}
              className={cn(
                'h-12 rounded-xl border-2 text-center text-lg tracking-[0.4em]',
                'border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20',
                !!error && step === 'code' && 'border-destructive focus-visible:border-destructive'
              )}
              aria-label="Код подтверждения"
              aria-invalid={!!error && step === 'code'}
            />
            {(!!error || step === 'code') && error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
              disabled={codeValue.length < 4 || loading}
              onClick={handleCodeSubmit}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleBack}>
              Изменить {pendingChannel === 'phone' ? 'номер' : 'email'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
