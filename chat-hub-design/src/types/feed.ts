/**
 * Типы для личной ленты (Feed): посты, комментарии, истории, подписки.
 * См. план реализации: docs/FEED_IMPLEMENTATION_PLAN.md
 */

/** Медиа в посте: фото или видео */
export interface FeedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  /** Длительность видео (сек) */
  duration?: number;
}

/** Видимость поста */
export type FeedPostVisibility = 'public' | 'followers_only';

/** Пост в ленте */
export interface FeedPost {
  id: string;
  authorId: string;
  /** Медиа: одно или несколько (карусель) */
  media: FeedMedia[];
  /** Подпись, хештеги #tag, теги @username */
  caption: string;
  /** Хештеги, извлечённые из caption */
  hashtags?: string[];
  /** Упомянутые userId в caption */
  mentionedUserIds?: string[];
  createdAt: Date;
  /** Геолокация (название места или координаты) */
  location?: string;
  visibility: FeedPostVisibility;
  likeCount: number;
  commentCount: number;
  /** userId текущего пользователя в списке — лайкнул ли */
  likedByCurrentUser?: boolean;
}

/** Комментарий к посту */
export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  /** Ответ на другой комментарий */
  parentId?: string;
  text: string;
  createdAt: Date;
  likeCount: number;
  likedByCurrentUser?: boolean;
  /** Пометка модератора: важный / спам */
  flag?: 'important' | 'spam';
}

/** История (Stories): 24 часа */
export interface FeedStory {
  id: string;
  authorId: string;
  /** Медиа: фото или видео */
  media: FeedMedia;
  createdAt: Date;
  /** Истекает через 24 часа */
  expiresAt: Date;
  /** Текст/стикеры/фильтры — опционально на клиенте */
  overlayText?: string;
  /** Просмотрена ли текущим пользователем (для отображения серой рамки в ленте) */
  viewed?: boolean;
}

/** Пользователь в контексте ленты (профиль для отображения в ленте) */
export interface FeedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  /** Подписчики / подписки */
  followersCount: number;
  followingCount: number;
  /** Подписан ли текущий пользователь на этого */
  isFollowedByCurrentUser?: boolean;
}

/** Уведомление ленты */
export type FeedNotificationType =
  | 'like_post'
  | 'like_comment'
  | 'comment'
  | 'comment_reply'
  | 'subscribe'
  | 'new_post'
  | 'friend_request'
  | 'suggested_post';

export interface FeedNotification {
  id: string;
  type: FeedNotificationType;
  /** Кто совершил действие */
  actorId: string;
  /** Кому уведомление */
  recipientId: string;
  /** Ссылка на объект */
  postId?: string;
  commentId?: string;
  createdAt: Date;
  read: boolean;
}
