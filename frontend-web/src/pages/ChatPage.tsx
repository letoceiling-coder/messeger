import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Message, Chat, ChatMemberUser, MessageDeliveryStatus } from '../types';
import { messagesService } from '../services/messages.service';
import { chatsService } from '../services/chats.service';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VideoCall } from '../components/VideoCall';
import { encryptionService } from '../services/encryption.service';
import { api } from '../services/api';

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
  const [incomingCall, setIncomingCall] = useState<{
    chatId: string;
    callerId: string;
    offer: RTCSessionDescriptionInit;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTempMessageIdRef = useRef<string | null>(null);
  const { socket, isUserOnline } = useWebSocket();
  const { user } = useAuth();

  const contact: ChatMemberUser | null = chat?.members?.find((m) => m.userId !== user?.id)?.user ?? null;

  useEffect(() => {
    if (!chatId) {
      navigate('/');
      return;
    }

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
        }
      scrollToBottom();
    };

    const handleCallOffer = (data: {
      chatId: string;
      offer: RTCSessionDescriptionInit;
      callerId: string;
    }) => {
      if (data.chatId === chatId) setIncomingCall(data);
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

    socket.onMessageReceived(handleMessageReceived);
    socket.on('call:offer', handleCallOffer);
    socket.onDeliveryStatus(handleDeliveryStatus);
    socket.on('error', handleSocketError);

    return () => {
      socket.offMessageReceived(handleMessageReceived);
      socket.off('call:offer', handleCallOffer);
      socket.offDeliveryStatus(handleDeliveryStatus);
      socket.off('error', handleSocketError);
    };
  }, [chatId, socket, navigate, user?.id, connectionStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
    };
    lastTempMessageIdRef.current = tempId;
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    scrollToBottom();
    try {
      await socket.sendMessage(chatId, text, useEncryption);
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      lastTempMessageIdRef.current = null;
      const msg = err?.message || err?.response?.data?.message || 'Не удалось отправить сообщение.';
      alert(msg + (msg.includes('соединен') ? '' : ' Проверьте интернет и обновите страницу.'));
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
    // В production — относительный URL (тот же хост), чтобы не было Mixed Content по HTTPS
    const baseUrl = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    return baseUrl ? `${baseUrl}${audioUrl}` : audioUrl;
  };

  const handleStartVideoCall = () => {
    setCallMode('video');
    setIsInCall(true);
  };
  const handleStartVoiceCall = () => {
    setCallMode('voice');
    setIsInCall(true);
  };
  const handleEndCall = () => {
    setIsInCall(false);
    setIncomingCall(null);
  };

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
        videoMode={isIncoming ? true : callMode === 'video'}
        contactName={contactName}
        onEnd={handleEndCall}
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0b0b0b] text-white">
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
              <button
                onClick={handleStartVideoCall}
                className="p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#0a84ff]"
                title="Видеозвонок"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </button>
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
          const audioUrl = getAudioUrl(message.audioUrl);
          const canSelect = isOwn && !message.id.startsWith('temp-');
          const isSelected = selectedIds.has(message.id);

          return (
            <div
              key={message.id}
              className={`flex min-w-0 max-w-full ${isOwn ? 'justify-end' : 'justify-start'} ${selectionMode && canSelect ? 'cursor-pointer' : ''}`}
              onClick={
                selectionMode && canSelect
                  ? () => toggleSelectMessage(message.id)
                  : undefined
              }
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
                  {isVoice && audioUrl ? (
                    <div className="chat-audio-wrap" onClick={selectionMode ? (e) => e.stopPropagation() : undefined}>
                      <audio controls preload="metadata">
                        <source src={audioUrl} type="audio/webm" />
                        <source src={audioUrl} type="audio/mpeg" />
                      </audio>
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

      {/* Ввод: голосовое + текст + отправить — всегда виден, не уходит за экран */}
      <div className="chat-page-footer flex-none shrink-0 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#141414] space-y-2">
        <VoiceRecorder chatId={chatId || ''} onSent={() => loadMessages()} />
        <form onSubmit={handleSendMessage} className="flex gap-2 min-h-0">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение"
            className="flex-1 px-4 py-3 rounded-xl bg-[#2d2d2f] text-white placeholder-[#86868a] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-5 py-3 rounded-xl bg-[#0a84ff] hover:bg-[#409cff] font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
};
