import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '@config/api';
import { Message } from '../types';

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
    }

    // Отправка незашифрованного сообщения
    this.socket.emit('message:send', { chatId, content, isEncrypted: false });
  }

  markAsDelivered(messageId: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('message:delivered', { messageId });
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

  onUserOffline(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('user:offline', callback);
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

  emit(event: string, data: any) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
