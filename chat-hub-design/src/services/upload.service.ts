/**
 * Сервис загрузки медиа (голос, фото, видео, файлы) на бэкенд.
 */
import { api } from './api';

const raw = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.DEV
  ? (raw || 'http://localhost:3000/api')
  : (raw && String(raw).startsWith('https') ? `${raw}/api` : '/api');

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const base = (API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL) || '';
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export interface UploadAudioResponse {
  message: { id: string; chatId: string; userId: string; content: string; messageType: string; audioUrl: string | null; createdAt: string };
  audioUrl: string;
}

export interface UploadMediaResponse {
  message: { id: string; chatId: string; userId: string; content: string; messageType: string; mediaUrl: string | null; createdAt: string };
  mediaUrl: string;
}

export interface UploadDocumentResponse {
  message: { id: string; chatId: string; userId: string; content: string; messageType: string; mediaUrl?: string | null; createdAt: string };
  documentUrl: string;
}

export const uploadService = {
  async uploadAudio(file: Blob | File, chatId: string, durationSec?: number): Promise<UploadAudioResponse> {
    const fd = new FormData();
    const f = file instanceof File ? file : new File([file], 'voice.webm', { type: file.type || 'audio/webm' });
    fd.append('audio', f);
    fd.append('chatId', chatId);
    if (durationSec != null) fd.append('duration', String(durationSec));
    return postForm<UploadAudioResponse>('/messages/upload-audio', fd);
  },

  async uploadImage(file: File, chatId: string, caption?: string): Promise<UploadMediaResponse> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('chatId', chatId);
    if (caption?.trim()) fd.append('caption', caption.trim());
    return postForm<UploadMediaResponse>('/messages/upload-image', fd);
  },

  async uploadVideo(file: Blob | File, chatId: string, caption?: string, asVideoNote = false): Promise<UploadMediaResponse> {
    const fd = new FormData();
    const mime = (file instanceof File ? file.type : file.type) || 'video/webm';
    const f = file instanceof File ? file : new File([file], 'video.webm', { type: mime.split(';')[0] || 'video/webm' });
    fd.append('file', f);
    fd.append('chatId', chatId);
    if (caption?.trim()) fd.append('caption', caption.trim());
    if (asVideoNote) fd.append('messageType', 'video_note');
    return postForm<UploadMediaResponse>('/messages/upload-video', fd);
  },

  async uploadDocument(file: File, chatId: string, caption?: string): Promise<UploadDocumentResponse> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('chatId', chatId);
    if (caption?.trim()) fd.append('caption', caption.trim());
    return postForm<UploadDocumentResponse>('/messages/upload-document', fd);
  },
};
