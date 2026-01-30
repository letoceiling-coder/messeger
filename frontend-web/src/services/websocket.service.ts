import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

// В production — тот же хост (пустая строка = текущий origin), чтобы не было Mixed Content по HTTPS
const rawWs = import.meta.env.VITE_WS_URL;
const WS_URL = import.meta.env.DEV
  ? (rawWs || 'http://localhost:3000')
  : (rawWs && (String(rawWs).startsWith('wss://') || String(rawWs).startsWith('https://')) ? rawWs : '');

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async sendMessage(chatId: string, content: string, useEncryption: boolean = false) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    if (useEncryption) {
      try {
        const { encryptionService } = await import('./encryption.service');
        const encrypted = await encryptionService.encryptMessage(content, chatId);
        if (encrypted) {
          this.socket.emit('message:send', {
            chatId,
            isEncrypted: true,
            encryptedContent: encrypted.encrypted,
            encryptedKey: null,
            iv: encrypted.iv,
          });
          return;
        }
      } catch {
        // Шифрование недоступно (например, по HTTP) — отправляем без шифрования
      }
    }

    this.socket.emit('message:send', { chatId, content, isEncrypted: false });
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
