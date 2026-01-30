import { useEffect, useState, useRef } from 'react';
import { WebRTCService } from '../services/webrtc.service';
import { webrtcLogService } from '../services/webrtc-log.service';
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
  /** Вызывается при принятии входящего звонка (остановить мелодию) */
  onAccepted?: () => void;
  /** Вызывается при завершении разговора: длительность (сек), chatId, видеозвонок */
  onCallEndWithStats?: (durationSeconds: number, chatId: string, isVideo: boolean) => void;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const VideoCall = ({
  chatId,
  isIncoming,
  offer,
  videoMode = true,
  contactName = 'Собеседник',
  onEnd,
  onAccepted,
  onCallEndWithStats,
}: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoMode);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [noAnswer, setNoAnswer] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const callDurationRef = useRef(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const acceptedOrConnectedRef = useRef(false);
  const { socket } = useWebSocket();

  callDurationRef.current = callDurationSeconds;

  useEffect(() => {
    webrtcLogService.clear();
    const webrtc = new WebRTCService(socket);
    webrtcServiceRef.current = webrtc;
    acceptedOrConnectedRef.current = false;

    webrtc.onRemoteStream((stream) => {
      setRemoteStream(stream);
      setIsConnecting(false);
      setConnectionError(false);
    });

    webrtc.onCallEnd(() => {
      onCallEndWithStats?.(callDurationRef.current, chatId, videoMode);
      onEnd();
    });

    webrtc.onConnectionFailed(() => {
      setIsConnecting(false);
      setConnectionError(true);
    });

    webrtc.onNoAnswer(() => {
      setIsConnecting(false);
      setNoAnswer(true);
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
        acceptedOrConnectedRef.current = true;
        setLocalStream(stream);
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Ошибка инициализации звонка:', err);
        alert(err?.message || (videoMode ? 'Не удалось начать видеозвонок' : 'Не удалось начать голосовой звонок'));
        onEnd();
      }
    };

    // Входящий звонок: не принимать автоматически — только по нажатию «Принять»
    const isIncomingWaiting = isIncoming && offer;
    if (!isIncomingWaiting) {
      acceptedOrConnectedRef.current = true;
      initializeCall();
    }

    const timeout = isIncomingWaiting ? null : setTimeout(() => {
      setIsConnecting((prev) => {
        if (prev) setConnectionError(true);
        return false;
      });
    }, 28000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (isIncomingWaiting && !acceptedOrConnectedRef.current) {
        webrtc.rejectCall(chatId);
      } else {
        webrtc.endCall();
      }
    };
  }, [chatId, isIncoming, offer, socket, videoMode, onEnd, onCallEndWithStats]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;
    const el = remoteVideoRef.current;
    el.srcObject = remoteStream;
    const hasVideo = remoteStream.getVideoTracks().length > 0;
    const play = () => el.play().catch(() => {});
    play();
    const t1 = setTimeout(play, 300);
    const t2 = setTimeout(play, 800);
    const t3 = setTimeout(play, 1500);
    // На мобильных (ответчик) видео часто появляется с задержкой — несколько попыток play
    const t4 = hasVideo ? setTimeout(play, 2500) : null;
    const t5 = hasVideo ? setTimeout(play, 4000) : null;
    const interval = hasVideo ? setInterval(play, 500) : null;
    const stopInterval = hasVideo ? setTimeout(() => { if (interval) clearInterval(interval); }, 5000) : null;
    const onAddTrack = () => {
      play();
      if (remoteStream?.getVideoTracks().length) play();
    };
    remoteStream.onaddtrack = onAddTrack;
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (t4) clearTimeout(t4); if (t5) clearTimeout(t5);
      if (interval) clearInterval(interval); if (stopInterval) clearTimeout(stopInterval);
      remoteStream.onaddtrack = null;
    };
  }, [remoteStream]);

  // Удалённый звук: в видеорежиме на мобильных <video> часто не даёт звук — используем отдельный <audio>
  useEffect(() => {
    if (!remoteAudioRef.current || !remoteStream) return;
    remoteAudioRef.current.srcObject = remoteStream;
    const p = remoteAudioRef.current.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [remoteStream]);

  const callStartTimeRef = useRef<number | null>(null);
  // Таймер длительности разговора (старт при установленном соединении)
  useEffect(() => {
    const active = localStream && !connectionError && !noAnswer;
    if (!active) {
      callStartTimeRef.current = null;
      return;
    }
    if (callStartTimeRef.current == null) callStartTimeRef.current = Date.now();
    const tick = () => {
      if (callStartTimeRef.current == null) return;
      setCallDurationSeconds(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [localStream, connectionError, noAnswer]);

  useEffect(() => {
    if (!showLogs) return;
    setLogLines(webrtcLogService.getLogs());
    const unsub = webrtcLogService.subscribe(() => setLogLines(webrtcLogService.getLogs()));
    return unsub;
  }, [showLogs]);

  const handleCopyLogs = () => {
    const text = webrtcLogService.getLogs().join('\n');
    navigator.clipboard?.writeText(text).then(() => alert('Логи скопированы')).catch(() => alert('Не удалось скопировать'));
  };

  const handleEndCall = () => {
    onCallEndWithStats?.(callDurationRef.current, chatId, videoMode);
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
                    acceptedOrConnectedRef.current = true;
                    onAccepted?.();
                    const stream = await webrtcServiceRef.current.handleOffer(chatId, offer, { video: videoMode });
                    setLocalStream(stream);
                  } catch (error) {
                    console.error('Ошибка принятия звонка:', error);
                    acceptedOrConnectedRef.current = false;
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

  // Голосовой звонок — компактный экран без видео (обязательно <audio> для удалённого голоса)
  if (!videoMode) {
    return (
      <div className="fixed inset-0 bg-[#0b0b0b] z-50 flex flex-col items-center justify-center">
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
        <div className="w-24 h-24 rounded-full bg-[#2d2d2f] flex items-center justify-center text-4xl text-[#0a84ff] mb-6">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <p className="text-white font-medium text-lg">{contactName}</p>
        <p className="text-[#86868a] text-sm mt-1">
          {noAnswer ? 'Собеседник не ответил' : connectionError ? 'Не удалось подключиться' : isConnecting ? 'Подключение...' : 'Голосовой звонок'}
        </p>
        {localStream && !connectionError && !noAnswer && (
          <p className="text-[#0a84ff] font-mono text-xl mt-2 tabular-nums" aria-label="Длительность разговора">
            {formatDuration(callDurationSeconds)}
          </p>
        )}
        {(connectionError || noAnswer) && (
          <p className="text-[#86868a] text-xs mt-2 max-w-xs text-center">
            {noAnswer ? 'Собеседник не ответил на звонок.' : 'Собеседник не ответил или проблема с сетью. Попробуйте позже.'}
          </p>
        )}
        {(connectionError || noAnswer) && (
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowLogs(true)} className="px-4 py-2 rounded-xl bg-[#2d2d2f] text-white">
              📋 Логи
            </button>
            <button onClick={onEnd} className="px-6 py-2 rounded-xl bg-[#2d2d2f] text-white hover:bg-[#3d3d3f]">
              Закрыть
            </button>
          </div>
        )}
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
          <button type="button" onClick={() => setShowLogs((v) => !v)} className="p-3 rounded-full bg-[#2d2d2f] text-white text-xs">
            📋 Логи
          </button>
        </div>
        {showLogs && (
          <div className="absolute inset-x-0 bottom-0 top-1/3 bg-black/95 text-green-400 p-4 flex flex-col z-[60]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm">Логи WebRTC</span>
              <div className="flex gap-2">
                <button type="button" onClick={handleCopyLogs} className="px-3 py-1.5 rounded bg-gray-600 text-white text-xs">Скопировать</button>
                <button type="button" onClick={() => setShowLogs(false)} className="px-3 py-1.5 rounded bg-gray-600 text-white text-xs">Закрыть</button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto text-xs whitespace-pre-wrap break-all font-mono">
              {logLines.length ? logLines.join('\n') : 'Пока нет записей.'}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <div className="flex-1 relative">
        {(isConnecting || connectionError || noAnswer) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-4">
            <div className="text-white">
              {noAnswer ? 'Собеседник не ответил' : connectionError ? 'Не удалось подключиться' : 'Подключение...'}
            </div>
            {(connectionError || noAnswer) && (
              <p className="text-gray-400 text-sm text-center max-w-xs">
                {noAnswer ? 'Собеседник не ответил на звонок.' : 'Не удалось установить связь. Возможные причины: собеседник не ответил, проблемы с сетью или файрволом. Обновите страницу и попробуйте снова.'}
              </p>
            )}
            {(connectionError || noAnswer) && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowLogs(true); }}
                  className="px-4 py-2 rounded-xl bg-gray-600 text-white"
                >
                  📋 Логи
                </button>
                <button
                  onClick={onEnd}
                  className="px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        )}
        <video
          ref={remoteVideoRef}
          key={remoteStream ? remoteStream.getTracks().map((t) => t.id).join(',') || 'remote' : 'remote'}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        {localStream && !connectionError && !noAnswer && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white font-mono text-lg px-4 py-2 rounded-lg tabular-nums" aria-label="Длительность разговора">
            {formatDuration(callDurationSeconds)}
          </div>
        )}
      </div>
      {/* Видеокружок — локальное видео в круге */}
      <div className="absolute bottom-24 right-4 w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-black/30">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 items-center">
        <button onClick={handleToggleVideo} className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:bg-gray-600`}>
          {isVideoEnabled ? '📹' : '📵'}
        </button>
        <button onClick={handleToggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:bg-gray-600`}>
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>
        <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700">📞</button>
        <button
          type="button"
          onClick={() => setShowLogs((v) => !v)}
          className="p-3 rounded-full bg-gray-700/80 text-white text-sm"
          title="Логи звонка (для диагностики на телефоне)"
        >
          📋 Логи
        </button>
      </div>
      {showLogs && (
        <div className="absolute inset-0 top-auto bg-black/95 text-green-400 p-4 max-h-[60vh] flex flex-col z-[60]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-medium">Логи WebRTC</span>
            <div className="flex gap-2">
              <button type="button" onClick={handleCopyLogs} className="px-3 py-1.5 rounded bg-gray-600 text-white text-xs">
                Скопировать
              </button>
              <button type="button" onClick={() => setShowLogs(false)} className="px-3 py-1.5 rounded bg-gray-600 text-white text-xs">
                Закрыть
              </button>
            </div>
          </div>
          <pre className="flex-1 overflow-auto text-xs whitespace-pre-wrap break-all font-mono">
            {logLines.length ? logLines.join('\n') : 'Пока нет записей. Совершите действие в звонке.'}
          </pre>
        </div>
      )}
    </div>
  );
};
