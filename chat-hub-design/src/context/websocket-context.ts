import React, { createContext, useContext } from 'react';

export interface WebSocketContextValue {
  emitTypingStart: (chatId: string) => void;
  emitTypingStop: (chatId: string) => void;
  emitMessageDelivered: (messageId: string) => void;
  emitMessageRead: (messageId: string) => void;
}

const NOOP_WS: WebSocketContextValue = {
  emitTypingStart: () => {},
  emitTypingStop: () => {},
  emitMessageDelivered: () => {},
  emitMessageRead: () => {},
};
export const WebSocketContext = createContext<WebSocketContextValue>(NOOP_WS);

export function useWebSocket(): WebSocketContextValue {
  return useContext(WebSocketContext) ?? NOOP_WS;
}
