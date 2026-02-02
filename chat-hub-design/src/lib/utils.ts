import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const raw = import.meta.env.VITE_API_URL;
const API_BASE = import.meta.env.DEV
  ? (raw || 'http://localhost:3000').replace(/\/api\/?$/, '')
  : (raw && String(raw).startsWith('https') ? raw.replace(/\/api\/?$/, '') : '');

/** Преобразует путь /uploads/... в полный URL (нужно в dev при разном origin) */
export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path;
}
