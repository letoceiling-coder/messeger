import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Contact } from '@/types/messenger';
import type { CallSession, CallType, CallSessionState, CallNetworkState } from '@/types/messenger';
import { getSocket } from '@/services/websocket';
import { WebRTCService } from '@/services/webrtc.service';
import { toast } from '@/components/ui/sonner';
import { useChats } from '@/context/ChatsContext';
import { useContacts } from '@/context/ContactsContext';

interface CallContextValue {
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startOutgoingCall: (contact: Contact, type: CallType, chatId?: string) => void;
  setIncomingCall: (contact: Contact, type: CallType) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  setCallState: (state: CallSessionState) => void;
  setNetworkState: (state: CallNetworkState) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  callDurationSeconds: number;
}

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { getChatById } = useChats();
  const { getContactById } = useContacts();
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);
  const pendingOfferRef = useRef<{ chatId: string; offer: RTCSessionDescriptionInit; videoMode: boolean } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDurationSeconds(0);
  }, []);

  const cleanupCall = useCallback(() => {
    webrtcRef.current?.endCall();
    webrtcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    pendingOfferRef.current = null;
  }, []);

  useEffect(() => {
    if (!activeCall || activeCall.state !== 'connected') {
      clearTimer();
      return;
    }
    const start = activeCall.startTime ?? Date.now();
    const tick = () => setCallDurationSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return clearTimer;
  }, [activeCall?.id, activeCall?.state, activeCall?.startTime, clearTimer]);

  const activeCallRef = useRef(activeCall);
  activeCallRef.current = activeCall;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = getSocket(token);
    if (!socket) return;
    // Подписываемся даже если сокет ещё подключается — события придут после connect

    const onOffer = (data: { chatId?: string; offer?: RTCSessionDescriptionInit; callerId?: string; videoMode?: boolean }) => {
      if (!data?.chatId || !data?.offer || activeCallRef.current) return;
      pendingOfferRef.current = {
        chatId: data.chatId,
        offer: data.offer,
        videoMode: data.videoMode !== false,
      };
      const chat = getChatById?.(data.chatId ?? '');
      const callerContact = data.callerId ? getContactById?.(data.callerId) : null;
      const contact: Contact = {
        id: data.callerId ?? 'unknown',
        name: callerContact?.name ?? chat?.name ?? 'Собеседник',
        isOnline: true,
      };
      setActiveCall({
        id: `in-${Date.now()}`,
        direction: 'incoming',
        type: data.videoMode !== false ? 'video' : 'audio',
        contact,
        state: 'ringing',
        networkState: 'good',
        startTime: null,
        muted: false,
        speaker: false,
        cameraOff: false,
        frontCamera: true,
      });
    };

    const onCallEnd = (data: { chatId?: string }) => {
      const call = activeCallRef.current;
      if (!call) return;
      const pending = pendingOfferRef.current;
      const matchChat = data.chatId && (data.chatId === pending?.chatId || call.direction === 'incoming');
      if (matchChat) {
        pendingOfferRef.current = null;
        cleanupCall();
        setActiveCall(null);
        clearTimer();
        if (call.state === 'ringing') toast.info('Звонок отменён');
      }
    };

    socket.on('call:offer', onOffer);
    socket.on('call:end', onCallEnd);
    socket.on('call:rejected', onCallEnd);
    return () => {
      socket.off('call:offer', onOffer);
      socket.off('call:end', onCallEnd);
      socket.off('call:rejected', onCallEnd);
    };
  }, [getChatById, getContactById, cleanupCall, clearTimer]);

  const startOutgoingCall = useCallback((contact: Contact, type: CallType, chatId?: string) => {
    cleanupCall();

    setActiveCall({
      id: `out-${Date.now()}`,
      direction: 'outgoing',
      type,
      contact,
      state: 'calling',
      networkState: 'good',
      startTime: null,
      muted: false,
      speaker: false,
      cameraOff: false,
      frontCamera: true,
    });

    if (!chatId) {
      toast.error('Для звонка необходим чат. Откройте диалог и попробуйте снова.');
      cleanupCall();
      setActiveCall(null);
      return;
    }

    const socket = getSocket(localStorage.getItem('accessToken'));
    if (!socket) {
      toast.error('Нет соединения с сервером. Войдите в аккаунт заново.');
      cleanupCall();
      setActiveCall(null);
      return;
    }

    const runCall = () => {
      const webrtc = new WebRTCService(socket);
      webrtcRef.current = webrtc;

      webrtc.onRemoteStream((stream) => {
        setRemoteStream(stream);
        setActiveCall((prev) => prev && prev.direction === 'outgoing'
          ? { ...prev, state: 'connected', startTime: Date.now() }
          : prev);
      });
      webrtc.onCallEnd(() => {
        cleanupCall();
        setActiveCall(null);
        clearTimer();
      });
      webrtc.onConnectionFailed(() => {
        toast.error('Не удалось установить соединение');
        cleanupCall();
        setActiveCall(null);
      });
      webrtc.onNoAnswer(() => {
        toast.error('Собеседник не ответил');
        cleanupCall();
        setActiveCall(null);
      });
      webrtc.onCallBusy(() => {
        toast.error('Пользователь занят');
        cleanupCall();
        setActiveCall(null);
      });
      webrtc.onCallError((msg) => {
        toast.error(msg);
        cleanupCall();
        setActiveCall(null);
      });
      webrtc.onConnectionStateChange((conn, ice) => {
        const poor = ice === 'disconnected' || conn === 'failed';
        setActiveCall((prev) => prev ? { ...prev, networkState: poor ? 'reconnecting' : 'good' } : null);
      });

      webrtc.initiateCall(chatId, { video: type === 'video' })
        .then((stream) => {
          setLocalStream(stream);
        })
        .catch((err) => {
          toast.error(err?.message ?? 'Ошибка запуска звонка');
          cleanupCall();
          setActiveCall(null);
        });
    };

    if (socket.connected) {
      runCall();
    } else {
      const cleanup = (showError?: boolean) => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onErr);
        clearTimeout(timer);
        if (showError) {
          toast.error('Нет соединения с сервером. Подождите загрузки и попробуйте снова.');
          cleanupCall();
          setActiveCall(null);
        }
      };
      const onConnect = () => {
        cleanup(false);
        runCall();
      };
      const onErr = () => cleanup(true);
      const timer = setTimeout(() => {
        if (!socket.connected) cleanup(true);
      }, 8000);
      socket.once('connect', onConnect);
      socket.once('connect_error', onErr);
    }
  }, [cleanupCall, clearTimer]);

  const setIncomingCall = useCallback((contact: Contact, type: CallType) => {
    setActiveCall({
      id: `in-${Date.now()}`,
      direction: 'incoming',
      type,
      contact,
      state: 'ringing',
      networkState: 'good',
      startTime: null,
      muted: false,
      speaker: false,
      cameraOff: false,
      frontCamera: true,
    });
  }, []);

  const acceptCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    const call = activeCall;
    if (!call) return;

    if (pending && call.direction === 'incoming') {
      const socket = getSocket(localStorage.getItem('accessToken'));
      if (!socket) {
        toast.error('Нет соединения с сервером. Войдите заново.');
        cleanupCall();
        setActiveCall(null);
        return;
      }

      const doAccept = async () => {
        const webrtc = new WebRTCService(socket);
        webrtcRef.current = webrtc;
        pendingOfferRef.current = null;

        webrtc.onRemoteStream((stream) => {
          setRemoteStream(stream);
          setActiveCall((prev) => prev ? { ...prev, state: 'connected', startTime: Date.now() } : null);
        });
        webrtc.onCallEnd(() => {
          cleanupCall();
          setActiveCall(null);
          clearTimer();
        });
      webrtc.onConnectionFailed(() => {
        toast.error('Не удалось установить соединение');
        cleanupCall();
        setActiveCall(null);
      });
      webrtc.onConnectionStateChange((conn, ice) => {
        const poor = ice === 'disconnected' || conn === 'failed';
        setActiveCall((prev) => prev ? { ...prev, networkState: poor ? 'reconnecting' : 'good' } : null);
      });

      try {
        const stream = await webrtc.handleOffer(pending.chatId, pending.offer, { video: pending.videoMode });
          setLocalStream(stream);
          setActiveCall((prev) => prev ? { ...prev, state: 'connected', startTime: Date.now() } : null);
        } catch (err) {
          toast.error((err as Error)?.message ?? 'Ошибка при принятии звонка');
          cleanupCall();
          setActiveCall(null);
        }
      };

      if (socket.connected) {
        doAccept();
      } else {
        const onConnect = () => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onErr);
          doAccept();
        };
        const onErr = () => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onErr);
          toast.error('Нет соединения с сервером');
          cleanupCall();
          setActiveCall(null);
        };
        socket.once('connect', onConnect);
        socket.once('connect_error', onErr);
        setTimeout(() => {
          if (!socket.connected) onErr();
        }, 5000);
      }
    } else {
      // Нет реального offer — нельзя имитировать соединение
      toast.error('Невозможно принять звонок: данные звонка отсутствуют');
      cleanupCall();
      setActiveCall(null);
    }
  }, [activeCall, cleanupCall, clearTimer]);

  const declineCall = useCallback(() => {
    const pending = pendingOfferRef.current;
    if (pending) {
      const webrtc = webrtcRef.current;
      if (webrtc) webrtc.rejectCall(pending.chatId);
      else getSocket(localStorage.getItem('accessToken'))?.emit('call:reject', { chatId: pending.chatId });
      pendingOfferRef.current = null;
    }
    cleanupCall();
    setActiveCall(null);
    clearTimer();
  }, [cleanupCall, clearTimer]);

  const endCall = useCallback(() => {
    cleanupCall();
    setActiveCall(null);
    clearTimer();
  }, [cleanupCall, clearTimer]);

  const setCallState = useCallback((state: CallSessionState) => {
    setActiveCall((prev) => (prev ? { ...prev, state } : null));
    if (state !== 'connected') clearTimer();
  }, [clearTimer]);

  const setNetworkState = useCallback((state: CallNetworkState) => {
    setActiveCall((prev) => (prev ? { ...prev, networkState: state } : null));
  }, []);

  const toggleMute = useCallback(() => {
    webrtcRef.current?.toggleAudio();
    setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : null));
  }, []);

  const toggleSpeaker = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, speaker: !prev.speaker } : null));
  }, []);

  const toggleCamera = useCallback(() => {
    webrtcRef.current?.toggleVideo();
    setActiveCall((prev) => (prev ? { ...prev, cameraOff: !prev.cameraOff } : null));
  }, []);

  const switchCamera = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, frontCamera: !prev.frontCamera } : null));
  }, []);

  const value: CallContextValue = {
    activeCall,
    localStream,
    remoteStream,
    startOutgoingCall,
    setIncomingCall,
    acceptCall,
    declineCall,
    endCall,
    setCallState,
    setNetworkState,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
    callDurationSeconds,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
