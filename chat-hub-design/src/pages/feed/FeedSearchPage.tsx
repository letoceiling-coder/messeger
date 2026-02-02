import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { useFeed } from '@/context/FeedContext';
import { feedUsers } from '@/data/feedMockData';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CURRENT_USER_ID = 'user-1';

type SortTab = 'popular' | 'new' | 'trending';

/** Поиск: по имени, хештегам, рекомендуемые аккаунты, популярные посты, фильтры. См. FEED_IMPLEMENTATION_PLAN.md п. 4 */
const FeedSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { posts, getFeedUser, likePost } = useFeed();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [activeTab, setActiveTab] = useState<SortTab>('popular');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const q = query.trim().toLowerCase();

  const suggestions = useMemo((): { users: typeof feedUsers; hashtags: string[] } => {
    if (!q) return { users: [], hashtags: [] };
    const users = feedUsers
      .filter((u) => u.id !== CURRENT_USER_ID)
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      )
      .slice(0, 5);
    const hashtagsSet = new Set<string>();
    posts.forEach((p) => {
      p.hashtags?.forEach((tag) => {
        if (tag.toLowerCase().includes(q.replace(/^#/, ''))) {
          hashtagsSet.add(tag);
        }
      });
    });
    const hashtags = Array.from(hashtagsSet).slice(0, 5);
    return { users, hashtags };
  }, [q, posts]);
  const hasSuggestions = suggestions.users.length > 0 || suggestions.hashtags.length > 0;

  const recommendedUsers = useMemo(() => {
    let list = feedUsers.filter((u) => u.id !== CURRENT_USER_ID);
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }
    return list;
  }, [q]);

  const filteredAndSortedPosts = useMemo(() => {
    let list = [...posts];
    if (q) {
      list = list.filter((post) => {
        const author = getFeedUser(post.authorId);
        const matchCaption = post.caption?.toLowerCase().includes(q);
        const matchHashtags = post.hashtags?.some((tag) =>
          tag.toLowerCase().includes(q.replace(/^#/, ''))
        );
        const matchAuthor =
          author?.name.toLowerCase().includes(q) ||
          author?.username.toLowerCase().includes(q);
        return matchCaption || matchHashtags || matchAuthor;
      });
    }
    if (activeTab === 'popular') {
      list.sort((a, b) => b.likeCount - a.likeCount);
    } else if (activeTab === 'new') {
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      list.sort(
        (a, b) =>
          b.likeCount + b.commentCount - (a.likeCount + a.commentCount)
      );
    }
    return list;
  }, [posts, q, activeTab, getFeedUser]);

  const tabs: { key: SortTab; label: string }[] = [
    { key: 'popular', label: 'Популярные' },
    { key: 'new', label: 'Новые' },
    { key: 'trending', label: 'Тренды' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/feed')} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по имени, хештегам..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9 rounded-xl"
            />
            {showSuggestions && q && hasSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
                {suggestions.users.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Пользователи</p>
                    {suggestions.users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 text-left"
                        onClick={() => {
                          navigate(`/feed/profile/${user.id}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <UserAvatar name={user.name} size="sm" src={user.avatar} className="h-8 w-8" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.hashtags.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Хештеги</p>
                    {suggestions.hashtags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 text-left"
                        onClick={() => {
                          setQuery(`#${tag}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="text-sm text-primary font-medium">#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Рекомендуемые аккаунты
          </h2>
          {recommendedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q ? 'Никого не найдено по запросу.' : 'Нет рекомендаций.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 text-left w-full"
                  onClick={() => navigate(`/feed/profile/${user.id}`)}
                >
                  <UserAvatar
                    name={user.name}
                    size="md"
                    src={user.avatar}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username} · подписчиков {user.followersCount}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Публикации
          </h2>
          <div className="flex gap-2 mb-3">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-colors',
                  activeTab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                )}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {filteredAndSortedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q ? 'Публикаций по запросу не найдено.' : 'Пока нет публикаций.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedPosts.map((post) => {
                const author = getFeedUser(post.authorId);
                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border rounded-xl overflow-hidden bg-card"
                  >
                    <button
                      type="button"
                      className="p-3 flex items-center gap-3 w-full text-left hover:bg-muted/30"
                      onClick={() => navigate(`/feed/post/${post.id}`)}
                    >
                      <UserAvatar
                        name={author?.name ?? post.authorId}
                        size="md"
                        src={author?.avatar}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {author?.name ?? post.authorId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{author?.username ?? post.authorId}
                        </p>
                      </div>
                    </button>
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {post.media[0]?.type === 'image' ? (
                        <img
                          src={post.media[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Видео
                        </span>
                      )}
                    </div>
                    {post.caption && (
                      <div className="px-3 py-2">
                        <p className="text-sm line-clamp-2">{post.caption}</p>
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'shrink-0',
                          post.likedByCurrentUser && 'text-primary'
                        )}
                        aria-label="Лайк"
                        onClick={() => likePost(post.id)}
                      >
                        <Heart
                          className={cn(
                            'h-5 w-5',
                            post.likedByCurrentUser && 'fill-current'
                          )}
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
                        onClick={() => navigate(`/feed/post/${post.id}`)}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                      <span className="text-sm text-muted-foreground min-w-[1.5rem]">
                        {post.commentCount}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FeedSearchPage;
