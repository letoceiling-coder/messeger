import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic, Check, CheckCheck, Reply, Copy, Trash2, Forward, Pin, Pencil, FileText, Sticker as StickerIcon, X, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/common/Avatar';
import OnlinePulse from '@/components/common/OnlinePulse';
import { formatMessageTime, formatLastSeen, formatViews } from '@/data/mockData';
import { useContacts } from '@/context/ContactsContext';
import { useChats } from '@/context/ChatsContext';
import { useCall } from '@/context/CallContext';
import { useMessages } from '@/context/MessagesContext';
import { Message } from '@/types/messenger';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AttachSheet from '@/components/chat/AttachSheet';
import type { AttachAction } from '@/components/chat/AttachSheet';
import VoiceMessageBubble from '@/components/chat/VoiceMessageBubble';
import VideoNoteBubble from '@/components/chat/VideoNoteBubble';
import MediaViewer from '@/components/chat/MediaViewer';
import EmojiPicker from '@/components/chat/EmojiPicker';
import StickerPanel from '@/components/chat/StickerPanel';
import StickerBubble from '@/components/chat/StickerBubble';
import PinBanner, { HIGHLIGHT_DURATION_MS } from '@/components/chat/PinBanner';
import ChannelPostFooter from '@/components/chat/ChannelPostFooter';
import CommentsSheet from '@/components/chat/CommentsSheet';
import BotButtons from '@/components/chat/BotButtons';
import BotKeyboard from '@/components/chat/BotKeyboard';
import { StickerProvider, useStickers } from '@/context/StickerContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVideoNoteRecorder } from '@/hooks/useVideoNoteRecorder';
import type { Sticker } from '@/types/messenger';

