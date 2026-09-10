// WebRTC Voice Calling Configuration
// WebSocket URLs and WebRTC settings for real-time calling

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const config = {
  // HTTP API
  apiUrl: API_URL,
  
  // WebSocket URLs (Task 11.2)
  wsSignalingUrl: `${WS_BASE_URL}/ws/signaling`,  // WebRTC signaling
  wsAnalysisUrl: `${WS_BASE_URL}/ws/analysis`,    // Audio analysis
  
  // WebRTC Configuration (Task 11.2)
  rtcConfiguration: {
    iceServers: [
      {
        urls: import.meta.env.VITE_STUN_SERVER_URL || 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ],
    iceCandidatePoolSize: 10
  },
  
  // Audio Configuration
  audioConstraints: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000
    },
    video: false
  },
  
  // Risk Analysis
  riskLevels: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  }
};

export default config;
