import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, MapPin, Lock, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFeed } from '@/context/FeedContext';
import type { FeedMedia } from '@/types/feed';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CURRENT_USER_ID = 'user-1';
const PLACEHOLDER_IMAGE = '/placeholder.svg';
const MAX_MEDIA = 10;

/** Извлечь хештеги из подписи (#слово, латиница + кириллица) */
function parseHashtags(text: string): string[] {
  const matches = text.match(/#[\wа-яА-ЯёЁ]+/gi);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

/** Создание поста: карусель фото/видео, подпись с хештегами, превью. См. FEED_IMPLEMENTATION_PLAN.md п. 3 */
const FeedCreatePage = () => {
  const navigate = useNavigate();
  const { addPost } = useFeed();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers_only'>('public');
  const [media, setMedia] = useState<FeedMedia[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newItems: FeedMedia[] = [];
    for (let i = 0; i < files.length && media.length + newItems.length < MAX_MEDIA; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      newItems.push({ id: `m-${Date.now()}-${i}`, type, url });
    }
    setMedia((prev) => [...prev, ...newItems]);
    setPreviewIndex(media.length);
    e.target.value = '';
  }, [media.length]);

  const removeMedia = useCallback((id: string) => {
    setMedia((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setPreviewIndex((i) => (i >= next.length ? Math.max(0, next.length - 1) : i));
      return next;
    });
  }, []);

  const hashtags = useMemo(() => parseHashtags(caption), [caption]);

  const handlePublish = useCallback(() => {
    const mediaToUse =
      media.length > 0
        ? media
        : [{ id: 'm-placeholder', type: 'image' as const, url: PLACEHOLDER_IMAGE }];
    addPost({
      authorId: CURRENT_USER_ID,
      media: mediaToUse,
      caption: caption.trim(),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      location: location.trim() || undefined,
      visibility,
    });
    navigate('/feed', { replace: true });
  }, [addPost, caption, hashtags, location, visibility, media, navigate]);

  const currentPreview = media[previewIndex] ?? media[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Создать пост</h1>
          <Button size="sm" onClick={handlePublish}>
            Опубликовать
          </Button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4" />
            Фото или видео (до {MAX_MEDIA})
          </Label>
          <Button
            variant="outline"
            className="w-full h-24 rounded-xl border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={media.length >= MAX_MEDIA}
          >
            {media.length >= MAX_MEDIA
              ? 'Достигнут лимит'
              : `Добавить файлы (${media.length}/${MAX_MEDIA})`}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />

          {media.length > 0 && (
            <>
              <div className="mt-2 relative rounded-xl overflow-hidden aspect-square max-h-64 bg-muted">
                {currentPreview.type === 'image' ? (
                  <img
                    src={currentPreview.url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={currentPreview.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
                {media.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          i === previewIndex ? 'bg-primary' : 'bg-white/60'
                        )}
                        aria-label={`Слайд ${i + 1}`}
                        onClick={() => setPreviewIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {media.map((m, i) => (
                  <div
                    key={m.id}
                    className={cn(
                      'relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2',
                      i === previewIndex ? 'border-primary' : 'border-transparent'
                    )}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-muted"
                      onClick={() => setPreviewIndex(i)}
                    >
                      {m.type === 'image' ? (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Видео</span>
                      )}
                    </button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full"
                      aria-label="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(m.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="create-caption">Подпись (хештеги #tag, теги @имя)</Label>
          <Textarea
            id="create-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Добавьте подпись..."
            className="mt-1.5 rounded-xl min-h-[80px] resize-none"
          />
          {hashtags.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Хештеги: {hashtags.map((h) => `#${h}`).join(' ')}
            </p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            Геолокация
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Добавить место"
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="mb-2 block">Кто может видеть пост</Label>
          <div className="flex gap-2">
            <Button
              variant={visibility === 'public' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setVisibility('public')}
            >
              <Globe className="h-4 w-4 mr-1" />
              Публично
            </Button>
            <Button
              variant={visibility === 'followers_only' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setVisibility('followers_only')}
            >
              <Lock className="h-4 w-4 mr-1" />
              Только подписчики
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedCreatePage;
