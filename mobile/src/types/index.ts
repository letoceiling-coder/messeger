export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Chat {
  id: string;
  type: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content?: string;
  messageType?: string;
  audioUrl?: string;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptedKey?: string;
  iv?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export type RootStackParamList = {
  Login: undefined;
  Chats: undefined;
  Chat: { chatId: string };
};
