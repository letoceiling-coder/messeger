/**
 * Получить медиа-поток с fallback на аудио, если камера недоступна
 */
export async function getMediaStreamWithFallback(
  constraints: MediaStreamConstraints
): Promise<{ stream: MediaStream | null; usedVideo: boolean; usedAudio: boolean }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return {
      stream,
      usedVideo: !!constraints.video && stream.getVideoTracks().length > 0,
      usedAudio: !!constraints.audio && stream.getAudioTracks().length > 0,
    };
  } catch {
    if (constraints.video) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio || true });
        return { stream: audioStream, usedVideo: false, usedAudio: true };
      } catch {
        return { stream: null, usedVideo: false, usedAudio: false };
      }
    }
    return { stream: null, usedVideo: false, usedAudio: false };
  }
}
