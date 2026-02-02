import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { FeedPost, FeedComment, FeedStory, FeedUser, FeedNotification } from '@/types/feed';
import {
  initialFeedPosts,
  initialFeedComments,
  initialFeedStories,
  initialFeedNotifications,
  feedUsers,
} from '@/data/feedMockData';

const CURRENT_USER_ID = 'user-1';

interface FeedContextValue {
  posts: FeedPost[];
  comments: FeedComment[];
  stories: FeedStory[];
  likePost: (postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  likeComment: (commentId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  canDeleteComment: (postId: string, commentId: string) => boolean;
  addPost: (post: Omit<FeedPost, 'id' | 'createdAt' | 'likeCount' | 'commentCount' | 'likedByCurrentUser'>) => void;
  addStory: (story: Omit<FeedStory, 'id' | 'createdAt' | 'expiresAt'>) => void;
  updatePostVisibility: (postId: string, visibility: 'public' | 'followers_only') => void;
  getPostById: (postId: string) => FeedPost | undefined;
  getCommentsByPostId: (postId: string) => FeedComment[];
  getStoriesByAuthors: () => { authorId: string; story: FeedStory }[];
  getFeedUser: (userId: string) => FeedUser | undefined;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isFollowedByCurrentUser: (userId: string) => boolean;
  notifications: FeedNotification[];
  unreadNotificationsCount: number;
  getNotifications: () => FeedNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>(() => [...initialFeedPosts]);
  const [comments, setComments] = useState<FeedComment[]>(() => [...initialFeedComments]);
  const [stories, setStories] = useState<FeedStory[]>(() => [...initialFeedStories]);
  const [notifications, setNotifications] = useState<FeedNotification[]>(() => [...initialFeedNotifications]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(() =>
    new Set(feedUsers.filter((u) => u.isFollowedByCurrentUser).map((u) => u.id))
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const getNotifications = useCallback(() => {
    return [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [notifications]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const followUser = useCallback((userId: string) => {
    if (userId === CURRENT_USER_ID) return;
    setFollowedUserIds((prev) => new Set(prev).add(userId));
  }, []);

  const unfollowUser = useCallback((userId: string) => {
    setFollowedUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const isFollowedByCurrentUser = useCallback(
    (userId: string) => followedUserIds.has(userId),
    [followedUserIds]
  );

  const likePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const liked = !p.likedByCurrentUser;
        return {
          ...p,
          likeCount: p.likeCount + (liked ? 1 : -1),
          likedByCurrentUser: liked,
        };
      })
    );
  }, []);

  const addComment = useCallback((postId: string, text: string, parentId?: string) => {
    const newComment: FeedComment = {
      id: `fc-${Date.now()}`,
      postId,
      authorId: CURRENT_USER_ID,
      parentId,
      text: text.trim(),
      createdAt: new Date(),
      likeCount: 0,
      likedByCurrentUser: false,
    };
    setComments((prev) => [...prev, newComment]);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    );
  }, []);

  const likeComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const liked = !c.likedByCurrentUser;
        return {
          ...c,
          likeCount: c.likeCount + (liked ? 1 : -1),
          likedByCurrentUser: liked,
        };
      })
    );
  }, []);

  const deleteComment = useCallback((postId: string, commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      )
    );
  }, []);

  const canDeleteComment = useCallback(
    (postId: string, commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      const post = posts.find((p) => p.id === postId);
      if (!comment || !post) return false;
      return comment.authorId === CURRENT_USER_ID || post.authorId === CURRENT_USER_ID;
    },
    [comments, posts]
  );

  const addPost = useCallback(
    (post: Omit<FeedPost, 'id' | 'createdAt' | 'likeCount' | 'commentCount' | 'likedByCurrentUser'>) => {
      const newPost: FeedPost = {
        ...post,
        id: `feed-post-${Date.now()}`,
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        likedByCurrentUser: false,
      };
      setPosts((prev) => [newPost, ...prev]);
    },
    []
  );

  const addStory = useCallback(
    (story: Omit<FeedStory, 'id' | 'createdAt' | 'expiresAt'>) => {
      const now = new Date();
      const newStory: FeedStory = {
        ...story,
        id: `fs-${Date.now()}`,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      };
      setStories((prev) => [newStory, ...prev]);
    },
    []
  );

  const updatePostVisibility = useCallback(
    (postId: string, visibility: 'public' | 'followers_only') => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, visibility } : p)));
    },
    []
  );

  const getPostById = useCallback(
    (postId: string) => posts.find((p) => p.id === postId),
    [posts]
  );

  const getCommentsByPostId = useCallback(
    (postId: string) =>
      comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [comments]
  );

  const getStoriesByAuthors = useCallback(() => {
    const byAuthor = new Map<string, FeedStory>();
    const exp = new Date(Date.now());
    stories
      .filter((s) => s.expiresAt > exp)
      .forEach((s) => {
        if (!byAuthor.has(s.authorId) || (byAuthor.get(s.authorId)!.createdAt < s.createdAt)) {
          byAuthor.set(s.authorId, s);
        }
      });
    return Array.from(byAuthor.entries()).map(([authorId, story]) => ({ authorId, story }));
  }, [stories]);

  const getFeedUser = useCallback(
    (userId: string): FeedUser | undefined => {
      const user = feedUsers.find((u) => u.id === userId);
      if (!user) return undefined;
      return { ...user, isFollowedByCurrentUser: followedUserIds.has(userId) };
    },
    [followedUserIds]
  );

  const value = useMemo<FeedContextValue>(
    () => ({
      posts,
      comments,
      stories,
      likePost,
      addComment,
      likeComment,
      deleteComment,
      canDeleteComment,
      addPost,
      addStory,
      updatePostVisibility,
      getPostById,
      getCommentsByPostId,
      getStoriesByAuthors,
      getFeedUser,
      followUser,
      unfollowUser,
      isFollowedByCurrentUser,
      notifications,
      unreadNotificationsCount,
      getNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      posts,
      comments,
      stories,
      likePost,
      addComment,
      likeComment,
      deleteComment,
      canDeleteComment,
      addPost,
      addStory,
      updatePostVisibility,
      getPostById,
      getCommentsByPostId,
      getStoriesByAuthors,
      getFeedUser,
      followUser,
      unfollowUser,
      isFollowedByCurrentUser,
      notifications,
      unreadNotificationsCount,
      getNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used within FeedProvider');
  return ctx;
}
