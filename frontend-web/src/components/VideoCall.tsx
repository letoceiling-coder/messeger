import { useEffect, useState, useRef } from 'react';
import { WebRTCService } from '../services/webrtc.service';
import { useWebSocket } from '../contexts/WebSocketContext';

interface VideoCallProps {
  chatId: string;
  isIncoming: boolean;
  callerId?: string;
  offer?: RTCSessionDescriptionInit;
  /** false = только голос (без видео) */
  videoMode?: boolean;
  /** Имя контакта для отображения */
  contactName?: string;
  onEnd: () => void;
}

export const VideoCall = ({
  chatId,
  isIncoming,
  offer,
  videoMode = true,
  contactName = 'Собеседник',
  onEnd,
}: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoMode);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    const webrtc = new WebRTCService(socket);
    webrtcServiceRef.current = webrtc;

    webrtc.onRemoteStream((stream) => {
      setRemoteStream(stream);
      setIsConnecting(false);
    });

    webrtc.onCallEnd(() => {
      onEnd();
    });

    const initializeCall = async () => {
      try {
        const opts = { video: videoMode };
        let stream: MediaStream;
        if (isIncoming && offer) {
          stream = await webrtc.handleOffer(chatId, offer, opts);
        } else {
          stream = await webrtc.initiateCall(chatId, opts);
        }
        setLocalStream(stream);
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Ошибка инициализации звонка:', err);
        alert(err?.message || (videoMode ? 'Не удалось начать видеозвонок' : 'Не удалось начать голосовой звонок'));
        onEnd();
      }
    };

    initializeCall();

    return () => {
      webrtc.endCall();
    };
  }, [chatId, isIncoming, offer, socket, videoMode, onEnd]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.endCall();
    }
    onEnd();
  };

  const handleToggleVideo = () => {
    if (!videoMode) return;
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleVideo();
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleToggleAudio = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleAudio();
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleReject = () => {
    if (webrtcServiceRef.current && chatId) {
      webrtcServiceRef.current.rejectCall(chatId);
    }
    onEnd();
  };

  if (isIncoming && !localStream) {
    return (
      <div className="fixed inset-0 bg-[#0b0b0b] bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-[#1c1c1e] rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10">
          <p className="text-[#86868a] text-sm mb-1">{videoMode ? 'Входящий видеозвонок' : 'Входящий голосовой звонок'}</p>
          <h2 className="text-xl font-semibold text-white mb-6">{contactName}</h2>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (offer && webrtcServiceRef.current) {
                  try {
                    const stream = await webrtcServiceRef.current.handleOffer(chatId, offer, { video: videoMode });
                    setLocalStream(stream);
                  } catch (error) {
                    console.error('Ошибка принятия звонка:', error);
                  }
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-medium"
            >
              Принять
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-medium"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Голосовой звонок — компактный экран без видео
  if (!videoMode) {
    return (
      <div className="fixed inset-0 bg-[#0b0b0b] z-50 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-[#2d2d2f] flex items-center justify-center text-4xl text-[#0a84ff] mb-6">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <p className="text-white font-medium text-lg">{contactName}</p>
        <p className="text-[#86868a] text-sm mt-1">
          {isConnecting ? 'Подключение...' : 'Голосовой звонок'}
        </p>
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
          <button
            onClick={handleToggleAudio}
            className={`p-4 rounded-full ${isAudioEnabled ? 'bg-[#2d2d2f]' : 'bg-red-600'} text-white hover:opacity-90`}
            title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          >
            {isAudioEnabled ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" /></svg>
            )}
          </button>
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-500"
            title="Завершить"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.81-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .27-.11.52-.29.7l-2.31 2.31c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.66-1.81.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative">
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white">Подключение...</div>
          </div>
        )}
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      </div>
      {/* Видеокружок — локальное видео в круге */}
      <div className="absolute bottom-24 right-4 w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-black/30">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        <button onClick={handleToggleVideo} className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:bg-gray-600`}>
          {isVideoEnabled ? '📹' : '📵'}
        </button>
        <button onClick={handleToggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:bg-gray-600`}>
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>
        <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700">📞</button>
      </div>
    </div>
  );
};
