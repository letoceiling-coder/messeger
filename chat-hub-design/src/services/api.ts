/**
 * API клиент для подключения к бэкенду Messager.
 * Сейчас приложение работает на mock-данных.
 * При подключении к API замените вызовы в контекстах на этот клиент.
 *
 * Backend: http://localhost:3000 (dev) или /api (production)
 */

// Бэкенд Messager использует префикс /api
const raw = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.DEV
  ? (raw || "http://localhost:3000/api")
  : (raw && String(raw).startsWith("https") ? `${raw}/api` : "/api");

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const base = (API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL) || "";
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  const url = base ? `${base}${pathNorm}` : pathNorm;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) {
      const isAuthPath = path.includes("auth/send-code") || path.includes("auth/verify-code") || path.includes("auth/login") || path.includes("auth/config");
      if (!isAuthPath && token) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("messenger-auth");
        window.location.href = "/login";
      }
    }
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
