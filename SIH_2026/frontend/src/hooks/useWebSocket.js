import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useWebSocket Hook
 * 
 * Manages WebSocket connections with reconnection logic.
 * Requirements: 1.1, 1.5, 9.4
 */
export const useWebSocket = (url, token) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  const urlRef = useRef(url);
  const tokenRef = useRef(token);
  
  // Update refs when props change
  useEffect(() => {
    urlRef.current = url;
    tokenRef.current = token;
  }, [url, token]);
  
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 2000;
  
  /**
   * Register message handler
   */
  const onMessage = useCallback((messageType, handler) => {
    if (!messageHandlersRef.current.has(messageType)) {
      messageHandlersRef.current.set(messageType, []);
    }
    messageHandlersRef.current.get(messageType).push(handler);
    
    return () => {
      const handlers = messageHandlersRef.current.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);
  
  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);
      const { type } = message;
      
      console.log(`WebSocket received: ${type}`, message);
      
      const handlers = messageHandlersRef.current.get(type) || [];
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      });
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);
  
  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(message);
      wsRef.current.send(jsonMessage);
      console.log(`WebSocket sent: ${message.type}`, message);
    } else {
      console.error('WebSocket not connected, cannot send message');
    }
  }, []);
  
  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    const currentUrl = urlRef.current;
    const currentToken = tokenRef.current;
    
    if (!currentUrl || !currentToken) {
      console.warn('WebSocket URL or token not provided');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionState('connecting');
    
    try {
      const wsUrl = `${currentUrl}?token=${currentToken}`;
      console.log(`WebSocket connecting to: ${currentUrl}`);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket connected: ${currentUrl}`);
        setConnectionState('connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };
      
      ws.onmessage = handleMessage;
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log(`WebSocket closed: ${currentUrl}`);
        setConnectionState('disconnected');
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = baseReconnectDelay * reconnectAttemptsRef.current;
          
          console.log(`Attempting reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setConnectionState('reconnecting');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionState('failed');
        }
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('disconnected');
    }
  }, [handleMessage]);
  
  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('WebSocket disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);
  
  /**
   * Auto-connect on mount and when URL/token changes
   */
  useEffect(() => {
    if (url && token) {
      connect();
    }
    
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token]);
  
  return {
    isConnected,
    connectionState,
    sendMessage,
    onMessage,
    connect,
    disconnect,
  };
};

export default useWebSocket;