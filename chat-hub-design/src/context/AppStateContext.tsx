import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type AppState =
  | 'loading'
  | 'unauthorized'
  | 'authorized'
  | 'syncing'
  | 'offline'
  | 'online'
  | 'chat_open'
  | 'chat_empty'
  | 'typing'
  | 'recording_voice'
  | 'uploading_media'
  | 'downloading_media'
  | 'call_active'
  | 'video_call_active'
  | 'settings_open'
  | 'modal_open'
  | 'search_active';

interface AppStateContextValue {
  state: AppState;
  setState: (s: AppState) => void;
  isOnline: boolean;
  setOnline: (v: boolean) => void;
  isAuthorized: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>('authorized');
  const [isOnline, setOnlineState] = useState(true);

  useEffect(() => {
    const handleOnline = () => setOnlineState(true);
    const handleOffline = () => setOnlineState(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnlineState(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setOnline = useCallback((v: boolean) => setOnlineState(v), []);

  const value: AppStateContextValue = {
    state,
    setState,
    isOnline,
    setOnline,
    isAuthorized: state !== 'unauthorized' && state !== 'loading',
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
