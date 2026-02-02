import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import UserAvatar from '@/components/common/Avatar';
import { useFeed } from '@/context/FeedContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FeedNotificationType, FeedNotification } from '@/types/feed';

type FilterTab = 'all' | 'likes' | 'comments' | 'subscribes';

const FILTER_TABS: { key: FilterTab; label: string; types?: FeedNotificationType[] }[] = [
  { key: 'all', label: 'Все' },
  { key: 'likes', label: 'Лайки', types: ['like_post', 'like_comment'] },
  { key: 'comments', label: 'Комментарии', types: ['comment', 'comment_reply'] },
  { key: 'subscribes', label: 'Подписки', types: ['subscribe', 'friend_request'] },
];

/** Уведомления: фильтр по типу, лайки, комментарии, подписки. См. FEED_IMPLEMENTATION_PLAN.md п. 6 */
const FeedNotificationsPage = () => {
  const navigate = useNavigate();
  const {
    getNotifications,
    getFeedUser,
    markNotificationRead,
    markAllNotificationsRead,
  } = useFeed();
  const [filter, setFilter] = useState<FilterTab>('all');

  const allNotifications = getNotifications();
  const notifications = useMemo(() => {
    const tab = FILTER_TABS.find((t) => t.key === filter);
    if (!tab?.types) return allNotifications;
    return allNotifications.filter((n) => tab.types!.includes(n.type));
  }, [allNotifications, filter]);

  useEffect(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const getNotificationLabel = (
    type: FeedNotificationType,
    actorName: string
  ): string => {
    switch (type) {
      case 'like_post':
        return `${actorName} поставил(а) лайк вашей публикации`;
      case 'like_comment':
        return `${actorName} поставил(а) лайк вашему комментарию`;
      case 'comment':
        return `${actorName} прокомментировал(а) вашу публикацию`;
      case 'comment_reply':
        return `${actorName} ответил(а) на ваш комментарий`;
      case 'subscribe':
        return `${actorName} подписался(ась) на вас`;
      case 'new_post':
        return `${actorName} опубликовал(а) новую запись`;
      case 'friend_request':
        return `${actorName} отправил(а) заявку в друзья`;
      case 'suggested_post':
        return `Рекомендация: публикация от ${actorName}`;
      default:
        return `${actorName} — новое уведомление`;
    }
  };

  const getNotificationIcon = (type: FeedNotificationType) => {
    switch (type) {
      case 'like_post':
      case 'like_comment':
        return <Heart className="h-5 w-5 text-primary fill-primary" />;
      case 'comment':
      case 'comment_reply':
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'subscribe':
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (n: (typeof notifications)[0]) => {
    markNotificationRead(n.id);
    if (n.postId) navigate(`/feed/post/${n.postId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold flex-1">Уведомления</h1>
        </div>
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors',
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Пока нет уведомлений.
          </p>
        ) : (
          <ul className="space-y-1">
            {notifications.map((n) => {
              const actor = getFeedUser(n.actorId);
              const actorName = actor?.name ?? n.actorId;
              const label = getNotificationLabel(n.type, actorName);
              return (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <button
                    type="button"
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl w-full text-left transition-colors hover:bg-muted/50',
                      !n.read && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <UserAvatar
                      name={actorName}
                      size="md"
                      src={actor?.avatar}
                      className="shrink-0 h-10 w-10"
                    />
                    <div className="shrink-0 mt-0.5 text-muted-foreground">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(n.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedNotificationsPage;
