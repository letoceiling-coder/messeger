import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Bell,
  Lock,
  Palette,
  Smartphone,
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  LogOut,
  HelpCircle,
  Type,
  Volume2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import UserAvatar from '@/components/common/Avatar';
import { defaultSettings } from '@/data/mockData';
import { Settings } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  iconBg?: string;
}

const SettingItem = ({
  icon,
  label,
  value,
  onClick,
  danger,
  iconBg,
}: SettingItemProps) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 px-4 py-3 cursor-pointer active:bg-secondary transition-all',
      danger && 'text-destructive'
    )}
  >
    <span
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        iconBg || 'bg-muted',
        danger && 'bg-destructive/10 text-destructive'
      )}
    >
      {icon}
    </span>
    <span className="flex-1 font-medium">{label}</span>
    {value !== undefined ? value : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
  </motion.div>
);

const applyFontSize = (size: 'small' | 'medium' | 'large') => {
  document.documentElement.dataset.fontSize = size;
  const scale = size === 'small' ? 0.9375 : size === 'large' ? 1.0625 : 1;
  document.documentElement.style.fontSize = `${16 * scale}px`;
};

const SETTINGS_STORAGE_KEY = 'messenger-settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return defaultSettings;
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.username || user?.phone || user?.email || 'Пользователь';
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  useEffect(() => {
    applyFontSize(settings.fontSize);
  }, [settings.fontSize]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleThemeChange = (value: string) => {
    const v = value as 'light' | 'dark' | 'system';
    setTheme(v);
    setSettings((s) => ({ ...s, theme: v }));
  };

  const setFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings((s) => ({ ...s, fontSize }));
  };

  const toggleNotifications = () => {
    setSettings((s) => ({ ...s, notifications: !s.notifications }));
  };

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/95 to-primary border-b border-primary/20 pt-safe shadow-soft">
        <div className="h-14 px-4 flex items-center">
          <h1 className="text-xl font-semibold text-white">Настройки</h1>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-8">
        {/* Profile Card — enhanced */}
        <div
          className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border shadow-soft cursor-pointer active:bg-secondary/50 transition-all"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-4">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="p-0.5 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60">
                <div className="p-0.5 rounded-full bg-background">
                  <UserAvatar src={user?.avatarUrl} name={displayName} size="xl" isOnline />
                </div>
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">@{user?.username}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.phone || user?.email}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* Settings Sections with colorful icons */}
        <div className="mt-6 mx-4 rounded-2xl bg-card border border-border overflow-hidden shadow-soft">
          <SettingItem
            icon={<Bell className="h-5 w-5 text-white" />}
            iconBg="bg-red-500"
            label="Уведомления о сообщениях"
            value={<Switch checked={settings.notifications} onCheckedChange={toggleNotifications} />}
          />
          <div className="border-t border-border" />
          <SettingItem
            icon={<Volume2 className="h-5 w-5 text-white" />}
            iconBg="bg-amber-500"
            label="Звуки"
            value={
              <Switch
                checked={settings.sounds}
                onCheckedChange={() => setSettings((s) => ({ ...s, sounds: !s.sounds }))}
              />
            }
          />
          <div className="border-t border-border" />
          <SettingItem
            icon={<Smartphone className="h-5 w-5 text-white" />}
            iconBg="bg-orange-500/80"
            label="Вибрация"
            value={
              <Switch
                checked={settings.vibration}
                onCheckedChange={() => setSettings((s) => ({ ...s, vibration: !s.vibration }))}
              />
            }
          />
        </div>

        <div className="mt-4 mx-4 rounded-2xl bg-card border border-border overflow-hidden shadow-soft">
          <SettingItem
            icon={<Lock className="h-5 w-5 text-white" />}
            iconBg="bg-blue-500"
            label="Приватность"
          />
          <div className="border-t border-border" />
          <SettingItem
            icon={<Shield className="h-5 w-5 text-white" />}
            iconBg="bg-green-500"
            label="Безопасность"
          />
        </div>

        <div className="mt-4 mx-4 rounded-2xl bg-card border border-border overflow-hidden shadow-soft">
          <SettingItem
            icon={<Palette className="h-5 w-5 text-white" />}
            iconBg="bg-violet-500"
            label="Внешний вид"
            onClick={() => setAppearanceOpen(true)}
          />
        </div>

        <div className="mt-4 mx-4 rounded-2xl bg-card border border-border overflow-hidden shadow-soft">
          <SettingItem
            icon={<Smartphone className="h-5 w-5 text-white" />}
            iconBg="bg-orange-500"
            label="Устройства"
          />
          <div className="border-t border-border" />
          <SettingItem
            icon={<HelpCircle className="h-5 w-5 text-white" />}
            iconBg="bg-cyan-500"
            label="Помощь"
          />
        </div>

        <div className="mt-4 mx-4 rounded-2xl bg-card border border-border overflow-hidden shadow-soft">
          <SettingItem
            icon={<LogOut className="h-5 w-5" />}
            label="Выйти"
            danger
            onClick={() => setLogoutOpen(true)}
          />
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Messenger v1.0.0</p>
        </div>
      </motion.div>

      {/* Logout confirmation */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl shadow-modal max-w-[calc(100%-32px)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы сможете снова войти, используя свой номер телефона.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Appearance dialog — Theme + Font size */}
      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <DialogContent className="rounded-2xl shadow-modal max-w-[calc(100%-32px)]">
          <DialogHeader>
            <DialogTitle>Внешний вид</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4" />
                Тема
              </Label>
              <RadioGroup
                value={theme ?? settings.theme}
                onValueChange={handleThemeChange}
                className="flex flex-col gap-2"
              >
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Sun className="h-5 w-5 text-muted-foreground" />
                  <span>Светлая</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <span>Тёмная</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span>Как в системе</span>
                </label>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Type className="h-4 w-4" />
                Размер шрифта
              </Label>
              <RadioGroup
                value={settings.fontSize}
                onValueChange={(v) => setFontSize(v as 'small' | 'medium' | 'large')}
                className="flex flex-col gap-2"
              >
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="small" id="font-small" />
                  <span className="text-sm">Маленький</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="medium" id="font-medium" />
                  <span>Обычный</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="large" id="font-large" />
                  <span className="text-lg">Крупный</span>
                </label>
              </RadioGroup>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
