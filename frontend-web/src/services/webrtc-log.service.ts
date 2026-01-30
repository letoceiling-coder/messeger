/**
 * Логи WebRTC для просмотра на телефоне (в консоли нет доступа).
 * Сообщения дублируются в console и пишутся в буфер для экранного просмотра.
 */

const MAX_LINES = 150;

type Listener = () => void;

const lines: string[] = [];
const listeners: Set<Listener> = new Set();

function emit() {
  listeners.forEach((cb) => cb());
}

function formatTime() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

export const webrtcLogService = {
  add(msg: string, extra?: unknown) {
    const line = extra !== undefined ? `${formatTime()} ${msg} ${JSON.stringify(extra)}` : `${formatTime()} ${msg}`;
    lines.push(line);
    if (lines.length > MAX_LINES) lines.shift();
    if (typeof console?.log === 'function') console.log(msg, extra !== undefined ? extra : '');
    emit();
  },

  warn(msg: string, extra?: unknown) {
    const line = extra !== undefined ? `${formatTime()} [WARN] ${msg} ${JSON.stringify(extra)}` : `${formatTime()} [WARN] ${msg}`;
    lines.push(line);
    if (lines.length > MAX_LINES) lines.shift();
    if (typeof console?.warn === 'function') console.warn(msg, extra !== undefined ? extra : '');
    emit();
  },

  getLogs(): string[] {
    return [...lines];
  },

  clear() {
    lines.length = 0;
    emit();
  },

  subscribe(callback: Listener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};
