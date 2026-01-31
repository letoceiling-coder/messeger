import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.user, response.accessToken);
      showSuccess('Вход выполнен успешно');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ошибка входа';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg">
      <div className="max-w-md w-full space-y-8 px-6 py-12">
        {/* Логотип/заголовок */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="text-3xl font-bold text-app-text">
            Вход в Messager
          </h2>
          <p className="mt-2 text-sm text-app-text-secondary">
            Войдите, чтобы начать общение
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-app-error/10 border border-app-error/30 text-app-error px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-app-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full px-4 py-3 bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition-all"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-app-text-secondary mb-2">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full px-4 py-3 bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-app-accent hover:bg-app-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-app-text-secondary">Нет аккаунта? </span>
            <Link
              to="/register"
              className="text-sm font-medium text-app-accent hover:text-app-accent-hover transition-colors"
            >
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
