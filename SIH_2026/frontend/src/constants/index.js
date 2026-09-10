// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Users
  USERS_ONLINE: '/api/users/online',
  USER_BY_ID: (id) => `/api/users/${id}`,
  
  // Contacts
  CONTACTS: '/api/contacts',
  ADD_CONTACT: '/api/contacts',
  
  // Calls
  CALL_HISTORY: '/api/calls/history',
  CALL_SESSION: (id) => `/api/calls/${id}`,
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  SIGNALING: '/ws/signaling',
  ANALYSIS: '/ws/analyze',
};

// Call States
export const CALL_STATES = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  RINGING: 'RINGING',
  ACCEPTED: 'ACCEPTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  REJECTED: 'REJECTED',
  ENDED: 'ENDED',
  FAILED: 'FAILED',
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

// Risk Level Colors
export const RISK_COLORS = {
  LOW: {
    bg: 'bg-success-dark/20',
    text: 'text-success-light',
    border: 'border-success-light',
    icon: 'text-success-light',
  },
  MEDIUM: {
    bg: 'bg-warning-dark/20',
    text: 'text-warning-light',
    border: 'border-warning-light',
    icon: 'text-warning-light',
  },
  HIGH: {
    bg: 'bg-danger-dark/20',
    text: 'text-danger-light',
    border: 'border-danger-light',
    icon: 'text-danger-light',
  },
};

// Risk Messages
export const RISK_MESSAGES = {
  LOW: {
    title: 'Human Voice Detected',
    message: 'This voice appears to be human.',
    icon: '✓',
  },
  MEDIUM: {
    title: 'Possible Synthetic Voice',
    message: 'Voice shows minor characteristics. Proceed with caution.',
    icon: '⚠',
  },
  HIGH: {
    title: 'AI-Generated Voice Detected',
    message: 'This voice is likely AI-generated.',
    icon: '⚠',
  },
};

// User Status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
  IN_CALL: 'in_call',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'voiceshield_access_token',
  USER: 'voiceshield_user',
  // NOTE: NEVER store audio, MODEL_API_KEY, or sensitive data
};

// Routes
export const ROUTES = {
  LANDING: '/',
  SIGN_UP: '/signup',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONTACTS: '/contacts',
  CALL_HISTORY: '/history',
  SETTINGS: '/settings',
  ABOUT: '/about',
  CALL: '/call/:callId',
};

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    {
      urls: import.meta.env.VITE_STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
    },
    ...(import.meta.env.VITE_TURN_SERVER_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_SERVER_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_PASSWORD,
          },
        ]
      : []),
  ],
};

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bufferSize: 4096,
};

// Privacy Notice
export const PRIVACY_NOTICE = 'Raw Audio Retention: OFF';

// Mock Mode
export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';
