import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Share2, Phone, AtSign, Mail, Calendar, Camera, Video, X, Radio, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import UserAvatar from '@/components/common/Avatar';
import { currentUser } from '@/data/mockData';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PROFILE_VIDEO_MAX_SEC = 5;

const ProfilePage = () => {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username ?? '');
  const [email, setEmail] = useState(currentUser.email ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.dateOfBirth ?? '');
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatar);
  const [profileVideoUrl, setProfileVideoUrl] = useState<string | undefined>(currentUser.profileVideoUrl);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    // При API: сохранить на сервер
    setIsEditing(false);
  }, []);

  const handleCancel = useCallback(() => {
    setName(currentUser.name);
    setUsername(currentUser.username ?? '');
    setEmail(currentUser.email ?? '');
    setDateOfBirth(currentUser.dateOfBirth ?? '');
    setBio(currentUser.bio ?? '');
    setAvatarUrl(currentUser.avatar);
    setProfileVideoUrl(currentUser.profileVideoUrl);
    setVideoError(null);
    setIsEditing(false);
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    e.target.value = '';
  }, []);

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    setVideoError(null);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.duration > PROFILE_VIDEO_MAX_SEC) {
        window.URL.revokeObjectURL(url);
        setVideoError(`Видео должно быть не длиннее ${PROFILE_VIDEO_MAX_SEC} сек.`);
        return;
      }
      setProfileVideoUrl(url);
    };
    video.src = url;
    e.target.value = '';
  }, []);

  const removeProfileVideo = useCallback(() => {
    if (profileVideoUrl) URL.revokeObjectURL(profileVideoUrl);
    setProfileVideoUrl(undefined);
    setVideoError(null);
  }, [profileVideoUrl]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Профиль</h1>
          {!isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Редактировать">
                <Edit className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Поделиться">
                <Share2 className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave}>
                Сохранить
              </Button>
            </>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 flex flex-col items-center max-w-lg mx-auto"
      >
        {/* Аватар — настройки (в просмотре и редактировании можно сменить фото) */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="block rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Изменить фото"
          >
            <UserAvatar src={avatarUrl} name={name} size="2xl" isOnline />
          </button>
          {isEditing && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="h-8 w-8" />
            </span>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {!isEditing ? (
          <>
            <h2 className="mt-4 text-xl font-semibold">{name}</h2>
            {username && (
              <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <AtSign className="h-4 w-4" />
                @{username}
              </p>
            )}
            {email && (
              <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                <Mail className="h-4 w-4" />
                {email}
              </p>
            )}
            {dateOfBirth && (
              <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(dateOfBirth + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {bio && <p className="mt-4 text-center text-muted-foreground">{bio}</p>}
            {currentUser.phone && (
              <a
                href={`tel:${currentUser.phone.replace(/\s/g, '')}`}
                className="mt-4 flex items-center gap-2 text-primary"
              >
                <Phone className="h-4 w-4" />
                {currentUser.phone}
              </a>
            )}

            {/* Видео профиля (5 сек) */}
            <div className="w-full mt-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Video className="h-4 w-4" />
                Видео профиля (до {PROFILE_VIDEO_MAX_SEC} сек)
              </h3>
              {profileVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[9/16] max-h-64">
                  <video
                    src={profileVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                    playsInline
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full h-8 w-8"
                    onClick={() => setIsEditing(true)}
                    aria-label="Изменить видео"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 rounded-xl border-dashed"
                  onClick={() => setIsEditing(true)}
                >
                  <span className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Добавить видео
                  </span>
                </Button>
              )}
            </div>

            {/* Дополнительные настройки: создание канала и личная лента */}
            <div className="w-full mt-8 pt-6 border-t border-border space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Дополнительные настройки</h3>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl h-12"
                onClick={() => navigate('/channel/create')}
              >
                <Radio className="h-5 w-5 mr-3" />
                Создать канал
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl h-12"
                onClick={() => navigate('/feed')}
              >
                <LayoutGrid className="h-5 w-5 mr-3" />
                Личная лента
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full mt-6 space-y-4">
            <div>
              <Label htmlFor="profile-name">Имя</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 rounded-xl"
                placeholder="Имя"
              />
            </div>
            <div>
              <Label htmlFor="profile-username">Никнейм</Label>
              <Input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 rounded-xl"
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="profile-email">Почта</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 rounded-xl"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="profile-dob">Дата рождения</Label>
              <Input
                id="profile-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="profile-bio">О себе</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1.5 rounded-xl min-h-[100px] resize-none"
                placeholder="Расскажите о себе"
              />
            </div>

            {/* Видео профиля в режиме редактирования */}
            <div>
              <Label className="flex items-center gap-2 mb-1.5">
                <Video className="h-4 w-4" />
                Видео профиля (до {PROFILE_VIDEO_MAX_SEC} сек)
              </Label>
              {profileVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[9/16] max-h-48">
                  <video src={profileVideoUrl} controls className="w-full h-full object-cover" playsInline />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full h-8 w-8"
                    onClick={removeProfileVideo}
                    aria-label="Удалить видео"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-20 rounded-xl border-dashed',
                    videoError && 'border-destructive'
                  )}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <span className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Добавить видео
                  </span>
                </Button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoChange}
              />
              {videoError && (
                <p className="text-sm text-destructive mt-1.5">{videoError}</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
