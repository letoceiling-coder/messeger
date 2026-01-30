import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

// В production — тот же хост (пустая строка = текущий origin), чтобы не было Mixed Content по HTTPS
const rawWs = import.meta.env.VITE_WS_URL;
const WS_URL = import.meta.env.DEV
  ? (rawWs || 'http://localhost:3000')
  : (rawWs && (String(rawWs).startsWith('wss://') || String(rawWs).startsWith('https://')) ? rawWs : '');

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/** Элемент очереди сообщений при отключении (тот же payload, что и message:send) */
type QueuedMessagePayload = {
  chatId: string;
  replyToId?: string;
  content?: string;
  isEncrypted: boolean;
  encryptedContent?: string | null;
  encryptedKey?: string | null;
  iv?: string | null;
};

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private intentionalDisconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  /** Очередь сообщений при отключении — отправляются при восстановлении связи */
  private messageQueue: QueuedMessagePayload[] = [];

  private setStatus(status: ConnectionStatus) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.socket?.connected ? 'connected' : 'disconnected');
    return () => {
      this.statusListeners = this.statusListeners.filter((c) => c !== callback);
    };
  }

  getStatus(): ConnectionStatus {
    if (this.socket?.connected) return 'connected';
    if (this.reconnectTimer != null) return 'reconnecting';
    return 'disconnected';
  }

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.intentionalDisconnect = false;
    this.token = token;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.flushMessageQueue();
    });

    this.socket.on('disconnect', () => {
      const wasIntentional = this.intentionalDisconnect;
      this.socket = null;
      this.setStatus('disconnected');
      if (wasIntentional || !this.token) return;
      // Автопереподключение при обрыве (сеть, перезапуск сервера)
      const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 15000);
      this.reconnectAttempts++;
      this.setStatus('reconnecting');
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        if (this.token) this.connect(this.token);
      }, delay);
    });

    this.socket.on('connect_error', () => {
      this.setStatus('disconnected');
    });

    return this.socket;
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.token = null;
    this.messageQueue = [];
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Отправка очереди сообщений при восстановлении связи (без изменения бизнес-логики).
   */
  private flushMessageQueue() {
    if (!this.socket?.connected || this.messageQueue.length === 0) return;
    while (this.messageQueue.length > 0) {
      const payload = this.messageQueue.shift()!;
      this.socket.emit('message:send', payload);
    }
  }

  async sendMessage(
    chatId: string,
    content: string,
    useEncryption: boolean = false,
    replyToId?: string | null,
  ) {
    const basePayload = { chatId, replyToId: replyToId || undefined };

    if (!this.socket?.connected) {
      // Очередь при отключении: шифруем при необходимости и сохраняем, отправим при reconnect
      if (useEncryption) {
        try {
          const { encryptionService } = await import('./encryption.service');
          const encrypted = await encryptionService.encryptMessage(content, chatId);
          if (encrypted) {
            this.messageQueue.push({
              ...basePayload,
              isEncrypted: true,
              encryptedContent: encrypted.encrypted,
              encryptedKey: null,
              iv: encrypted.iv,
            });
            return;
          }
        } catch {
          // fallback без шифрования
        }
      }
      this.messageQueue.push({
        ...basePayload,
        content,
        isEncrypted: false,
      });
      return;
    }

    if (useEncryption) {
      try {
        const { encryptionService } = await import('./encryption.service');
        const encrypted = await encryptionService.encryptMessage(content, chatId);
        if (encrypted) {
          this.socket.emit('message:send', {
            ...basePayload,
            isEncrypted: true,
            encryptedContent: encrypted.encrypted,
            encryptedKey: null,
            iv: encrypted.iv,
          });
          return;
        }
      } catch {
        // Шифрование недоступно — отправляем без шифрования
      }
    }

    this.socket.emit('message:send', {
      ...basePayload,
      content,
      isEncrypted: false,
    });
  }

  markAsDelivered(messageId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('message:delivered', { messageId });
  }

  markAsRead(messageId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('message:read', { messageId });
  }

  onDeliveryStatus(callback: (data: { messageId: string; userId: string; status: string }) => void) {
    if (!this.socket) return;
    this.socket.on('message:delivery_status', callback);
  }

  offDeliveryStatus(callback: (data: { messageId: string; userId: string; status: string }) => void) {
    if (!this.socket) return;
    this.socket.off('message:delivery_status', callback);
  }

  /** Присоединиться к комнате чата (чтобы получать сообщения в реальном времени) */
  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('chat:join', { chatId });
  }

  onMessageReceived(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.socket.on('message:received', callback);
  }

  offMessageReceived(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.socket.off('message:received', callback);
  }

  onUserOnline(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user:online', callback);
  }

  offUserOnline(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.off('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user:offline', callback);
  }

  offUserOffline(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.off('user:offline', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  onConnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  onDisconnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('disconnect', callback);
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, ...args);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
