import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { getStoredTheme, saveTheme, applyTheme, Theme } from '../utils/theme';

export const SettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Настройки уведомлений (localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('settings_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const saved = localStorage.getItem('settings_vibration_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('settings_notifications_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Настройки конфиденциальности (localStorage)
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
    const saved = localStorage.getItem('settings_show_online_status');
    return saved !== null ? saved === 'true' : true;
  });
  const [showLastSeen, setShowLastSeen] = useState(() => {
    const saved = localStorage.getItem('settings_show_last_seen');
    return saved !== null ? saved === 'true' : true;
  });

  // Настройки темы
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера (макс 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Размер файла не должен превышать 5 МБ');
      return;
    }

    // Проверка формата
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Допустимы только изображения (JPEG, PNG, GIF, WebP)');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newAvatarUrl = response.data.avatarUrl;
      setAvatarUrl(newAvatarUrl);
      updateUser({ ...user!, avatarUrl: newAvatarUrl });
      showSuccess('Аватар успешно обновлен');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      showError('Имя пользователя не может быть пустым');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch('/users/me', { username: username.trim() });
      updateUser(response.data);
      showSuccess('Профиль успешно обновлён');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showSuccess('Вы вышли из аккаунта');
  };

  const getAvatarUrl = () => {
    if (!avatarUrl) return null;
    // Если URL относительный, добавляем базовый URL
    return avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${avatarUrl}`;
  };

  // Обработчики настроек уведомлений
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('settings_sound_enabled', String(enabled));
    showSuccess(enabled ? 'Звук уведомлений включён' : 'Звук уведомлений выключен');
  };

  const handleToggleVibration = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    localStorage.setItem('settings_vibration_enabled', String(enabled));
    showSuccess(enabled ? 'Вибрация включена' : 'Вибрация выключена');
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('settings_notifications_enabled', String(enabled));
    showSuccess(enabled ? 'Уведомления включены' : 'Уведомления выключены');
  };

  // Обработчики настроек конфиденциальности
  const handleToggleOnlineStatus = (enabled: boolean) => {
    setShowOnlineStatus(enabled);
    localStorage.setItem('settings_show_online_status', String(enabled));
    showSuccess(enabled ? 'Статус "в сети" виден другим' : 'Статус "в сети" скрыт');
  };

  const handleToggleLastSeen = (enabled: boolean) => {
    setShowLastSeen(enabled);
    localStorage.setItem('settings_show_last_seen', String(enabled));
    showSuccess(enabled ? '"Был(а) в сети" виден другим' : '"Был(а) в сети" скрыт');
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-app-bg text-app-text">
      {/* Шапка */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-app-border">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-app-text-secondary hover:text-app-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>
        <h1 className="text-lg font-semibold">Настройки</h1>
        <div className="w-16" /> {/* Для центрирования заголовка */}
      </header>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-8">
          {/* Профиль */}
          <section>
            <h2 className="text-xl font-bold mb-4">Профиль</h2>

            {/* Аватар */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="relative w-24 h-24 rounded-full bg-app-surface flex items-center justify-center text-3xl font-semibold overflow-hidden hover:opacity-80 transition-opacity disabled:cursor-not-allowed group"
                >
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()!} alt="Аватар" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-app-text-secondary">{username.charAt(0).toUpperCase()}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-app-text mb-1">Фото профиля</p>
                <p className="text-xs text-app-text-secondary">Нажмите, чтобы изменить</p>
                <p className="text-xs text-app-text-secondary mt-1">До 5 МБ, JPEG/PNG/GIF/WebP</p>
              </div>
            </div>

            {/* Имя пользователя */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-app-text-secondary mb-2">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-app-surface border border-app-border rounded-xl text-app-text placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition-all"
                placeholder="Ваше имя"
              />
            </div>

            {/* Email (только для чтения) */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-app-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="block w-full px-4 py-3 bg-app-surface/50 border border-app-border rounded-xl text-app-text-secondary cursor-not-allowed"
              />
            </div>

            {/* Кнопка сохранения */}
            <button
              onClick={handleSaveProfile}
              disabled={saving || username === user?.username}
              className="w-full py-3 px-4 bg-app-accent hover:bg-app-accent-hover text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </section>

          {/* Уведомления */}
          <section className="pt-6 border-t border-app-border">
            <h2 className="text-xl font-bold mb-4">Уведомления</h2>

            {/* Включить уведомления */}
            <div className="flex items-center justify-between py-3 px-4 bg-app-surface rounded-xl mb-3">
              <div>
                <p className="text-sm font-medium text-app-text">Уведомления</p>
                <p className="text-xs text-app-text-secondary mt-0.5">Получать уведомления о новых сообщениях</p>
              </div>
              <button
                onClick={() => handleToggleNotifications(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-app-accent' : 'bg-app-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Звук */}
            <div className="flex items-center justify-between py-3 px-4 bg-app-surface rounded-xl mb-3">
              <div>
                <p className="text-sm font-medium text-app-text">Звук</p>
                <p className="text-xs text-app-text-secondary mt-0.5">Воспроизводить звук при новом сообщении</p>
              </div>
              <button
                onClick={() => handleToggleSound(!soundEnabled)}
                disabled={!notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  soundEnabled ? 'bg-app-accent' : 'bg-app-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Вибрация */}
            <div className="flex items-center justify-between py-3 px-4 bg-app-surface rounded-xl">
              <div>
                <p className="text-sm font-medium text-app-text">Вибрация</p>
                <p className="text-xs text-app-text-secondary mt-0.5">Вибрировать при новом сообщении (мобильные)</p>
              </div>
              <button
                onClick={() => handleToggleVibration(!vibrationEnabled)}
                disabled={!notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  vibrationEnabled ? 'bg-app-accent' : 'bg-app-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Тема */}
          <section className="pt-6 border-t border-app-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Тема оформления
            </h2>

            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'bg-app-accent text-white'
                    : 'bg-app-surface-hover text-app-text-secondary hover:bg-app-surface hover:text-app-text'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Светлая
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-app-accent text-white'
                    : 'bg-app-surface-hover text-app-text-secondary hover:bg-app-surface hover:text-app-text'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Тёмная
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  theme === 'system'
                    ? 'bg-app-accent text-white'
                    : 'bg-app-surface-hover text-app-text-secondary hover:bg-app-surface hover:text-app-text'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Системная
              </button>
            </div>
          </section>

          {/* Конфиденциальность */}
          <section className="pt-6 border-t border-app-border">
            <h2 className="text-xl font-bold mb-4">Конфиденциальность</h2>

            {/* Показывать "в сети" */}
            <div className="flex items-center justify-between py-3 px-4 bg-app-surface rounded-xl mb-3">
              <div>
                <p className="text-sm font-medium text-app-text">Статус "в сети"</p>
                <p className="text-xs text-app-text-secondary mt-0.5">Другие видят, когда вы онлайн</p>
              </div>
              <button
                onClick={() => handleToggleOnlineStatus(!showOnlineStatus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnlineStatus ? 'bg-app-accent' : 'bg-app-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Показывать "был(а) в сети" */}
            <div className="flex items-center justify-between py-3 px-4 bg-app-surface rounded-xl">
              <div>
                <p className="text-sm font-medium text-app-text">Последняя активность</p>
                <p className="text-xs text-app-text-secondary mt-0.5">Другие видят, когда вы были в сети</p>
              </div>
              <button
                onClick={() => handleToggleLastSeen(!showLastSeen)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showLastSeen ? 'bg-app-accent' : 'bg-app-surface-hover'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showLastSeen ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Выход */}
          <section className="pt-6 border-t border-app-border">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-app-error/10 hover:bg-app-error/20 text-app-error font-medium rounded-xl transition-all"
            >
              Выйти из аккаунта
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
