import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, RefreshCw, Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { useFeed } from '@/context/FeedContext';
import StoriesViewer from '@/components/feed/StoriesViewer';
import SharePostSheet from '@/components/feed/SharePostSheet';
import PostCaptionWithHashtags from '@/components/feed/PostCaptionWithHashtags';
import EmptyState from '@/components/common/EmptyState';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { FeedPostSkeleton } from '@/components/common/FeedPostSkeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FeedStory, FeedPost } from '@/types/feed';

/** Основная лента (Feed): посты, лайки, комментарии, поделиться. См. FEED_IMPLEMENTATION_PLAN.md */
const FeedPage = () => {
  const navigate = useNavigate();
  const { posts, getStoriesByAuthors, getFeedUser, likePost } = useFeed();
  const storiesByAuthors = getStoriesByAuthors();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [postToShare, setPostToShare] = useState<FeedPost | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const doRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const { pullY, refreshing: ptrRefreshing, progress, handlers } = usePullToRefresh({
    onRefresh: doRefresh,
    enabled: true,
  });
  const isRefreshing = refreshing || ptrRefreshing;

  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 350);
    return () => clearTimeout(t);
  }, []);

  const selectedStory = selectedStoryIndex !== null ? storiesByAuthors[selectedStoryIndex]?.story : null;
  const selectedAuthor = selectedStory ? getFeedUser(selectedStory.authorId) : undefined;

  const handleNextStory = () => {
    if (selectedStoryIndex === null) return;
    const next = (selectedStoryIndex + 1) % storiesByAuthors.length;
    setSelectedStoryIndex(next);
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex === null) return;
    const prev = selectedStoryIndex <= 0 ? storiesByAuthors.length - 1 : selectedStoryIndex - 1;
    setSelectedStoryIndex(prev);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <PullToRefresh
        pullY={pullY}
        refreshing={isRefreshing}
        progress={progress}
        handlers={handlers}
      >
        <div className="flex-1 min-h-0 overflow-auto">
          <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe shrink-0">
            <div className="flex items-center h-14 px-4">
              <h1 className="text-lg font-semibold flex-1">Лента</h1>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Обновить"
                disabled={isRefreshing}
                onClick={() => doRefresh()}
                className={isRefreshing ? 'animate-spin' : ''}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Stories */}
          <div className="border-b border-border py-3 px-2 overflow-x-auto scrollbar-hide shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-4 min-w-max px-2">
              <button
                type="button"
                className="flex flex-col items-center gap-1 shrink-0"
                onClick={() => navigate('/feed/story/create')}
                aria-label="Добавить историю"
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[64px]">
                  Ваша история
                </span>
              </button>
              {storiesByAuthors.length > 0 && storiesByAuthors.map(({ authorId, story }) => {
                const user = getFeedUser(authorId);
                return (
                  <button
                    key={story.id}
                    type="button"
                    className="flex flex-col items-center gap-1 shrink-0"
                    onClick={() => {
                      const idx = storiesByAuthors.findIndex((s) => s.story.id === story.id);
                      setSelectedStoryIndex(idx >= 0 ? idx : 0);
                    }}
                    aria-label={`История ${user?.name ?? authorId}`}
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name ?? authorId}
                          className="w-[52px] h-[52px] rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                          {(user?.name ?? authorId).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[64px]">
                      {user?.name ?? authorId}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Посты или скелетон / пустое состояние */}
          {initialLoad ? (
            <FeedPostSkeleton />
          ) : posts.length === 0 ? (
            <div className="py-4 px-2">
              <EmptyState
                icon={Image}
                title="Пока нет постов"
                description="Создайте первый пост в разделе «Создать» или подпишитесь на других"
                actionLabel="Создать пост"
                onAction={() => navigate('/feed/create')}
              />
            </div>
          ) : (
            <div className="py-4 px-2 space-y-4">
              {posts.map((post) => {
                const author = getFeedUser(post.authorId);
                return (
                  <FeedPostItem
                    key={post.id}
                    post={post}
                    author={author}
                    onLike={() => likePost(post.id)}
                    onNavigate={(path) => navigate(path)}
                    onShare={() => setPostToShare(post)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      <StoriesViewer
        open={selectedStoryIndex !== null}
        onOpenChange={(open) => !open && setSelectedStoryIndex(null)}
        story={selectedStory}
        author={selectedAuthor}
        onNext={storiesByAuthors.length > 1 ? handleNextStory : undefined}
        onPrev={storiesByAuthors.length > 1 ? handlePrevStory : undefined}
      />
      <SharePostSheet
        open={!!postToShare}
        onOpenChange={(open) => !open && setPostToShare(null)}
        post={postToShare}
      />
    </div>
  );
};

/** Компонент отдельного поста с автовоспроизведением видео */
const FeedPostItem = ({
  post,
  author,
  onLike,
  onNavigate,
  onShare,
}: {
  post: FeedPost;
  author: any;
  onLike: () => void;
  onNavigate: (path: string) => void;
  onShare: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || post.media[0]?.type !== 'video') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Автовоспроизведение заблокировано браузером
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [post.media]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      <div className="p-3 flex items-center gap-3">
        <UserAvatar name={author?.name ?? post.authorId} size="md" src={author?.avatar} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{author?.name ?? post.authorId}</p>
          <p className="text-xs text-muted-foreground">@{author?.username ?? post.authorId}</p>
        </div>
      </div>
      <button
        type="button"
        className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative w-full"
        onClick={() => onNavigate(`/feed/post/${post.id}`)}
        aria-label="Открыть публикацию"
      >
        {post.media[0]?.type === 'image' ? (
          <img
            src={post.media[0].url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : post.media[0]?.type === 'video' ? (
          <video
            ref={videoRef}
            src={post.media[0].url}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
          />
        ) : null}
        {post.media.length > 1 && (
          <span className="absolute top-2 right-2 text-xs text-white bg-black/50 rounded px-1.5 py-0.5">
            {post.media.length}
          </span>
        )}
      </button>
      {post.caption && (
        <div className="px-3 py-2">
          <PostCaptionWithHashtags caption={post.caption} lineClamp={2} />
        </div>
      )}
      <div className="p-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className={cn('shrink-0', post.likedByCurrentUser && 'text-primary')}
          aria-label="Лайк"
          onClick={onLike}
        >
          <Heart
            className={cn('h-5 w-5', post.likedByCurrentUser && 'fill-current')}
          />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[1.5rem]">
          {post.likeCount}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Комментировать"
          onClick={() => onNavigate(`/feed/post/${post.id}`)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[1.5rem]">
          {post.commentCount}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 ml-auto"
          aria-label="Поделиться"
          onClick={onShare}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </motion.article>
  );
};

export default FeedPage;
