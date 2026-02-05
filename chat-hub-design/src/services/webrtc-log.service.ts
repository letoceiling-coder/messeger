/**
 * Логи WebRTC для отладки
 */
const MAX_LINES = 150;

function formatTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

export const webrtcLogService = {
  add(msg: string, extra?: unknown) {
    const line = extra !== undefined ? `${formatTime()} ${msg} ${JSON.stringify(extra)}` : `${formatTime()} ${msg}`;
    if (typeof console?.log === 'function') console.log('[WebRTC]', msg, extra !== undefined ? extra : '');
    return line;
  },
  warn(msg: string, extra?: unknown) {
    const line = `${formatTime()} [WARN] ${msg}`;
    if (typeof console?.warn === 'function') console.warn('[WebRTC]', msg, extra !== undefined ? extra : '');
    return line;
  },
};
