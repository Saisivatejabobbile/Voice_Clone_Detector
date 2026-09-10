import { useEffect, useRef, useState } from 'react';

// Singleton WebSocket instance (survives re-renders)
let globalWS = null;
let globalListeners = new Map();

export function useStableWebSocket(url, token) {
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!url || !token) return;

    // Connect only if not already connected
    if (!globalWS || globalWS.readyState === WebSocket.CLOSED) {
      console.log('Creating NEW WebSocket connection');
      const wsUrl = `${url}?token=${token}`;
      globalWS = new WebSocket(wsUrl);

      globalWS.onopen = () => {
        console.log('✅ WebSocket CONNECTED');
        setIsConnected(true);
      };

      globalWS.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Received:', message.type);
        
        // Call all registered listeners for this message type
        const listeners = globalListeners.get(message.type) || [];
        listeners.forEach(fn => fn(message));
      };

      globalWS.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      globalWS.onclose = () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
        globalWS = null;
      };
    } else if (globalWS.readyState === WebSocket.OPEN) {
      setIsConnected(true);
    }

    // Cleanup: DON'T close WebSocket on unmount (singleton pattern)
    return () => {
      console.log('Component unmounting - WebSocket stays open');
    };
  }, [url, token]);

  const sendMessage = (message) => {
    if (globalWS && globalWS.readyState === WebSocket.OPEN) {
      globalWS.send(JSON.stringify(message));
      console.log('📤 Sent:', message.type);
    } else {
      console.error('Cannot send - WebSocket not connected');
    }
  };

  const onMessage = (type, handler) => {
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
  };

  return { isConnected, sendMessage, onMessage };
}