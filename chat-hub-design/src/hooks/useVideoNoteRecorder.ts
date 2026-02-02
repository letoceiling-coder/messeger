import { useRef, useCallback, type RefObject } from 'react';

export interface VideoNoteRecorderResult {
  blob: Blob;
  durationSec: number;
}

export function useVideoNoteRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (videoPreviewRef?: RefObject<HTMLVideoElement | null>): Promise<boolean> => {
    try {
      // Запрашиваем квадрат для кружка: 720p для лучшего качества (fallback 480)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720, min: 480 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { ideal: 48000 },
        },
      });
      streamRef.current = stream;
      if (videoPreviewRef?.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
      // Повышенный битрейт для лучшего качества: видео 2.5 Мбит/с, аудио 128 кбит/с
      const videoBitsPerSecond = 2500000;
      const audioBitsPerSecond = 128000;
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond,
          audioBitsPerSecond,
        });
      } catch {
        recorder = new MediaRecorder(stream, { mimeType });
      }
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      return true;
    } catch (err) {
      console.error('Video note recording start failed:', err);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<VideoNoteRecorderResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      const stream = streamRef.current;

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const durationSec = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

      recorder.onstop = () => {
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        resolve({ blob, durationSec });
      };
      recorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  return { startRecording, stopRecording, cancelRecording };
}
