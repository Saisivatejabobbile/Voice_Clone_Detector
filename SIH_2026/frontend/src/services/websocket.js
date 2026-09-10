// WebSocket Service for Real-time Communication
// Handles both Signaling WebSocket and Analysis WebSocket

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// ============================================================================
// Base WebSocket Manager
// ============================================================================

class WebSocketManager {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageHandlers = new Map();
    this.connectionHandlers = [];
    this.errorHandlers = [];
  }

  connect(token) {
    if (IS_MOCK_MODE) {
      console.log(`[Mock WebSocket] Simulating connection to ${this.endpoint}`);
      this.isConnected = true;
      this.notifyConnectionHandlers(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const url = `${WS_URL}${this.endpoint}?token=${token}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log(`WebSocket connected: ${this.endpoint}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyErrorHandlers(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log(`WebSocket closed: ${this.endpoint}`);
          this.isConnected = false;
          this.notifyConnectionHandlers(false);
          this.attemptReconnect(token);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  send(message) {
    if (IS_MOCK_MODE) {
      console.log(`[Mock WebSocket] Sending:`, message);
      return;
    }

    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  off(messageType, handler) {
    if (this.messageHandlers.has(messageType)) {
      const handlers = this.messageHandlers.get(messageType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onConnection(handler) {
    this.connectionHandlers.push(handler);
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  handleMessage(message) {
    const { type } = message;
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => handler(message));
    }
  }

  notifyConnectionHandlers(isConnected) {
    this.connectionHandlers.forEach(handler => handler(isConnected));
  }

  notifyErrorHandlers(error) {
    this.errorHandlers.forEach(handler => handler(error));
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(() => {
        this.connect(token).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}

// ============================================================================
// Signaling WebSocket (for WebRTC signaling and call management)
// ============================================================================

class SignalingWebSocket extends WebSocketManager {
  constructor() {
    super('/ws/signaling');
  }

  // Call management methods
  initiateCall(toUserId) {
    this.send({
      type: 'call',
      to: toUserId,
    });
  }

  acceptCall(callId) {
    this.send({
      type: 'call_accept',
      call_id: callId,
    });
  }

  rejectCall(callId) {
    this.send({
      type: 'call_reject',
      call_id: callId,
    });
  }

  hangup(callId) {
    this.send({
      type: 'hangup',
      call_id: callId,
    });
  }

  sendCallInitiate(callId, calleeId) {
    this.send({
      type: 'call_initiate',
      call_id: callId,
      callee_id: calleeId,
    });
  }

  // WebRTC signaling methods
  sendOffer(callId, toUserId, sdp) {
    this.send({
      type: 'offer',
      call_id: callId,
      to: toUserId,
      sdp,
    });
  }

  sendAnswer(callId, toUserId, sdp) {
    this.send({
      type: 'answer',
      call_id: callId,
      to: toUserId,
      sdp,
    });
  }

  sendIceCandidate(callId, toUserId, candidate) {
    this.send({
      type: 'ice_candidate',
      call_id: callId,
      to: toUserId,
      candidate,
    });
  }
}

// ============================================================================
// Analysis WebSocket (for audio analysis and risk updates)
// ============================================================================

class AnalysisWebSocket extends WebSocketManager {
  constructor() {
    super('/ws/analysis');  
  }

  connectWithCallId(token, callId) {
  // Build the full URL with both token and call_id
  const url = `${WS_URL}/ws/analysis?token=${token}&call_id=${callId}`;

  // Connect directly without using base connect()
  return new Promise((resolve, reject) => {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`Analysis WebSocket connected for call: ${callId}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Analysis WebSocket error:', error);
        this.notifyErrorHandlers(error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Analysis WebSocket closed');
        this.isConnected = false;
        this.notifyConnectionHandlers(false);
      };
    } catch (error) {
      reject(error);
    }
  });
}


  sendAudioChunk(callId, pcmData, sampleRate = 16000) {
    this.send({
      type: 'audio_chunk',
      call_id: callId,
      audio_data: Array.from(pcmData),
      sample_rate: sampleRate,
      channels: 1,
      format: 'int16',
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// WebSocket Factory & Singleton Instances
// ============================================================================

let signalingWebSocket = null;
let analysisWebSocket = null;

export const getSignalingWebSocket = () => {
  if (!signalingWebSocket) {
    signalingWebSocket = new SignalingWebSocket();
  }
  return signalingWebSocket;
};

export const getAnalysisWebSocket = () => {
  if (!analysisWebSocket) {
    analysisWebSocket = new AnalysisWebSocket();
  }
  return analysisWebSocket;
};

// Cleanup function
export const closeAllWebSockets = () => {
  if (signalingWebSocket) {
    signalingWebSocket.disconnect();
    signalingWebSocket = null;
  }
  if (analysisWebSocket) {
    analysisWebSocket.disconnect();
    analysisWebSocket = null;
  }
};

// Export individual classes for testing
export { SignalingWebSocket, AnalysisWebSocket };
