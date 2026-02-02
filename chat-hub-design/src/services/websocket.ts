import { io, Socket } from 'socket.io-client';

const raw = import.meta.env.VITE_API_URL;
const getWsUrl = () => {
  if (import.meta.env.DEV) {
    const base = raw || 'http://localhost:3000';
    return base.startsWith('http') ? base : `http://${window.location.hostname}:3000`;
  }
  return window.location.origin;
};

let socket: Socket | null = null;

export function getSocket(token: string | null): Socket | null {
  if (!token) return null;
  if (socket?.connected) return socket;

  const url = getWsUrl();
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type MessageReceivedPayload = {
  id: string;
  chatId: string;
  userId: string;
  content?: string;
  messageType: string;
  audioUrl?: string | null;
  mediaUrl?: string | null;
  replyToId?: string | null;
  createdAt: string;
};
