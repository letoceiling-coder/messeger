import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useChats } from '@/context/ChatsContext';
import type { Chat } from '@/types/messenger';
import { motion } from 'framer-motion';

/** Создание канала: название, описание, аватар, тип (публичный/приватный). См. FEED_IMPLEMENTATION_PLAN.md блок C */
const CreateChannelPage = () => {
  const navigate = useNavigate();
  const { addChat } = useChats();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите название канала');
      return;
    }
    const channelId = `channel-${Date.now()}`;
    const chat: Chat = {
      id: channelId,
      name: trimmedName,
      avatar: avatarUrl,
      username: username.trim() || undefined,
      isGroup: false,
      isChannel: true,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
    };
    addChat(chat);
    navigate(`/chat/${channelId}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Создать канал</h1>
          <Button size="sm" onClick={handleSubmit}>
            Создать
          </Button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-4">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <Radio className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-muted-foreground mt-2">Аватар канала</p>
        </div>

        <div>
          <Label htmlFor="channel-name">Название канала</Label>
          <Input
            id="channel-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Введите название"
            className="mt-1.5 rounded-xl"
          />
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
        <div>
          <Label htmlFor="channel-username">@username</Label>
          <Input
            id="channel-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="mt-1.5 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="channel-desc">Описание</Label>
          <Textarea
            id="channel-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="О чём канал"
            className="mt-1.5 rounded-xl min-h-[80px] resize-none"
          />
        </div>
        <div>
          <Label className="mb-2 block">Тип канала</Label>
          <div className="flex gap-2">
            <Button
              variant={isPublic ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setIsPublic(true)}
            >
              Публичный
            </Button>
            <Button
              variant={!isPublic ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setIsPublic(false)}
            >
              Приватный
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateChannelPage;
