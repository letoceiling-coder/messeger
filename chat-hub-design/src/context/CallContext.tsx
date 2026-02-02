import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Contact } from '@/types/messenger';
import type { CallSession, CallType, CallSessionState, CallNetworkState } from '@/types/messenger';

interface CallContextValue {
  activeCall: CallSession | null;
  startOutgoingCall: (contact: Contact, type: CallType) => void;
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
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDurationSeconds(0);
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

  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startOutgoingCall = useCallback((contact: Contact, type: CallType) => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
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
    connectTimeoutRef.current = setTimeout(() => {
      connectTimeoutRef.current = null;
      setActiveCall((prev) =>
        prev && prev.direction === 'outgoing'
          ? { ...prev, state: 'connected', startTime: Date.now() }
          : prev
      );
    }, 2000);
  }, []);

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

  const acceptCall = useCallback(() => {
    setActiveCall((prev) =>
      prev
        ? { ...prev, state: 'connected', startTime: Date.now() }
        : null
    );
  }, []);

  const declineCall = useCallback(() => {
    setActiveCall(null);
    clearTimer();
  }, [clearTimer]);

  const endCall = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    setActiveCall(null);
    clearTimer();
  }, [clearTimer]);

  const setCallState = useCallback((state: CallSessionState) => {
    setActiveCall((prev) => (prev ? { ...prev, state } : null));
    if (state !== 'connected') clearTimer();
  }, [clearTimer]);

  const setNetworkState = useCallback((state: CallNetworkState) => {
    setActiveCall((prev) => (prev ? { ...prev, networkState: state } : null));
  }, []);

  const toggleMute = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : null));
  }, []);

  const toggleSpeaker = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, speaker: !prev.speaker } : null));
  }, []);

  const toggleCamera = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, cameraOff: !prev.cameraOff } : null));
  }, []);

  const switchCamera = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, frontCamera: !prev.frontCamera } : null));
  }, []);

  const value: CallContextValue = {
    activeCall,
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
