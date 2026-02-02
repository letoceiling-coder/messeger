import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { api } from '@/services/api';

const AUTH_STORAGE_KEY = 'messenger-auth';
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_STORAGE_KEY = 'user';

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  username: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  logout: () => void;
  pendingPhone: string | null;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Для обратной совместимости: phone из user или старого ключа */
function getPhoneFromStorage(): string | null {
  const user = loadStoredUser();
  if (user?.phone) return user.phone;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const { phone } = JSON.parse(raw) as { phone?: string };
    return phone || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.get<AuthUser>('/users/me');
      setUser(me);
      setIsAuthenticated(true);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const requestCode = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.length >= 10 ? `+7${digits.slice(-10)}` : '';
    if (!normalized) return;

    setError(null);
    setPendingPhone(normalized);

    try {
      await api.post('/auth/send-code', { phone: normalized });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Не удалось отправить код';
      setError(typeof message === 'string' ? message : 'Ошибка отправки');
      throw err;
    }
  }, []);

  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      const phone = pendingPhone;
      if (!phone) return false;

      setError(null);

      try {
        const res = await api.post<{ accessToken: string; user: AuthUser }>(
          '/auth/verify-code',
          { phone, code }
        );
        localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
        setIsAuthenticated(true);
        setPendingPhone(null);
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Неверный код';
        setError(typeof msg === 'string' ? msg : 'Неверный код');
        return false;
      }
    },
    [pendingPhone]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setPendingPhone(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      phone: user?.phone ?? getPhoneFromStorage(),
      isAuthenticated,
      isLoading,
      requestCode,
      verifyCode,
      logout,
      pendingPhone,
      error,
      clearError,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      requestCode,
      verifyCode,
      logout,
      pendingPhone,
      error,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