const EMOJI_ONLY_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s)+$/u;
function isOnlyEmoji(text: string): boolean {
  const t = text.trim();
  return t.length <= 8 && EMOJI_ONLY_REGEX.test(t);
}

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const scrollRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | undefined>();
  const [viewerType, setViewerType] = useState<'image' | 'video'>('image');
  const [activeVideoNoteId, setActiveVideoNoteId] = useState<string | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingVideoNote, setRecordingVideoNote] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [loadedMediaIds, setLoadedMediaIds] = useState<Set<string>>(new Set());

  const { startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const {
    startRecording: startVideoNoteRecording,
    stopRecording: stopVideoNoteRecording,
    cancelRecording: cancelVideoNoteRecording,
  } = useVideoNoteRecorder();
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const { getChatById, chats, subscribeToChannel, unsubscribeFromChannel, isChannelSubscribed } = useChats();
  const { contacts } = useContacts();
  const { startOutgoingCall } = useCall();
  const { getMessages, setMessagesForChat, addMessageToChat, updateMessageReaction, loadMoreMessages, hasMoreOlder } = useMessages();
  const chat = useMemo(() => {
    if (!chatId) return null;
    return getChatById(chatId);
  }, [chatId, getChatById]);
  const messages = chatId ? getMessages(chatId) : [];
  /** В канале показываем только посты (без комментариев в ленте) */
  const messagesToShow = useMemo(() => {
    if (chat?.isChannel && chatId) {
      return messages.filter((m) => !m.replyTo);
    }
    return messages;
  }, [messages, chat?.isChannel, chatId]);
  const setMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      if (chatId) setMessagesForChat(chatId, updater);
    },
    [chatId, setMessagesForChat]
  );

  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Record<string, string[]>>({});
  /** Индекс текущего закреплённого в циклическом навигаторе. Не сбрасывается при скролле/новом пине. */
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState<Record<string, number>>({});
  /** Панель закреплённых скрыта (×), но сообщения остаются закреплёнными. Можно открыть снова из меню чата. */
  const [pinnedBarVisible, setPinnedBarVisible] = useState<Record<string, boolean>>({});
  const [allPinnedSheetOpen, setAllPinnedSheetOpen] = useState(false);
  const [chatInfoOpen, setChatInfoOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ messageId: string; scope: 'self' | 'all' } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const viewedPostIdsRef = useRef<Set<string>>(new Set());

  // Redirect if chat was deleted
  useEffect(() => {
    if (chatId && !chat) navigate('/', { replace: true });
  }, [chatId, chat, navigate]);

  // Start video note recording when UI is shown (so video ref is mounted)
  useEffect(() => {
    if (!recordingVideoNote) return;
    let cancelled = false;
    startVideoNoteRecording(videoPreviewRef).then((ok) => {
      if (cancelled) return;
        if (!ok) {
          setRecordingVideoNote(false);
        }
    });
    return () => { cancelled = true; };
  }, [recordingVideoNote, startVideoNoteRecording]);

  // Recording timer
  useEffect(() => {
    if (!recordingVoice && !recordingVideoNote) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordSeconds(0);
      return;
    }
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [recordingVoice, recordingVideoNote]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Восстановить позицию скролла после подгрузки более ранних сообщений
  useEffect(() => {
    const el = messagesContainerRef.current;
    const prev = scrollRestoreRef.current;
    if (!el || !prev) return;
    const delta = el.scrollHeight - prev.scrollHeight;
    el.scrollTop = prev.scrollTop + delta;
    scrollRestoreRef.current = null;
    loadingMoreRef.current = false;
  }, [messagesToShow.length]);

  // Get contact info for status display and call buttons
  const contactInfo = useMemo(() => {
    if (!chat || chat.isGroup) return null;
    return contacts.find((c) => c.name === chat.name);
  }, [chat]);

  const getStatusText = () => {
    if (!chat) return '';
    if (chat.isBot) return 'бот';
    if (chat.isChannel) return 'Канал';
    if (chat.isGroup) {
      return `${chat.members?.length || 0} участников`;
    }
    if (isTyping) return 'печатает...';
    if (chat.isOnline) return 'онлайн';
    if (chat.lastSeen) return formatLastSeen(chat.lastSeen);
    return '';
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !chatId) return;
    const text = inputValue.trim();

    if (editMessageId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editMessageId ? { ...m, content: text, editedAt: new Date() } : m
        )
      );
      setEditMessageId(null);
      setInputValue('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: 'user-1',
      type: 'text',
      content: text,
      timestamp: new Date(),
      status: 'sent',
      isOutgoing: true,
      replyTo: replyToMessage?.id,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setReplyToMessage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'delivered' } : m))
      );
    }, 1000);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'read' } : m))
      );
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleAttachSelect = (action: AttachAction) => {
    if (action === 'photo') {
      mediaInputRef.current?.click();
    } else if (action === 'contact') {
      setContactPickerOpen(true);
    }
  };

  const handleMediaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !chatId) return;
    const newMessages: Message[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      newMessages.push({
        id: `msg-${Date.now()}-${i}`,
        chatId,
        senderId: 'user-1',
        type: isVideo ? 'video' : 'image',
        content: isVideo ? 'Видео' : 'Фото',
        timestamp: new Date(),
        status: 'sent',
        isOutgoing: true,
        mediaUrl: url,
        fileName: file.name,
        fileSize: file.size,
      } as Message);
    }
    setMessages((prev) => [...prev, ...newMessages]);
    e.target.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = inputValue.slice(0, start);
      const after = inputValue.slice(end);
      const newValue = before + emoji + after;
      const newPos = start + emoji.length;
      setInputValue(newValue);
      setEmojiPickerOpen(false);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setInputValue((prev) => prev + emoji);
      setEmojiPickerOpen(false);
    }
  };

  const handleContactSelect = (contact: { id: string; name: string; phone?: string; avatar?: string }) => {
    if (!chatId) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: 'user-1',
        type: 'contact',
        content: contact.name,
        timestamp: new Date(),
        status: 'sent',
        isOutgoing: true,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactAvatar: contact.avatar,
      } as Message,
    ]);
    setContactPickerOpen(false);
  };

  const handleSendSticker = useCallback(
    (sticker: Sticker) => {
      if (!chatId) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          chatId,
          senderId: 'user-1',
          type: 'sticker',
          content: sticker.emoji ?? 'Стикер',
          timestamp: new Date(),
          status: 'sent',
          isOutgoing: true,
          stickerId: sticker.id,
          stickerPackId: sticker.packId,
          mediaUrl: sticker.url,
          isAnimated: !!sticker.animatedUrl,
        } as Message,
      ]);
    },
    [chatId]
  );

  const getRepliedMessage = useCallback(
    (messageId: string) => messages.find((m) => m.id === messageId),
    [messages]
  );

  const scrollToMessage = useCallback((id: string, highlightMs = 1500) => {
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightMessageId(id);
    setTimeout(() => setHighlightMessageId(null), highlightMs);
  }, []);

  const copyMessageText = useCallback((message: Message) => {
    const text = message.type === 'text' ? message.content : message.content || message.fileName || '';
    if (text && navigator.clipboard?.writeText(text)) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }, []);

  const pinnedIds = chatId ? (pinnedMessageIds[chatId] ?? []) : [];
  /** Количество комментариев (включая ответы) под каждым постом канала */
  const commentCountByPostId = useMemo(() => {
    if (!chat?.isChannel || !chatId) return {} as Record<string, number>;
    const msgs = getMessages(chatId);
    const result: Record<string, number> = {};
    const postIds = msgs.filter((m) => m.senderId === chatId && !m.replyTo).map((m) => m.id);
    for (const postId of postIds) {
      const ids = new Set<string>([postId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const m of msgs) {
          if (m.replyTo && ids.has(m.replyTo) && !ids.has(m.id)) {
            ids.add(m.id);
            changed = true;
          }
        }
      }
      result[postId] = msgs.filter((m) => m.replyTo && ids.has(m.replyTo) && m.id !== postId).length;
    }
    return result;
  }, [chat?.isChannel, chatId, getMessages, messages]);

  const pinnedMessages = useMemo(
    () => pinnedIds.map((id) => getRepliedMessage(id)).filter((m): m is Message => m != null),
    [pinnedIds, messages]
  );
  const currentIndex = chatId ? (currentPinnedIndex[chatId] ?? 0) : 0;
  const isPinnedBarVisible = chatId && pinnedMessages.length > 0 && pinnedBarVisible[chatId] !== false;

  const handlePinnedBarClick = useCallback(() => {
    if (!chatId || pinnedMessages.length === 0) return;
    const idx = currentPinnedIndex[chatId] ?? 0;
    const nextIdx = (idx + 1) % pinnedMessages.length;
    const msg = pinnedMessages[nextIdx];
    if (!msg) return;
    setCurrentPinnedIndex((prev) => ({ ...prev, [chatId]: nextIdx }));
    scrollToMessage(msg.id, HIGHLIGHT_DURATION_MS);
    setHighlightMessageId(msg.id);
    setTimeout(() => setHighlightMessageId(null), HIGHLIGHT_DURATION_MS);
  }, [chatId, pinnedMessages, currentPinnedIndex, scrollToMessage]);

  const handlePinnedBarClose = useCallback(() => {
    if (chatId) setPinnedBarVisible((prev) => ({ ...prev, [chatId]: false }));
  }, [chatId]);

  const handleUnpinCurrent = useCallback(() => {
    if (!chatId || pinnedMessages.length === 0) return;
    const idx = currentPinnedIndex[chatId] ?? 0;
    const msg = pinnedMessages[idx];
    if (!msg) return;
    setPinnedMessageIds((prev) => {
      const ids = prev[chatId] ?? [];
      return { ...prev, [chatId]: ids.filter((id) => id !== msg.id) };
    });
    const nextLen = pinnedMessages.length - 1;
    if (nextLen > 0) {
      setCurrentPinnedIndex((prev) => ({
        ...prev,
        [chatId]: Math.min(idx, nextLen - 1),
      }));
    } else {
      setCurrentPinnedIndex((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
    }
  }, [chatId, pinnedMessages, currentPinnedIndex]);

  const getMessagePreview = useCallback((m: Message) => {
    if (m.type === 'text') return m.content;
    if (m.type === 'voice') return 'Голосовое сообщение';
    if (m.type === 'image') return 'Фото';
    if (m.type === 'video') return 'Видео';
    if (m.type === 'sticker') return 'Стикер';
    if (m.type === 'contact') return m.contactName ?? m.content;
    return m.content;
  }, []);

  const renderMessageStatus = (message: Message) => {
    if (!message.isOutgoing) return null;
    
    switch (message.status) {
      case 'sending':
        return <span className="text-[10px] text-muted-foreground">•••</span>;
      case 'sent':
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
      default:
        return null;
    }
  };

  // Канал: один раз при открытии увеличиваем просмотры постов (как «просмотр» в Telegram)
  useEffect(() => {
    if (!chatId || !chat?.isChannel) return;
    const msgs = getMessages(chatId);
    const posts = msgs.filter((m) => m.senderId === chatId && !m.replyTo);
    const toIncrement = posts.filter((m) => !viewedPostIdsRef.current.has(m.id));
    if (toIncrement.length === 0) return;
    toIncrement.forEach((m) => viewedPostIdsRef.current.add(m.id));
    setMessagesForChat(chatId, (prev) =>
      prev.map((m) =>
        toIncrement.some((p) => p.id === m.id)
          ? { ...m, views: (m.views ?? 0) + 1 }
          : m
      )
    );
  }, [chatId, chat?.isChannel, getMessages, setMessagesForChat]);

  // Group messages by date (для канала — только посты)
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    messagesToShow.forEach(message => {
      const messageDate = message.timestamp.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  }, [messagesToShow]);

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Чат не найден</p>
      </div>
    );
  }

  // Канал: экран подписки (как в Telegram), если ещё не подписан
  if (chat.isChannel && chatId && !isChannelSubscribed(chatId)) {
    return (
      <div className="flex flex-col h-screen bg-secondary/30">
        <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
          <div className="flex items-center h-14 px-2 gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Назад">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <p className="font-semibold truncate flex-1">Канал</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
          <UserAvatar name={chat.name} size="2xl" className="mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-1">{chat.name}</h1>
          {chat.username && (
            <p className="text-sm text-muted-foreground mb-4">@{chat.username}</p>
          )}
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            Подпишитесь на канал, чтобы видеть посты и комментарии.
          </p>
          <Button
            className="rounded-full bg-primary text-primary-foreground px-8"
            onClick={() => {
              subscribeToChannel(chatId!);
            }}
          >
            Подписаться
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StickerProvider onSendSticker={handleSendSticker}>
    <div className="flex flex-col h-screen bg-secondary/30">
      {/* Header: градиент для канала, обычный фон для чата */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b pt-safe',
          chat.isChannel
            ? 'bg-[length:100%_100%] border-violet-500/20 text-white'
            : 'bg-background border-border'
        )}
        style={chat.isChannel ? { backgroundImage: 'var(--gradient-channel)' } : undefined}
      >
        <div className="flex items-center h-14 px-2 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className={chat.isChannel ? 'text-white hover:bg-white/10' : ''}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setChatInfoOpen(true)}
          >
            <div className="relative shrink-0">
              <UserAvatar
                name={chat.name}
                size="md"
                isOnline={!chat.isGroup && !chat.isBot && !chat.isChannel && chat.isOnline}
              />
              {!chat.isBot && !chat.isChannel && chat.isOnline && (
                <OnlinePulse size="md" className={chat.isChannel ? 'border-white' : undefined} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {chat.isChannel && <Megaphone className="h-4 w-4 shrink-0 text-white/90" />}
                <p className="font-semibold truncate">{chat.name}</p>
              </div>
              <p
                className={cn(
                  'text-xs truncate',
                  chat.isChannel ? 'text-white/80' : chat.isOnline || isTyping ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {chat.isChannel && chat.subscribersCount != null
                  ? `${formatViews(chat.subscribersCount)} подписчиков`
                  : getStatusText()}
              </p>
            </div>
          </div>
          
          <div className={cn('flex items-center', chat.isChannel && 'text-white')}>
            {!chat.isBot && !chat.isChannel && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => contactInfo && startOutgoingCall(contactInfo, 'audio')}
                  disabled={!contactInfo}
                  className={chat.isChannel ? 'text-white hover:bg-white/10' : ''}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => contactInfo && startOutgoingCall(contactInfo, 'video')}
                  disabled={!contactInfo}
                  className={chat.isChannel ? 'text-white hover:bg-white/10' : ''}
                >
                  <Video className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={chat.isChannel ? 'text-white hover:bg-white/10' : ''}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Pin Bar — циклический навигатор: tap → скролл к current, highlight, индекс (i+1)%N; × только скрывает панель */}
      {isPinnedBarVisible && (
        <PinBanner
          pinnedMessages={pinnedMessages}
          currentPinnedIndex={currentIndex}
          onClose={handlePinnedBarClose}
          onBarClick={handlePinnedBarClick}
          onViewAllPinned={() => setAllPinnedSheetOpen(true)}
          onUnpinCurrent={handleUnpinCurrent}
        />
      )}

      {/* Messages — при скролле вверх подгружаются более ранние сообщения */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
        onScroll={() => {
          const el = messagesContainerRef.current;
          if (!el || !chatId || loadingMoreRef.current || !hasMoreOlder(chatId)) return;
          if (el.scrollTop < 80) {
            loadingMoreRef.current = true;
            scrollRestoreRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
            loadMoreMessages(chatId);
          }
        }}
      >
        <AnimatePresence>
          {groupedMessages.map((group) => (
            <div key={group.date} className="mb-2">
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 text-xs bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground shadow-sm">
                  {group.date}
                </span>
              </div>
              
              {/* Messages — spec 4.1–4.13: text, voice, video_note, file, system */}
              {group.messages.map((message) =>
                message.type === 'system' ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center my-3"
                  >
                    <span className="px-3 py-1 text-xs text-muted-foreground bg-muted/60 rounded-full">
                      {message.content}
                    </span>
                  </motion.div>
                ) : (
                <ContextMenu key={message.id} onOpenChange={(open) => open && setActiveVideoNoteId(null)}>
                  <ContextMenuTrigger asChild>
                    <div className="mb-2">
                    <motion.div
                      id={`msg-${message.id}`}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        backgroundColor: highlightMessageId === message.id ? 'hsl(var(--muted))' : 'transparent',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      className={cn(
                        'flex rounded-lg transition-colors min-w-0',
                        message.isOutgoing ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'min-w-0 max-w-full',
                          pinnedIds.includes(message.id) && 'border-l-4 border-primary pl-1 rounded-l',
                          chat?.isChannel && message.senderId === chatId && 'relative'
                        )}
                      >
                      {chat?.isChannel && message.senderId === chatId && (
                        <span className="absolute top-0 right-0 text-xs italic z-10" style={{ fontSize: 12, color: '#A9A9A9' }}>
                          {formatMessageTime(message.timestamp)}
                        </span>
                      )}
                      {message.type === 'voice' ? (
                        <VoiceMessageBubble
                          message={message}
                          formatTime={formatMessageTime}
                          renderStatus={renderMessageStatus}
                        />
                      ) : message.type === 'video_note' ? (
                        <VideoNoteBubble
                          message={message}
                          formatTime={formatMessageTime}
                          renderStatus={renderMessageStatus}
                          activeVideoNoteId={activeVideoNoteId}
                          onActivate={setActiveVideoNoteId}
                          onDeactivate={() => setActiveVideoNoteId(null)}
                        />
                      ) : message.type === 'image' ? (
                        <div
                          className={cn(
                            'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble overflow-hidden shadow-soft',
                            message.isOutgoing ? 'rounded-bubble-outgoing' : 'rounded-bubble-incoming'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setViewerSrc(message.mediaUrl);
                              setViewerType('image');
                              setViewerOpen(true);
                            }}
                            className="block w-full text-left"
                          >
                            <img
                              src={message.mediaUrl}
                              alt=""
                              className={cn(
                                'max-h-[240px] w-full object-cover transition-[filter] duration-200',
                                !loadedMediaIds.has(message.id) && 'blur-md'
                              )}
                              onLoad={() => setLoadedMediaIds((prev) => new Set(prev).add(message.id))}
                            />
                            <div className="px-3 py-2 flex items-center justify-between gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.isOutgoing && renderMessageStatus(message)}
                            </div>
                          </button>
                        </div>
                      ) : message.type === 'video' ? (
                        <div
                          className={cn(
                            'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble overflow-hidden shadow-soft',
                            message.isOutgoing ? 'rounded-bubble-outgoing' : 'rounded-bubble-incoming'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setViewerSrc(message.mediaUrl);
                              setViewerType('video');
                              setViewerOpen(true);
                            }}
                            className="block w-full text-left"
                          >
                            <video
                              src={message.mediaUrl}
                              className={cn(
                                'max-h-[240px] w-full object-cover transition-[filter] duration-200',
                                !loadedMediaIds.has(message.id) && 'blur-md'
                              )}
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedData={() => setLoadedMediaIds((prev) => new Set(prev).add(message.id))}
                            />
                            <div className="px-3 py-2 flex items-center justify-between gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.isOutgoing && renderMessageStatus(message)}
                            </div>
                          </button>
                        </div>
                      ) : message.type === 'contact' ? (
                        <div
                          className={cn(
                            'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble px-3 py-2 shadow-soft flex items-center gap-3',
                            message.isOutgoing
                              ? 'rounded-bubble-outgoing bg-[hsl(var(--message-outgoing))] text-[hsl(var(--message-outgoing-foreground))]'
                              : 'rounded-bubble-incoming bg-[hsl(var(--message-incoming))] text-[hsl(var(--message-incoming-foreground))]'
                          )}
                        >
                          <UserAvatar
                            src={message.contactAvatar}
                            name={message.contactName || message.content}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{message.contactName || message.content}</p>
                            {message.contactPhone && (
                              <p className="text-[10px] text-muted-foreground">{message.contactPhone}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.isOutgoing && renderMessageStatus(message)}
                            </div>
                          </div>
                        </div>
                      ) : message.type === 'sticker' ? (
                        <StickerBubble
                          message={message}
                          formatTime={formatMessageTime}
                          renderStatus={renderMessageStatus}
                          onDelete={() =>
                            setMessages((prev) => prev.filter((m) => m.id !== message.id))
                          }
                        />
                      ) : message.type === 'file' ? (
                        <div
                          className={cn(
                            'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble px-3 py-2 shadow-soft flex items-center gap-3',
                            message.isOutgoing
                              ? 'rounded-bubble-outgoing bg-[hsl(var(--message-outgoing))] text-[hsl(var(--message-outgoing-foreground))]'
                              : 'rounded-bubble-incoming bg-[hsl(var(--message-incoming))] text-[hsl(var(--message-incoming-foreground))]'
                          )}
                        >
                          <FileText className="h-8 w-8 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{message.fileName || message.content}</p>
                            {message.fileSize != null && (
                              <p className="text-[10px] text-muted-foreground">
                                {(message.fileSize / 1024).toFixed(1)} KB
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {renderMessageStatus(message)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble px-3 py-2 shadow-soft',
                            message.isOutgoing
                              ? 'rounded-bubble-outgoing bg-[hsl(var(--message-outgoing))] text-[hsl(var(--message-outgoing-foreground))]'
                              : 'rounded-bubble-incoming bg-[hsl(var(--message-incoming))] text-[hsl(var(--message-incoming-foreground))]'
                          )}
                        >
                          {message.replyTo && (() => {
                            const replied = getRepliedMessage(message.replyTo);
                            if (!replied) return <p className="text-xs text-muted-foreground italic border-l-2 border-primary/50 pl-2 mb-1">Сообщение удалено</p>;
                            return (
                              <button
                                type="button"
                                onClick={() => scrollToMessage(replied.id)}
                                className="text-left w-full border-l-2 border-primary/50 pl-2 mb-1.5 hover:opacity-80"
                              >
                                <p className="text-xs font-medium text-primary">
                                  {replied.isOutgoing ? 'Вы' : chat?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {replied.type === 'text' ? replied.content : replied.type === 'voice' ? 'Голосовое сообщение' : replied.content}
                                </p>
                              </button>
                            );
                          })()}
                          {message.isForwarded && (
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Переслано от {message.forwardSenderName ?? 'пользователя'}
                            </p>
                          )}
                          <p
                            className={cn(
                              'whitespace-pre-wrap break-words',
                              isOnlyEmoji(message.content) && 'text-[1.5em] leading-tight',
                              chat?.isChannel && message.senderId === chatId && 'text-base'
                            )}
                          >
                            {chat?.isChannel && message.senderId === chatId ? (
                              (() => {
                                const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
                                const parts = message.content.split(urlRegex);
                                return parts.map((part, i) =>
                                  /^https?:\/\//.test(part) || /^www\./.test(part) ? (
                                    <a
                                      key={i}
                                      href={part.startsWith('www') ? `https://${part}` : part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                      style={{ color: '#006CFF' }}
                                    >
                                      {part}
                                    </a>
                                  ) : (
                                    part
                                  )
                                );
                              })()
                            ) : (
                              message.content
                            )}
                          </p>
                          {!(chat?.isChannel && message.senderId === chatId) && (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 mt-1',
                              message.isOutgoing ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {message.editedAt && (
                              <span className="text-[10px] text-muted-foreground italic">ред.</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {renderMessageStatus(message)}
                          </div>
                          )}
                        </div>
                      )}
                      </div>
                    </motion.div>
                    {chat?.isChannel && message.senderId === chatId && (
                      <div className="flex justify-start px-1">
                        <ChannelPostFooter
                          post={message}
                          chatId={chatId!}
                          commentCount={commentCountByPostId[message.id] ?? 0}
                          onOpenComments={() => navigate(`/chat/${chatId}/comments/${message.id}`)}
                          onReaction={(emoji, add) => {
                            if (chatId) updateMessageReaction(chatId, message.id, emoji, add);
                          }}
                        />
                      </div>
                    )}
                    {chat?.isBot && !message.isOutgoing && message.senderId === chatId && message.buttons?.length > 0 && (
                      <div className="flex justify-start px-1 mt-1">
                        <div className="min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)]">
                          {message.isProcessing && (
                            <p className="text-xs text-muted-foreground italic mb-2">обрабатывается...</p>
                          )}
                          <BotButtons
                            message={message}
                            isReplySelected={(labelOrAction) =>
                              messages.some(
                                (m) => m.isOutgoing && m.replyTo === message.id && m.content === labelOrAction
                              )
                            }
                            onInlineClick={(btn) => {
                              if (!chatId) return;
                              const text = btn.action ?? btn.label;
                              addMessageToChat(chatId, {
                                id: `msg-${Date.now()}`,
                                chatId,
                                senderId: 'user-1',
                                type: 'text',
                                content: text,
                                timestamp: new Date(),
                                status: 'sent',
                                isOutgoing: true,
                              });
                            }}
                            onReplyClick={(btn) => {
                              if (!chatId) return;
                              const text = btn.action ?? btn.label;
                              addMessageToChat(chatId, {
                                id: `msg-${Date.now()}`,
                                chatId,
                                senderId: 'user-1',
                                type: 'text',
                                content: text,
                                timestamp: new Date(),
                                status: 'sent',
                                isOutgoing: true,
                                replyTo: message.id,
                              });
                            }}
                            onUrlClick={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                          />
                        </div>
                      </div>
                    )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent
                    className="w-56 rounded-xl shadow-modal border bg-popover"
                  >
                    <ContextMenuItem
                      onSelect={() => {
                        setReplyToMessage(message);
                        setTimeout(() => textareaRef.current?.focus(), 100);
                      }}
                      className="cursor-pointer"
                    >
                      <Reply className="mr-2 h-4 w-4" />
                      Ответить
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() => copyMessageText(message)}
                      className="cursor-pointer"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Копировать
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() => setForwardMessage(message)}
                      className="cursor-pointer"
                    >
                      <Forward className="mr-2 h-4 w-4" />
                      Переслать
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() => {
                        const ids = chatId ? pinnedMessageIds[chatId] ?? [] : [];
                        const isPinned = ids.includes(message.id);
                        if (isPinned) {
                          setPinnedMessageIds((prev) => ({
                            ...prev,
                            [chatId!]: ids.filter((id) => id !== message.id),
                          }));
                        } else {
                          setPinnedMessageIds((prev) => ({
                            ...prev,
                            [chatId!]: [...ids, message.id],
                          }));
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Pin className="mr-2 h-4 w-4" />
                      {pinnedIds.includes(message.id) ? 'Открепить' : 'Закрепить'}
                    </ContextMenuItem>
                    {message.isOutgoing && message.type === 'text' && (
                      <ContextMenuItem
                        onSelect={() => {
                          setEditMessageId(message.id);
                          setInputValue(message.content);
                          setReplyToMessage(null);
                          setTimeout(() => textareaRef.current?.focus(), 100);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Изменить
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem
                      onSelect={() => {
                        if (chat?.isBot && chatId) {
                          setMessages((prev) => prev.filter((m) => m.id !== message.id));
                          if ((pinnedMessageIds[chatId] ?? []).includes(message.id)) {
                            setPinnedMessageIds((prev) => ({
                              ...prev,
                              [chatId]: (prev[chatId] ?? []).filter((id) => id !== message.id),
                            }));
                          }
                        } else {
                          setDeleteModal({ messageId: message.id, scope: 'self' });
                        }
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                  )
                )}
            </div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Fullscreen video note recording overlay — круг на весь экран для удобного просмотра */}
      {recordingVideoNote && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-4">
            <div className="w-[min(320px,85vmin)] h-[min(320px,85vmin)] rounded-full overflow-hidden shrink-0 ring-4 ring-destructive/80 ring-offset-4 ring-offset-black shadow-2xl">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2 text-destructive">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
              </span>
              <span className="text-lg font-medium tabular-nums">{recordSeconds}s</span>
            </div>
            <p className="text-sm text-muted-foreground">Запись видеокружка...</p>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-white hover:bg-white/10"
                onClick={() => {
                  cancelVideoNoteRecording();
                  if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
                  setRecordingVideoNote(false);
                }}
              >
                Отмена
              </Button>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={async () => {
                  if (!chatId) return;
                  const result = await stopVideoNoteRecording();
                  if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
                  if (result) {
                    const url = URL.createObjectURL(result.blob);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}`,
                        chatId,
                        senderId: 'user-1',
                        type: 'video_note',
                        content: 'Видеокружок',
                        timestamp: new Date(),
                        status: 'sent',
                        isOutgoing: true,
                        videoNoteDuration: result.durationSec,
                        duration: result.durationSec,
                        mediaUrl: url,
                      } as Message,
                    ]);
                  }
                  setRecordingVideoNote(false);
                }}
              >
                Отправить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input area — для каналов скрыта (только чтение постов); плавающий стиль */}
      {!chat?.isChannel && (
      <div className="sticky bottom-0 bg-background border-t border-border pb-safe rounded-t-2xl shadow-soft">
        {(replyToMessage || editMessageId) && !recordingVoice && !recordingVideoNote && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border">
            <div className="flex-1 min-w-0">
              {replyToMessage && (
                <>
                  <p className="text-xs font-medium text-muted-foreground">
                    {replyToMessage.isOutgoing ? 'Вы' : chat?.name}
                  </p>
                  <p className="text-sm truncate">
                    {replyToMessage.type === 'text'
                      ? replyToMessage.content
                      : replyToMessage.type === 'voice'
                        ? 'Голосовое сообщение'
                        : replyToMessage.type === 'image'
                          ? 'Фото'
                          : replyToMessage.content}
                  </p>
                </>
              )}
              {editMessageId && (
                <p className="text-sm font-medium text-muted-foreground">Редактирование</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => {
                setReplyToMessage(null);
                setEditMessageId(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {copyFeedback && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg z-10">
            Скопировано
          </div>
        )}
        {chat?.isBot && chat?.keyboard?.length && !recordingVoice && !recordingVideoNote && (
          <BotKeyboard
            rows={chat.keyboard}
            onButtonPress={(label) => {
              if (!chatId) return;
              addMessageToChat(chatId, {
                id: `msg-${Date.now()}`,
                chatId,
                senderId: 'user-1',
                type: 'text',
                content: label,
                timestamp: new Date(),
                status: 'sent',
                isOutgoing: true,
              });
            }}
          />
        )}
        {recordingVoice ? (
          <div className="flex items-center gap-3 p-3">
            <span className="flex items-center gap-2 text-destructive">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
              <span className="tabular-nums font-medium">
                {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}
              </span>
            </span>
            <span className="text-sm text-muted-foreground flex-1">
              Идёт запись
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                cancelRecording();
                setRecordingVoice(false);
              }}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (recordingVoice && chatId) {
                  const result = await stopRecording();
                  if (result) {
                    const url = URL.createObjectURL(result.blob);
                    const wf = Array.from({ length: 48 }, () => Math.random() * 0.5 + 0.3);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}`,
                        chatId,
                        senderId: 'user-1',
                        type: 'voice',
                        content: 'Голосовое сообщение',
                        timestamp: new Date(),
                        status: 'sent',
                        isOutgoing: true,
                        duration: result.durationSec,
                        waveform: wf,
                        mediaUrl: url,
                      } as Message,
                    ]);
                  }
                }
                setRecordingVoice(false);
              }}
            >
              Отправить
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2 p-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение"
                rows={1}
                className="min-h-[40px] max-h-[120px] py-2.5 pr-[7.5rem] resize-none bg-secondary border-none focus-visible:ring-1"
              />
              <div className="absolute right-1 bottom-1 flex items-center gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label="Прикрепить"
                  onClick={() => {
                    setActiveVideoNoteId(null);
                    setAttachOpen(true);
                  }}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      aria-label="Смайлики"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    sideOffset={8}
                    className="w-auto p-2 rounded-xl"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <EmojiPicker onSelect={handleEmojiSelect} />
                  </PopoverContent>
                </Popover>
                <StickerButtonAndPanel />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {inputValue.trim() ? (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="shrink-0"
                >
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="rounded-full bg-primary"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex items-center gap-0 shrink-0"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => setRecordingVideoNote(true)}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full bg-secondary text-muted-foreground"
                    onClick={async () => {
                      const ok = await startRecording();
                      if (ok) setRecordingVoice(true);
                    }}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      )}

      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleMediaInputChange}
      />

      <AttachSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        onSelect={handleAttachSelect}
      />

      <Sheet open={contactPickerOpen} onOpenChange={setContactPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t shadow-modal pb-safe max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Выберите контакт</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto py-4 -mx-6 px-6">
            {contacts
              .filter((c) => !c.isBlocked)
              .map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() =>
                    handleContactSelect({
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      avatar: contact.avatar,
                    })
                  }
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary active:bg-secondary transition-colors text-left"
                >
                  <UserAvatar src={contact.avatar} name={contact.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.phone && (
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteModal} onOpenChange={(open) => !open && setDeleteModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сообщение?</AlertDialogTitle>
            <AlertDialogDescription>
              Удалить у себя или у всех участников чата?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteModal || !chatId) return;
                setMessages((prev) => prev.filter((m) => m.id !== deleteModal.messageId));
                if (chatId && (pinnedMessageIds[chatId] ?? []).includes(deleteModal.messageId)) {
                  setPinnedMessageIds((prev) => ({
                    ...prev,
                    [chatId]: (prev[chatId] ?? []).filter((id) => id !== deleteModal.messageId),
                  }));
                }
                setDeleteModal(null);
              }}
            >
              Удалить у себя
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteModal || !chatId) return;
                setMessages((prev) => prev.filter((m) => m.id !== deleteModal.messageId));
                if ((pinnedMessageIds[chatId] ?? []).includes(deleteModal.messageId)) {
                  setPinnedMessageIds((prev) => ({
                    ...prev,
                    [chatId]: (prev[chatId] ?? []).filter((id) => id !== deleteModal.messageId),
                  }));
                }
                setDeleteModal(null);
              }}
            >
              Удалить у всех
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!forwardMessage} onOpenChange={(open) => !open && setForwardMessage(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t shadow-modal pb-safe max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Переслать в чат</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto py-4 -mx-6 px-6">
            {chats
              .filter((c) => c.id !== chatId)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (!forwardMessage) return;
                    addMessageToChat(c.id, {
                      ...forwardMessage,
                      id: `msg-${Date.now()}`,
                      chatId: c.id,
                      timestamp: new Date(),
                      status: 'sent',
                      isForwarded: true,
                      forwardSenderName: chat?.name ?? 'Вы',
                    });
                    setForwardMessage(null);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary active:bg-secondary transition-colors text-left"
                >
                  <UserAvatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{c.name}</p>
                    {c.isGroup && (
                      <p className="text-xs text-muted-foreground">{c.members?.length ?? 0} участников</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={chatInfoOpen} onOpenChange={setChatInfoOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t shadow-modal pb-safe max-h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="sr-only">Информация о чате</SheetTitle>
          </SheetHeader>
          {chat && (
            <>
              <div className="flex flex-col items-center gap-2 py-4 border-b border-border">
                <UserAvatar name={chat.name} size="2xl" />
                <p className="font-semibold text-lg">{chat.name}</p>
                {chat.isGroup && (
                  <p className="text-sm text-muted-foreground">{chat.members?.length ?? 0} участников</p>
                )}
                {chat.isChannel && chat.username && (
                  <p className="text-sm text-muted-foreground">@{chat.username}</p>
                )}
              </div>
              {chat.isChannel && chatId && (
                <div className="px-4 py-3 border-b border-border">
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
                    onClick={() => {
                      setChatInfoOpen(false);
                      unsubscribeFromChannel(chatId);
                      navigate('/');
                    }}
                  >
                    Отписаться от канала
                  </Button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto py-4">
                <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Закреплённые сообщения
                </h3>
                {pinnedMessages.length === 0 ? (
                  <p className="px-4 text-sm text-muted-foreground">Нет закреплённых сообщений</p>
                ) : (
                  <>
                    {chatId && pinnedBarVisible[chatId] === false && (
                      <div className="px-4 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setPinnedBarVisible((prev) => ({ ...prev, [chatId]: true }));
                          }}
                        >
                          Показать панель закреплённых
                        </Button>
                      </div>
                    )}
                    <div className="space-y-1">
                      {[...pinnedMessages]
                        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                        .map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => {
                              setChatInfoOpen(false);
                              setTimeout(() => scrollToMessage(msg.id, HIGHLIGHT_DURATION_MS), 300);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/80 active:bg-muted transition-colors text-left"
                          >
                            <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{getMessagePreview(msg)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Экран «Все закреплённые» — открывается по long press по pinned bar */}
      <Sheet open={allPinnedSheetOpen} onOpenChange={setAllPinnedSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t shadow-modal pb-safe max-h-[70vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-primary rotate-45" />
              Закреплённые сообщения
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {pinnedMessages.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">Нет закреплённых сообщений</p>
            ) : (
              <div className="space-y-1">
                {[...pinnedMessages]
                  .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                  .map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => {
                        setAllPinnedSheetOpen(false);
                        setTimeout(() => scrollToMessage(msg.id, HIGHLIGHT_DURATION_MS), 300);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/80 active:bg-muted transition-colors text-left rounded-lg"
                    >
                      <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{getMessagePreview(msg)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <MediaViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        src={viewerSrc}
        type={viewerType}
      />

    </div>
    </StickerProvider>
  );
};

function StickerButtonAndPanel() {
  const { openPanel } = useStickers();
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        aria-label="Стикеры"
        onClick={openPanel}
      >
        <StickerIcon className="h-5 w-5" />
      </Button>
      <StickerPanel />
    </>
  );
}

export default ChatPage;
