import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Message, Chat, ChatMemberUser, MessageDeliveryStatus } from '../types';
import { messagesService } from '../services/messages.service';
import { chatsService } from '../services/chats.service';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VideoCall } from '../components/VideoCall';
import { MessageInputBar } from '../components/MessageInputBar';
import { VideoMessagePlayer } from '../components/VideoMessagePlayer';
import { EmojiPicker } from '../components/EmojiPicker';
import { encryptionService } from '../services/encryption.service';
import { mediaService } from '../services/media.service';
import { api } from '../services/api';
import { soundService } from '../services/sound.service';
import { callStatsService } from '../services/call-stats.service';

export const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [callMode, setCallMode] = useState<'voice' | 'video'>('video');
  const [useEncryption, setUseEncryption] = useState(false);
  const [hasCameraAvailable, setHasCameraAvailable] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{
    chatId: string;
    callerId: string;
    offer: RTCSessionDescriptionInit;
    videoMode?: boolean;
  } | null>(null);
  const [missedCall, setMissedCall] = useState<{ chatId: string; at: Date } | null>(null);
  const incomingCallRef = useRef<typeof incomingCall>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [fullscreenMedia, setFullscreenMedia] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const [forwardMessageToSend, setForwardMessageToSend] = useState<Message | null>(null);
  const [forwardChats, setForwardChats] = useState<Chat[]>([]);
  const [forwarding, setForwarding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTempMessageIdRef = useRef<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, isUserOnline, connectionStatus } = useWebSocket();
  const { user } = useAuth();

  const contact: ChatMemberUser | null = chat?.members?.find((m) => m.userId !== user?.id)?.user ?? null;

  useEffect(() => {
    if (!chatId) {
      navigate('/');
      return;
    }

    // При входе в чат считаем пропущенный звонок просмотренным
    setMissedCall((prev) => (prev?.chatId === chatId ? null : prev));

    // Явно присоединяемся к комнате чата, чтобы получать сообщения в реальном времени
    // (важно, если чат создан после подключения WebSocket)
    socket.joinChat(chatId);

    chatsService.getChat(chatId).then(setChat).catch(() => setChat(null));

    loadMessages();
    initializeEncryption();

    const handleMessageReceived = async (message: Message) => {
      if (message.chatId !== chatId) return;
      if (message.isEncrypted && message.encryptedContent && message.iv) {
        try {
          const decrypted = await encryptionService.decryptMessage(
            message.encryptedContent,
            message.iv,
            chatId,
          );
          if (decrypted) message.content = decrypted;
        } catch {
          message.content = '[Ошибка расшифровки]';
        }
      }
      setMessages((prev) => {
        const fromMe = message.userId === user?.id;
        const tempId = lastTempMessageIdRef.current;
        if (fromMe && tempId) {
          lastTempMessageIdRef.current = null;
          const hasTemp = prev.some((m) => m.id === tempId);
          if (hasTemp)
            return prev.map((m) =>
              m.id === tempId
                ? { ...message, updatedAt: message.createdAt, deliveryStatus: 'sent' as MessageDeliveryStatus }
                : m,
            );
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.userId !== user?.id) {
        socket.markAsDelivered(message.id);
        socket.markAsRead(message.id);
        soundService.playMessageNotification();
      }
      scrollToBottom();
    };

    const handleCallOffer = (data: {
      chatId: string;
      offer: RTCSessionDescriptionInit;
      callerId: string;
    }) => {
      if (data.chatId === chatId) {
        incomingCallRef.current = data;
        setIncomingCall(data);
        soundService.playRingtone();
      }
    };

    const handleCallEnd = (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        soundService.stopRingtone();
        const hadIncoming = !!incomingCallRef.current;
        incomingCallRef.current = null;
        setIncomingCall(null);
        if (hadIncoming) setMissedCall({ chatId: data.chatId, at: new Date() });
      }
    };

    const handleDeliveryStatus = (data: { messageId: string; status: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, deliveryStatus: data.status as MessageDeliveryStatus }
            : m,
        ),
      );
    };

    const handleSocketError = (data: { message?: string }) => {
      if (data?.message) alert('Ошибка: ' + data.message);
    };

    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      if (data.chatId === chatId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    socket.onMessageReceived(handleMessageReceived);
    socket.on('call:offer', handleCallOffer);
    socket.on('call:end', handleCallEnd);
    socket.onDeliveryStatus(handleDeliveryStatus);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('error', handleSocketError);

    return () => {
      socket.offMessageReceived(handleMessageReceived);
      socket.off('call:offer', handleCallOffer);
      socket.off('call:end', handleCallEnd);
      socket.offDeliveryStatus(handleDeliveryStatus);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('error', handleSocketError);
    };
  }, [chatId, socket, navigate, user?.id, connectionStatus]);

  useEffect(() => {
    if (!forwardMessageToSend) return;
    chatsService.getChats().then(setForwardChats).catch(() => setForwardChats([]));
  }, [forwardMessageToSend]);

  // Проверка доступности камеры при монтировании компонента
  useEffect(() => {
    checkMediaDevices().then((devices) => {
      setHasCameraAvailable(devices.hasCamera);
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [contextMenu]);

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const data = await messagesService.getMessages(chatId);
      const decryptedMessages = await Promise.all(
        data.map(async (msg: Message & { messageDeliveries?: { status: string }[] }) => {
          let out = { ...msg } as Message;
          const status = msg.messageDeliveries?.[0]?.status;
          if (status === 'read' || status === 'delivered' || status === 'sent') {
            out.deliveryStatus = status as MessageDeliveryStatus;
          }
          if (msg.isEncrypted && msg.encryptedContent && msg.iv) {
            try {
              const decrypted = await encryptionService.decryptMessage(
                msg.encryptedContent,
                msg.iv,
                chatId,
              );
              if (decrypted) out.content = decrypted;
            } catch {}
          }
          return out;
        }),
      );
      const ordered = decryptedMessages.reverse();
      setMessages(ordered);
      // Подтверждение доставки/прочтения при открытии чата — тогда у отправителя появятся две галочки
      if (user?.id && socket?.isConnected?.()) {
        ordered.forEach((msg) => {
          if (msg.userId !== user.id) {
            socket.markAsDelivered(msg.id);
            socket.markAsRead(msg.id);
          }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeEncryption = async () => {
    if (!chatId || !user) return;
    try {
      const hasPrivateKey = await encryptionService.loadPrivateKey();
      if (!hasPrivateKey) {
        const { publicKey } = await encryptionService.generateKeyPair();
        await encryptionService.savePublicKey(publicKey);
      }
      const chatRes = await api.get(`/chats/${chatId}`);
      const otherMember = chatRes.data.members?.find((m: any) => m.userId !== user.id);
      if (otherMember) {
        const ok = await encryptionService.initializeChatEncryption(chatId, otherMember.userId);
        setUseEncryption(!!ok);
      }
    } catch {
      // Шифрование недоступно (например, по HTTP нет crypto.subtle) — работаем без E2EE
      setUseEncryption(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !chatId || !user) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      chatId,
      userId: user.id,
      content: text,
      messageType: 'text',
      isEncrypted: useEncryption,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryStatus: 'sent',
      replyToId: replyingTo?.id,
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, messageType: replyingTo.messageType, userId: replyingTo.userId } : undefined,
    };
    lastTempMessageIdRef.current = tempId;
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    scrollToBottom();
    setIsSending(true);
    try {
      await socket.sendMessage(chatId, text, useEncryption, replyingTo?.id ?? undefined);
      setReplyingTo(null);
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      lastTempMessageIdRef.current = null;
      const msg = err?.message || err?.response?.data?.message || 'Не удалось отправить сообщение.';
      alert(msg + (msg.includes('соединен') ? '' : ' Проверьте интернет и обновите страницу.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: { file: File; preview: string; type: 'image' | 'video' }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        next.push({ file, preview: URL.createObjectURL(file), type: 'image' });
      } else if (file.type.startsWith('video/')) {
        next.push({ file, preview: URL.createObjectURL(file), type: 'video' });
      }
    }
    setSelectedMedia((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeSelectedMedia = (index: number) => {
    setSelectedMedia((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearSelectedMedia = () => {
    selectedMedia.forEach((m) => m.preview && URL.revokeObjectURL(m.preview));
    setSelectedMedia([]);
  };

  const handleSendMedia = async () => {
    if (!selectedMedia.length || !chatId || !user) return;
    setIsSending(true);
    const caption = newMessage.trim() || undefined;
    try {
      await Promise.all(
        selectedMedia.map((item, i) => {
          const cap = i === 0 ? caption : undefined;
          return item.type === 'image'
            ? mediaService.uploadImage(item.file, chatId, cap)
            : mediaService.uploadVideo(item.file, chatId, cap);
        }),
      );
      clearSelectedMedia();
      setNewMessage('');
      loadMessages();
      scrollToBottom();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Не удалось отправить медиа.';
      alert(msg);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const DeliveryCheckmarks = ({ status }: { status?: MessageDeliveryStatus }) => {
    if (!status || status === 'sent') {
      return (
        <span className="inline-flex ml-1" title="Отправлено">
          <svg className="w-3.5 h-3.5 text-current opacity-80" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
          </svg>
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span className="inline-flex ml-1 -space-x-1.5" title="Доставлено">
          <svg className="w-3.5 h-3.5 text-current opacity-80" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
          </svg>
          <svg className="w-3.5 h-3.5 text-current opacity-80" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="inline-flex ml-1 -space-x-1.5 text-green-300" title="Просмотрено">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
      </span>
    );
  };

  const getAudioUrl = (audioUrl?: string) => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith('http')) return audioUrl;
    const baseUrl = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    return baseUrl ? `${baseUrl}${audioUrl}` : audioUrl;
  };

  const getMediaUrl = (mediaUrl?: string | null) => {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith('http')) return mediaUrl;
    const baseUrl = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    return baseUrl ? `${baseUrl}${mediaUrl}` : mediaUrl;
  };

  const handleStartVideoCall = () => {
    setCallMode('video');
    setIsInCall(true);
  };
  const handleStartVoiceCall = () => {
    setCallMode('voice');
    setIsInCall(true);
  };
  const handleEndCall = useCallback(() => {
    soundService.stopRingtone();
    incomingCallRef.current = null;
    setIsInCall(false);
    setIncomingCall(null);
  }, []);

  const toggleSelectMessage = (id: string) => {
    if (id.startsWith('temp-')) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await messagesService.deleteMessages(Array.from(selectedIds));
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      exitSelectionMode();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить сообщения');
    }
  };

  const contactName = contact?.username || contact?.email || 'Пользователь';

  if (loading && !chat) {
    return (
      <div className="flex items-center justify-center h-full min-h-0 bg-[#0b0b0b]">
        <div className="text-[#86868a]">Загрузка...</div>
      </div>
    );
  }

  if (isInCall || incomingCall) {
    const isIncoming = !!incomingCall;
    return (
      <VideoCall
        chatId={chatId || ''}
        isIncoming={isIncoming}
        callerId={incomingCall?.callerId}
        offer={incomingCall?.offer}
        videoMode={isIncoming ? (incomingCall?.videoMode ?? true) : callMode === 'video'}
        contactName={contactName}
        onEnd={handleEndCall}
        onAccepted={soundService.stopRingtone}
        onCallEndWithStats={(durationSeconds, cId, isVideo) => {
          callStatsService.saveCall(cId, durationSeconds, isVideo, contactName);
        }}
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0b0b0b] text-white">
      {missedCall && missedCall.chatId === chatId && (
        <div className="flex-none flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/20 border-b border-amber-500/30 text-amber-200">
          <span className="text-sm">Пропущенный звонок от {contactName}</span>
          <button
            type="button"
            onClick={() => setMissedCall(null)}
            className="p-1.5 rounded-full hover:bg-white/10"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {/* Шапка чата: назад, контакт, звонки — всегда видна */}
      <header className="flex-none flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#141414] shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-[#86868a] hover:text-white"
          aria-label="Назад"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-full bg-[#2d2d2f] flex items-center justify-center text-sm font-semibold shrink-0">
          {contactName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{contactName}</h1>
          <p className="text-xs text-[#86868a]">
            {isUserOnline(contact?.id, contact?.isOnline) ? (
              <span className="text-green-500">● В сети</span>
            ) : contact?.lastSeenAt ? (
              <span title={new Date(contact.lastSeenAt).toLocaleString('ru-RU')}>
                был(а) {formatLastSeen(contact.lastSeenAt)}
              </span>
            ) : (
              'не в сети'
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {selectionMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Удалить {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
              <button onClick={exitSelectionMode} className="px-3 py-1.5 text-sm rounded-lg bg-[#2d2d2f] hover:bg-[#3d3d3f]">
                Отмена
              </button>
            </>
          ) : (
            <>
              {useEncryption && (
                <span className="px-2 py-1 text-xs text-green-400 bg-green-500/20 rounded-lg" title="Шифрование">
                  🔒
                </span>
              )}
              <button
                onClick={() => setSelectionMode(true)}
                className="p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#86868a] hover:text-white"
                title="Выбрать сообщения"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
              {hasCameraAvailable && (
                <button
                  onClick={handleStartVideoCall}
                  className="p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#0a84ff]"
                  title="Видеозвонок"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleStartVoiceCall}
                className="p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#0a84ff]"
                title="Голосовой звонок"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.81-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .27-.11.52-.29.7l-2.31 2.31c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.66-1.81.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Сообщения — скролл только здесь */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 pb-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[#86868a] text-sm">
            <p>Пока нет сообщений.</p>
            <p>Напишите что-нибудь или нажмите на микрофон для голосового.</p>
          </div>
        )}
        {messages.map((message) => {
          const isOwn = message.userId === user?.id;
          const isVoice = message.messageType === 'voice';
          const isImage = message.messageType === 'image';
          const isVideo = message.messageType === 'video';
          const audioUrl = getAudioUrl(message.audioUrl);
          const mediaUrl = getMediaUrl(message.mediaUrl);
          const canSelect = isOwn && !message.id.startsWith('temp-');
          const isSelected = selectedIds.has(message.id);

          const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            if (selectionMode) return;
            setContextMenu({ x: e.clientX, y: e.clientY, message });
          };
          const handleTouchStart = (e: React.TouchEvent) => {
            if (selectionMode) return;
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            longPressTimerRef.current = setTimeout(() => {
              longPressTimerRef.current = null;
              setContextMenu({ x, y, message });
            }, 500);
          };
          const handleTouchEnd = () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          };
          const handleTouchMove = () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          };

          return (
            <div
              key={message.id}
              className={`flex min-w-0 max-w-full ${isOwn ? 'justify-end' : 'justify-start'} ${selectionMode && canSelect ? 'cursor-pointer' : ''}`}
              onClick={
                selectionMode && canSelect
                  ? () => toggleSelectMessage(message.id)
                  : undefined
              }
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
              <div
                className={`max-w-[85%] sm:max-w-md min-w-0 overflow-hidden px-4 py-2.5 rounded-2xl flex items-start gap-2 ${
                  isOwn
                    ? 'bg-[#0a84ff] text-white rounded-br-md'
                    : 'bg-[#2d2d2f] text-white rounded-bl-md'
                } ${selectionMode && canSelect && isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0b0b]' : ''}`}
              >
                {selectionMode && canSelect && (
                  <span className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-white/60 inline-block" />
                    )}
                  </span>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {message.replyTo && (
                    <div className={`mb-1.5 pl-2 border-l-2 ${isOwn ? 'border-blue-200' : 'border-white/40'} text-xs opacity-90 truncate max-w-full`}>
                      {message.replyTo.content && (
                        <span className="block truncate">{message.replyTo.content}</span>
                      )}
                    </div>
                  )}
                  {isVoice && audioUrl ? (
                    <div className="chat-audio-wrap" onClick={selectionMode ? (e) => e.stopPropagation() : undefined}>
                      <audio controls preload="metadata">
                        <source src={audioUrl} type="audio/webm" />
                        <source src={audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  ) : isImage && mediaUrl ? (
                    <div className="space-y-1">
                      <img
                        src={mediaUrl}
                        alt=""
                        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                        onClick={(ev) => { if (!selectionMode) { ev.stopPropagation(); setFullscreenMedia(mediaUrl); } }}
                      />
                      {message.content && message.content !== 'Фото' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                  ) : isVideo && mediaUrl ? (
                    <div className="space-y-1" onClick={(ev) => selectionMode && ev.stopPropagation()}>
                      <VideoMessagePlayer
                        src={mediaUrl}
                        className="max-h-64"
                        onFullscreen={() => setFullscreenMedia(mediaUrl)}
                      />
                      {message.content && message.content !== 'Видео' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 flex items-center justify-end gap-0.5 ${isOwn ? 'text-blue-200' : 'text-[#86868a]'}`}>
                    {formatTime(message.createdAt)}
                    {isOwn && <DeliveryCheckmarks status={message.deliveryStatus} />}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {contextMenu && (() => {
        const menuW = 160;
        const menuH = 200;
        const padding = 8;
        const left = Math.max(padding, Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - menuW - padding : contextMenu.x));
        const top = Math.max(padding, Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - menuH - padding : contextMenu.y));
        return (
        <div
          className="fixed z-50 min-w-[140px] py-1 rounded-xl bg-[#2d2d2f] border border-white/10 shadow-xl"
          style={{ left, top }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
            onClick={() => {
              setReplyingTo(contextMenu.message);
              setContextMenu(null);
            }}
          >
            Ответить
          </button>
          {contextMenu.message.userId === user?.id && (
            <>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                onClick={async () => {
                  try {
                    await messagesService.deleteMessages([contextMenu.message.id]);
                    setMessages((prev) => prev.filter((m) => m.id !== contextMenu.message.id));
                  } catch {
                    alert('Не удалось удалить сообщение');
                  }
                  setContextMenu(null);
                }}
              >
                Удалить у меня
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10"
                onClick={async () => {
                  try {
                    await messagesService.deleteForEveryone(contextMenu.message.id);
                    setMessages((prev) => prev.filter((m) => m.id !== contextMenu.message.id));
                  } catch {
                    alert('Не удалось удалить у всех');
                  }
                  setContextMenu(null);
                }}
              >
                Удалить у всех
              </button>
            </>
          )}
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
            onClick={() => {
              setForwardMessageToSend(contextMenu.message);
              setContextMenu(null);
            }}
          >
            Переслать
          </button>
        </div>
        );
      })()}

      {forwardMessageToSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setForwardMessageToSend(null)}
        >
          <div
            className="bg-[#1c1c1e] rounded-2xl max-w-sm w-full max-h-[70vh] flex flex-col border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Переслать в чат</h3>
              <p className="text-sm text-[#86868a] mt-0.5 truncate">
                {forwardMessageToSend.content || 'Медиа'}
              </p>
            </div>
            <ul className="overflow-y-auto flex-1 min-h-0 p-2">
              {forwardChats
                .filter((c) => c.id !== chatId)
                .map((chat) => {
                  const other = chat.members?.find((m) => m.userId !== user?.id)?.user;
                  const title = chat.name || other?.username || other?.email || chat.id.slice(0, 8);
                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        disabled={forwarding}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-left disabled:opacity-50"
                        onClick={async () => {
                          setForwarding(true);
                          try {
                            const res = await messagesService.forwardMessage(
                              forwardMessageToSend.id,
                              chat.id,
                            );
                            if (res.success) {
                              setForwardMessageToSend(null);
                              setForwardChats([]);
                            } else {
                              alert('Не удалось переслать');
                            }
                          } catch {
                            alert('Не удалось переслать');
                          } finally {
                            setForwarding(false);
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#2d2d2f] flex items-center justify-center text-sm font-semibold shrink-0">
                          {title.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white truncate">{title}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
            {forwardChats.filter((c) => c.id !== chatId).length === 0 && (
              <p className="p-4 text-sm text-[#86868a]">Нет других чатов для пересылки</p>
            )}
            <div className="p-3 border-t border-white/10">
              <button
                type="button"
                className="w-full py-2 rounded-xl bg-[#2d2d2f] text-white hover:bg-[#3d3d3f]"
                onClick={() => setForwardMessageToSend(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель ввода в стиле Telegram: микрофон | смайлик | поле | скрепка | отправка */}
      <div className="chat-page-footer relative flex-none shrink-0 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#141414]">
        {replyingTo && (
          <div className="flex items-center gap-2 py-2 px-3 mb-1 rounded-xl bg-[#2d2d2f] border border-white/10">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#86868a]">Ответ на:</p>
              <p className="text-sm truncate">{replyingTo.content || 'Сообщение'}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="shrink-0 p-1.5 rounded-full hover:bg-white/10 text-[#86868a]"
              aria-label="Отменить ответ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <EmojiPicker
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
        />
        {selectedMedia.length > 0 && (
          <div className="w-full flex gap-2 overflow-x-auto py-2 mb-1">
            {selectedMedia.map((item, i) => (
              <div key={i} className="relative shrink-0">
                {item.type === 'image' ? (
                  <img src={item.preview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <video src={item.preview} className="w-16 h-16 object-cover rounded-lg" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeSelectedMedia(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
                  aria-label="Убрать"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2 min-h-0 w-full">
          <MessageInputBar
            value={newMessage}
            onChange={setNewMessage}
            onSubmit={() => (selectedMedia.length > 0 ? handleSendMedia() : handleSendMessage())}
            onEmojiClick={() => setEmojiOpen((v) => !v)}
            onAttachmentClick={handleAttachmentClick}
            placeholder="Сообщение"
            isSending={isSending}
            hasAttachments={selectedMedia.length > 0}
            renderMic={
              !(newMessage.trim() || selectedMedia.length > 0) ? (
                <VoiceRecorder chatId={chatId || ''} onSent={() => loadMessages()} />
              ) : null
            }
          />
        </div>
      </div>

      {fullscreenMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenMedia(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setFullscreenMedia(null)}
        >
          <img
            src={fullscreenMedia}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            aria-label="Закрыть"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};
