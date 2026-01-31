import { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audio.service';
import { useToast } from '../contexts/ToastContext';

interface VoiceRecorderProps {
  chatId: string;
  onSent: () => void;
}

const SWIPE_CANCEL_THRESHOLD = 80;

export const VoiceRecorder = ({ chatId, onSent }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartX = useRef<number>(0);
  const didSwipeCancel = useRef(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Ошибка записи:', error);
      setIsRecording(false);
      showError('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setSwipeDistance(0);
    didSwipeCancel.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (audioUrl && audioBlob) return;
    if (isRecording) return;
    pointerStartX.current = e.clientX;
    didSwipeCancel.current = false;
    startRecording();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!isRecording) return;
    if (didSwipeCancel.current) return;
    stopRecording();
  };

  const handlePointerLeave = () => {
    if (!isRecording) return;
    if (didSwipeCancel.current) return;
    stopRecording();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRecording || didSwipeCancel.current) return;
    const delta = Math.abs(e.clientX - pointerStartX.current);
    setSwipeDistance(delta);
    if (delta >= SWIPE_CANCEL_THRESHOLD) {
      didSwipeCancel.current = true;
      cancelRecording();
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !chatId) return;

    try {
      const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
      await audioService.uploadAudio(file, chatId, recordingTime);
      cancelRecording();
      showSuccess('Голосовое сообщение отправлено');
      onSent();
    } catch (error) {
      console.error('Ошибка отправки голосового сообщения:', error);
      showError('Ошибка при отправке голосового сообщения');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const expanded = audioUrl && audioBlob ? 'preview' : isRecording ? 'recording' : null;
  const swipeProgress = Math.min((swipeDistance / SWIPE_CANCEL_THRESHOLD) * 100, 100);

  return (
    <>
      {expanded === 'recording' && (
        <div className="w-full basis-full order-first flex flex-col gap-2 py-2">
          {/* Индикатор записи с волнами */}
          <div className="flex items-center gap-3">
            {/* Пульсирующие волны */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 bg-app-error/30 rounded-full animate-ping" />
              <div className="absolute w-6 h-6 bg-app-error/50 rounded-full animate-pulse" />
              <div className="relative w-3 h-3 bg-app-error rounded-full" />
            </div>
            
            {/* Таймер */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-error/20 border border-app-error/40">
              <span className="text-sm font-medium text-app-error">{formatTime(recordingTime)}</span>
            </div>
            
            {/* Подсказка о свайпе */}
            <span className="text-xs text-app-text-secondary">
              ← Свайп для отмены
            </span>
          </div>
          
          {/* Индикатор прогресса свайпа */}
          {swipeDistance > 10 && (
            <div className="w-full h-1 bg-app-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-app-error transition-all duration-100"
                style={{ width: `${swipeProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {expanded === 'preview' && (
        <div className="w-full basis-full order-first flex items-center gap-2 p-2 rounded-xl bg-app-surface border border-app-border min-w-0 overflow-hidden">
          <div className="chat-audio-wrap flex-1 min-w-0">
            <audio src={audioUrl ?? ''} controls preload="metadata" />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={sendVoiceMessage}
              className="px-4 py-2 bg-app-accent text-white rounded-xl hover:bg-app-accent-hover text-sm font-medium transition-colors"
            >
              Отправить
            </button>
            <button
              onClick={cancelRecording}
              className="px-4 py-2 bg-app-surface-hover text-app-text-secondary rounded-xl hover:bg-app-surface text-sm shrink-0 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      <div className="shrink-0">
        {!expanded && (
          <button
            type="button"
            className="p-2 rounded-full text-app-text-secondary hover:text-app-text hover:bg-app-surface-hover transition-colors touch-none active:scale-95"
            title="Голосовое сообщение. Удерживайте для записи, свайп для отмены."
            aria-label="Записать голосовое сообщение"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};
