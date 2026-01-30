/**
 * Звуки приложения: мелодия входящего звонка и уведомление о новом сообщении.
 * Файлы в public/sounds (Vite отдаёт их с корня: /sounds/...).
 */

const RINGTONE_URL = '/sounds/ringtone.mp3';
const NOTIFICATION_URL = '/sounds/notification.mp3';

let ringtoneAudio: HTMLAudioElement | null = null;

export const soundService = {
  /** Запуск мелодии входящего звонка (в цикле). Остановить через stopRingtone(). */
  playRingtone() {
    this.stopRingtone();
    ringtoneAudio = new Audio(RINGTONE_URL);
    ringtoneAudio.loop = true;
    ringtoneAudio.play().catch((e) => console.warn('Ringtone play failed:', e));
  },

  stopRingtone() {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      ringtoneAudio = null;
    }
  },

  /** Один раз проиграть звук уведомления о новом сообщении. */
  playMessageNotification() {
    const a = new Audio(NOTIFICATION_URL);
    a.play().catch((e) => console.warn('Notification sound failed:', e));
  },
};
