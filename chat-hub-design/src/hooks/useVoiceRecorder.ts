import { useRef, useCallback } from 'react';

export interface VoiceRecorderResult {
  blob: Blob;
  durationSec: number;
}

export function useVoiceRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      return true;
    } catch (err) {
      console.error('Voice recording start failed:', err);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<VoiceRecorderResult | null> => {
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
