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

export type AuthChannel = 'phone' | 'email';

interface AuthContextValue {
  user: AuthUser | null;
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCode: (phoneOrEmail: string, channel: AuthChannel) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  logout: () => void;
  pendingIdentifier: string | null;
  pendingChannel: AuthChannel | null;
  authModes: AuthChannel[];
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
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(null);
  const [pendingChannel, setPendingChannel] = useState<AuthChannel | null>(null);
  const [authModes, setAuthModes] = useState<AuthChannel[]>(['phone', 'email']);
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

  useEffect(() => {
    api.get<{ modes: string[] }>('/auth/config').then((r) => {
      const m = (r.modes || []) as AuthChannel[];
      setAuthModes(m.length ? m : ['phone', 'email']);
    }).catch(() => setAuthModes(['phone', 'email']));
  }, []);

  const requestCode = useCallback(async (value: string, channel: AuthChannel) => {
    setError(null);
    let body: { phone?: string; email?: string };
    if (channel === 'phone') {
      const digits = value.replace(/\D/g, '');
      const normalized = digits.length >= 10 ? `+7${digits.slice(-10)}` : '';
      if (!normalized) return;
      body = { phone: normalized };
      setPendingIdentifier(normalized);
    } else {
      const email = value.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      body = { email };
      setPendingIdentifier(email);
    }
    setPendingChannel(channel);

    try {
      await api.post('/auth/send-code', body);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось отправить код';
      setError(typeof message === 'string' ? message : 'Ошибка отправки');
      throw err;
    }
  }, []);

  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      const id = pendingIdentifier;
      const ch = pendingChannel;
      if (!id || !ch) return false;

      setError(null);
      const body = ch === 'phone' ? { phone: id, code } : { email: id, code };

      try {
        const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/verify-code', body);
        localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
        setIsAuthenticated(true);
        setPendingIdentifier(null);
        setPendingChannel(null);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Неверный код';
        setError(typeof msg === 'string' ? msg : 'Неверный код');
        return false;
      }
    },
    [pendingIdentifier, pendingChannel]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setPendingIdentifier(null);
    setPendingChannel(null);
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
      pendingIdentifier,
      pendingChannel,
      authModes,
      error,
      clearError,
    }),
    [user, isAuthenticated, isLoading, requestCode, verifyCode, logout, pendingIdentifier, pendingChannel, authModes, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
