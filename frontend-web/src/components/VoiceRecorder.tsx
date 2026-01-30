import { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audio.service';

interface VoiceRecorderProps {
  chatId: string;
  onSent: () => void;
}

export const VoiceRecorder = ({ chatId, onSent }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !chatId) return;

    try {
      const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
      await audioService.uploadAudio(file, chatId, recordingTime);
      cancelRecording();
      onSent();
    } catch (error) {
      console.error('Ошибка отправки голосового сообщения:', error);
      alert('Ошибка при отправке голосового сообщения');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioUrl && audioBlob) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#2d2d2f] border border-white/10 min-w-0 overflow-hidden">
        <div className="chat-audio-wrap flex-1 min-w-0">
          <audio src={audioUrl} controls preload="metadata" />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={sendVoiceMessage}
            className="px-4 py-2 bg-[#0a84ff] text-white rounded-lg hover:bg-[#409cff] text-sm font-medium"
          >
            Отправить
          </button>
          <button
            onClick={cancelRecording}
            className="px-4 py-2 bg-[#3d3d3f] text-[#86868a] rounded-lg hover:bg-white/10 text-sm shrink-0"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/40">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-400">{formatTime(recordingTime)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 text-sm font-medium"
          >
            Остановить
          </button>
        </>
      ) : (
        <button
          onClick={startRecording}
          className="p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#0a84ff] border border-white/10"
          title="Голосовое сообщение"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  );
};
