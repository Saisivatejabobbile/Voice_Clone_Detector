import { useEffect, useRef, useState, useCallback } from 'react';

// Singleton WebSocket instance (survives re-renders)
let globalWS = null;
let globalListeners = new Map();
let currentToken = null;

export function useStableWebSocket(url, token) {
  const [isConnected, setIsConnected] = useState(
    () => globalWS?.readyState === WebSocket.OPEN
  );
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!url || !token) return;

    // If existing connection has different token or is closed, clean up
    if (globalWS) {
      if (currentToken !== token || globalWS.readyState === WebSocket.CLOSED || globalWS.readyState === WebSocket.CLOSING) {
        try {
          globalWS.close();
        } catch (e) {
          // Ignored
        }
        globalWS = null;
      } else if (globalWS.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        return;
      }
    }

    if (!globalWS) {
      console.log('Creating WebSocket connection with token');
      currentToken = token;
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        globalWS = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket CONNECTED');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received signaling message:', message.type, message);
            
            // Call all registered listeners for this message type
            const listeners = globalListeners.get(message.type) || [];
            listeners.forEach(fn => fn(message));
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          setIsConnected(false);
          globalWS = null;

          // Auto-reconnect if token is still present and valid
          if (token && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              if (token) {
                console.log('Attempting WebSocket reconnect...');
                connect();
              }
            }, 2500);
          }
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        setIsConnected(false);
        globalWS = null;
      }
    }
  }, [url, token]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (globalWS && globalWS.readyState === WebSocket.OPEN) {
      globalWS.send(JSON.stringify(message));
      console.log('📤 Sent:', message.type);
    } else {
      console.warn('Cannot send - WebSocket not connected (readyState: ' + globalWS?.readyState + ')');
    }
  }, []);

  const onMessage = useCallback((type, handler) => {
    if (!globalListeners.has(type)) {
      globalListeners.set(type, []);
    }
    globalListeners.get(type).push(handler);
    listenersRef.current.set(type, handler);

    // Cleanup: remove this specific handler
    return () => {
      const listeners = globalListeners.get(type) || [];
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return { isConnected, sendMessage, onMessage };
}