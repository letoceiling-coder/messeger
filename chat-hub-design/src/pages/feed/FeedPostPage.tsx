import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Flag, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Reply, MoreVertical, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/common/Avatar';
import SharePostSheet from '@/components/feed/SharePostSheet';
import PostCaptionWithHashtags from '@/components/feed/PostCaptionWithHashtags';
import MediaFullscreenDialog from '@/components/feed/MediaFullscreenDialog';
import { useFeed } from '@/context/FeedContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FeedComment } from '@/types/feed';

const CURRENT_USER_ID = 'user-1';

/** Экран поста: карусель медиа, fullscreen, комментарии с ответом и удалением. См. FEED_IMPLEMENTATION_PLAN.md п. 1.3 */
const FeedPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const {
    getPostById,
    getCommentsByPostId,
    getFeedUser,
    likePost,
    addComment,
    likeComment,
    deleteComment,
    canDeleteComment,
    updatePostVisibility,
  } = useFeed();
  const [commentText, setCommentText] = useState('');
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [mediaFullscreenOpen, setMediaFullscreenOpen] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const post = postId ? getPostById(postId) : undefined;
  const comments = postId ? getCommentsByPostId(postId) : [];
  const author = post ? getFeedUser(post.authorId) : undefined;
  const isPostAuthor = post?.authorId === CURRENT_USER_ID;

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text || !postId) return;
    addComment(postId, text, replyTo?.id);
    setCommentText('');
    setReplyTo(null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!postId) return;
    deleteComment(postId, commentId);
    setDeleteConfirmId(null);
  };

  if (!postId || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Публикация не найдена</p>
        <Button variant="link" onClick={() => navigate('/feed')} className="ml-2">
          В ленту
        </Button>
      </div>
    );
  }

  const hasMultipleMedia = post.media.length > 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Публикация</h1>
          {isPostAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Настройки поста">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    updatePostVisibility(
                      post.id,
                      post.visibility === 'public' ? 'followers_only' : 'public'
                    )
                  }
                >
                  {post.visibility === 'public' ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Только подписчики
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Сделать публичным
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 flex items-center gap-3 border-b border-border">
          <UserAvatar name={author?.name ?? post.authorId} size="md" src={author?.avatar} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{author?.name ?? post.authorId}</p>
            <p className="text-xs text-muted-foreground">@{author?.username ?? post.authorId}</p>
          </div>
        </div>

        {/* Карусель медиа или одно медиа */}
        <div className="relative aspect-square bg-muted">
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center w-full h-full"
            onClick={() => setMediaFullscreenOpen(true)}
            aria-label="Открыть в полном размере"
          >
            {post.media[mediaIndex]?.type === 'image' ? (
              <img
                src={post.media[mediaIndex].url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={post.media[mediaIndex]?.url}
                controls
                className="w-full h-full object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </button>
          {hasMultipleMedia && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Назад"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIndex((i) => (i <= 0 ? post.media.length - 1 : i - 1));
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Вперёд"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIndex((i) => (i >= post.media.length - 1 ? 0 : i + 1));
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {post.media.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === mediaIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(post.likedByCurrentUser && 'text-primary')}
            aria-label="Лайк"
            onClick={() => likePost(post.id)}
          >
            <Heart className={cn('h-5 w-5', post.likedByCurrentUser && 'fill-current')} />
          </Button>
          <span className="text-sm text-muted-foreground">{post.likeCount}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Комментировать"
            onClick={() => document.getElementById('comment-input')?.focus()}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">{post.commentCount}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label="Поделиться"
            onClick={() => setShareSheetOpen(true)}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          {isPostAuthor && (
            <>
              <Button variant="ghost" size="icon" aria-label="Важное" title="Пометить важным">
                <Flag className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Спам" title="Пометить спам">
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {post.caption && (
          <div className="px-3 pb-2">
            <PostCaptionWithHashtags caption={post.caption} />
          </div>
        )}

        <div className="border-t border-border p-3">
          <h3 className="text-sm font-medium mb-3">Комментарии</h3>
          <div className="space-y-3 mb-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет комментариев.</p>
            ) : (
              comments.map((c) => {
                const commentAuthor = getFeedUser(c.authorId);
                const canDelete = canDeleteComment(post.id, c.id);
                const isReply = !!c.parentId;
                const isDeleteConfirm = deleteConfirmId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn('flex gap-2 group', isReply && 'ml-6')}
                  >
                    <UserAvatar
                      name={commentAuthor?.name ?? c.authorId}
                      size="sm"
                      src={commentAuthor?.avatar}
                      className="shrink-0 h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{commentAuthor?.name ?? c.authorId}</p>
                      <p className="text-sm text-foreground">{c.text}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary"
                          onClick={() => likeComment(c.id)}
                        >
                          {c.likedByCurrentUser ? 'Не нравится' : 'Нравится'}
                        </button>
                        <span className="text-xs text-muted-foreground">{c.likeCount}</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5"
                          onClick={() => setReplyTo(c)}
                        >
                          <Reply className="h-3 w-3" />
                          Ответить
                        </button>
                        {canDelete && (
                          !isDeleteConfirm ? (
                            <button
                              type="button"
                              className="text-xs text-destructive hover:underline flex items-center gap-0.5"
                              onClick={() => setDeleteConfirmId(c.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Удалить
                            </button>
                          ) : (
                            <span className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-xs text-destructive font-medium"
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                Подтвердить
                              </button>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Отмена
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          {replyTo && (
            <p className="text-xs text-muted-foreground mb-2">
              Ответ {getFeedUser(replyTo.authorId)?.name ?? replyTo.authorId}:{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setReplyTo(null)}
              >
                отменить
              </button>
            </p>
          )}
          <div className="flex gap-2">
            <Input
              id="comment-input"
              placeholder={replyTo ? 'Ответить...' : 'Написать комментарий...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
              className="rounded-xl flex-1"
            />
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              Отправить
            </Button>
          </div>
        </div>
      </div>

      <MediaFullscreenDialog
        open={mediaFullscreenOpen}
        onOpenChange={setMediaFullscreenOpen}
        media={post.media}
        initialIndex={mediaIndex}
      />
      <SharePostSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        post={post}
      />
    </div>
  );
};

export default FeedPostPage;
