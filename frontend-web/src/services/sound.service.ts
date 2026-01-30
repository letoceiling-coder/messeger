/**
 * Звуки приложения: мелодии звонков и уведомление о новом сообщении.
 * Файлы в public/sounds (Vite отдаёт их с корня: /sounds/...).
 */

const OUTGOING_RINGTONE_URL = '/sounds/ringtone.mp3'; // ton.mp3 - для инициатора звонка
const INCOMING_RINGTONE_URL = '/sounds/incoming-call.mp3'; // balls.mp3 - для получателя звонка
const NOTIFICATION_URL = '/sounds/notification.mp3';

let ringtoneAudio: HTMLAudioElement | null = null;

export const soundService = {
  /** Запуск мелодии исходящего звонка (когда вы звоните) */
  playOutgoingRingtone() {
    this.stopRingtone();
    ringtoneAudio = new Audio(OUTGOING_RINGTONE_URL);
    ringtoneAudio.loop = true;
    ringtoneAudio.play().catch((e) => console.warn('Outgoing ringtone play failed:', e));
  },

  /** Запуск мелодии входящего звонка (когда вам звонят) */
  playIncomingRingtone() {
    this.stopRingtone();
    ringtoneAudio = new Audio(INCOMING_RINGTONE_URL);
    ringtoneAudio.loop = true;
    ringtoneAudio.play().catch((e) => console.warn('Incoming ringtone play failed:', e));
  },

  /** Для обратной совместимости - использует входящий звонок */
  playRingtone() {
    this.playIncomingRingtone();
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
