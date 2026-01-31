/**
 * Утилиты для проверки доступности медиа-устройств (камера, микрофон)
 */

export interface MediaDeviceAvailability {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasAudio: boolean; // alias for hasMicrophone
  hasVideo: boolean; // alias for hasCamera
}

/**
 * Проверяет доступность камеры и микрофона
 * @returns Promise с информацией о доступных устройствах
 */
export async function checkMediaDevices(): Promise<MediaDeviceAvailability> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn('[MediaDevices] enumerateDevices not supported');
      return { hasCamera: false, hasMicrophone: false, hasAudio: false, hasVideo: false };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((device) => device.kind === 'videoinput');
    const hasMicrophone = devices.some((device) => device.kind === 'audioinput');

    return {
      hasCamera,
      hasMicrophone,
      hasAudio: hasMicrophone,
      hasVideo: hasCamera,
    };
  } catch (error) {
    console.error('[MediaDevices] Error checking devices:', error);
    return { hasCamera: false, hasMicrophone: false, hasAudio: false, hasVideo: false };
  }
}

/**
 * Проверяет, доступна ли камера
 */
export async function isCameraAvailable(): Promise<boolean> {
  const { hasCamera } = await checkMediaDevices();
  return hasCamera;
}

/**
 * Проверяет, доступен ли микрофон
 */
export async function isMicrophoneAvailable(): Promise<boolean> {
  const { hasMicrophone } = await checkMediaDevices();
  return hasMicrophone;
}

/**
 * Пытается получить медиа-поток с fallback на аудио, если камера недоступна
 * @param constraints Исходные constraints для getUserMedia
 * @returns MediaStream или null, если не удалось получить
 */
export async function getMediaStreamWithFallback(
  constraints: MediaStreamConstraints
): Promise<{ stream: MediaStream | null; usedVideo: boolean; usedAudio: boolean }> {
  try {
    // Сначала пытаемся получить поток с исходными constraints
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return {
      stream,
      usedVideo: !!constraints.video && stream.getVideoTracks().length > 0,
      usedAudio: !!constraints.audio && stream.getAudioTracks().length > 0,
    };
  } catch (error) {
    console.warn('[MediaDevices] Failed to get stream with original constraints:', error);

    // Если запросили видео, пытаемся fallback на только аудио
    if (constraints.video) {
      try {
        console.log('[MediaDevices] Trying fallback to audio-only...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio || true });
        return { stream: audioStream, usedVideo: false, usedAudio: true };
      } catch (audioError) {
        console.error('[MediaDevices] Failed to get audio stream:', audioError);
        return { stream: null, usedVideo: false, usedAudio: false };
      }
    }

    return { stream: null, usedVideo: false, usedAudio: false };
  }
}
