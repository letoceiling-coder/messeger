import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { currentUser } from '@/data/mockData';
import { useFeed } from '@/context/FeedContext';
import { PlusSquare, Grid3X3, UserPlus, UserMinus, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CURRENT_USER_ID = 'user-1';

/** Профиль пользователя в ленте: подписчики/подписки, галерея постов, подписаться. См. FEED_IMPLEMENTATION_PLAN.md п. 1.2 */
const FeedProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { posts, getFeedUser, followUser, unfollowUser, isFollowedByCurrentUser } = useFeed();

  const isOwnProfile = !userId || userId === CURRENT_USER_ID;
  const profileUser = isOwnProfile
    ? getFeedUser(CURRENT_USER_ID)
    : getFeedUser(userId!);
  const profilePosts = isOwnProfile
    ? posts.filter((p) => p.authorId === CURRENT_USER_ID)
    : (userId ? posts.filter((p) => p.authorId === userId) : []);

  const followed = userId ? isFollowedByCurrentUser(userId) : false;

  const displayName = isOwnProfile ? currentUser.name : (profileUser?.name ?? userId ?? '');
  const displayUsername = isOwnProfile ? currentUser.username : (profileUser?.username ?? '');
  const displayAvatar = isOwnProfile ? currentUser.avatar : profileUser?.avatar;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold flex-1">
            {isOwnProfile ? 'Профиль' : 'Профиль пользователя'}
          </h1>
        </div>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
        <div className="flex flex-col items-center">
          <UserAvatar name={displayName} size="2xl" src={displayAvatar} />
          <h2 className="mt-4 text-xl font-semibold">{displayName}</h2>
          <p className="text-sm text-muted-foreground">@{displayUsername}</p>
          <div className="flex gap-6 mt-4 text-center">
            <div>
              <p className="font-semibold">{profileUser?.followersCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">подписчиков</p>
            </div>
            <div>
              <p className="font-semibold">{profileUser?.followingCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">подписок</p>
            </div>
          </div>

          {isOwnProfile ? (
            <>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('/profile')}>
                Редактировать профиль
              </Button>
              <Button
                variant="outline"
                className="mt-2 w-full rounded-xl"
                onClick={() => navigate('/feed/create')}
              >
                <PlusSquare className="h-4 w-4 mr-2" />
                Добавить пост
              </Button>
            </>
          ) : (
            userId && (
              <Button
                variant={followed ? 'outline' : 'default'}
                className={cn('mt-4 rounded-xl gap-2', followed && 'border-primary text-primary')}
                onClick={() => (followed ? unfollowUser(userId) : followUser(userId))}
              >
                {followed ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Отписаться
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Подписаться
                  </>
                )}
              </Button>
            )
          )}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Публикации</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {profilePosts.length === 0 ? (
              <p className="col-span-3 text-sm text-muted-foreground text-center py-6">
                {isOwnProfile ? 'Пока нет публикаций' : 'Нет публикаций'}
              </p>
            ) : (
              profilePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center relative group"
                  onClick={() => navigate(`/feed/post/${post.id}`)}
                >
                  {post.media[0]?.type === 'image' ? (
                    <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-xs">Видео</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4 fill-current" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentCount}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedProfilePage;
