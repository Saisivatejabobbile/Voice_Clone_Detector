import React, { createContext, useContext, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useSignalingWebSocket = () => {
  const context = useContext(WebSocketContext);
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Get token - only changes when user changes
  const token = user ? localStorage.getItem('voiceshield_token') : null;
  const wsUrl = token ? 'ws://localhost:8000/ws/signaling' : null;
  
  // Create WebSocket - memoized so it only changes when url/token change
  const signalingWS = useWebSocket(wsUrl, token);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => signalingWS, [signalingWS]);
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
