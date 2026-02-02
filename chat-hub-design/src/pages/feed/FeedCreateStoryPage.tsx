import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFeed } from '@/context/FeedContext';
import type { FeedMedia } from '@/types/feed';
import { motion } from 'framer-motion';

const CURRENT_USER_ID = 'user-1';

/** Создание истории: фото/видео, текст/стикеры (опционально). См. FEED_IMPLEMENTATION_PLAN п. 8.8 */
const FeedCreateStoryPage = () => {
  const navigate = useNavigate();
  const { addStory } = useFeed();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<FeedMedia | null>(null);
  const [overlayText, setOverlayText] = useState('');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMedia({ id: `sm-${Date.now()}`, type, url });
    e.target.value = '';
  }, []);

  const handlePublish = useCallback(() => {
    if (!media) return;
    addStory({
      authorId: CURRENT_USER_ID,
      media,
      overlayText: overlayText.trim() || undefined,
    });
    navigate('/feed', { replace: true });
  }, [addStory, media, overlayText, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Создать историю</h1>
          <Button size="sm" onClick={handlePublish} disabled={!media}>
            Опубликовать
          </Button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4" />
            Фото или видео
          </Label>
          <Button
            variant="outline"
            className="w-full h-32 rounded-xl border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            {media ? 'Изменить файл' : 'Выбрать файл (JPG, PNG, GIF, MP4…)'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {media && (
            <div className="mt-2 relative rounded-xl overflow-hidden aspect-[9/16] max-h-96 bg-muted mx-auto">
              {media.type === 'image' ? (
                <img src={media.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={media.url} controls className="w-full h-full object-cover" />
              )}
              {overlayText && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center text-lg font-semibold drop-shadow-lg">
                    {overlayText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="story-text">Текст на истории (опционально)</Label>
          <Textarea
            id="story-text"
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Добавьте текст..."
            className="mt-1.5 rounded-xl min-h-[60px] resize-none"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          История будет видна подписчикам в течение 24 часов.
        </p>
      </motion.div>
    </div>
  );
};

export default FeedCreateStoryPage;
