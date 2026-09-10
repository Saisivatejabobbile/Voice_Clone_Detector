// Application Constants

// Route paths
export const ROUTES = {
  LANDING: '/',
  SIGN_UP: '/signup',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONTACTS: '/contacts',
  CALL_HISTORY: '/history',
  SETTINGS: '/settings',
  ABOUT: '/about',
};

// LocalStorage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
  THEME: 'theme',
};

// Mock mode flag
export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    }
  ],
  iceCandidatePoolSize: 10
};

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

// Call States
export const CALL_STATES = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  RINGING: 'RINGING',
  CONNECTED: 'CONNECTED',
  ENDED: 'ENDED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
};

// Risk levels
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// Risk colors for UI
export const RISK_COLORS = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

// Risk messages
export const RISK_MESSAGES = {
  LOW: {
    title: 'Low Risk',
    description: 'This voice appears to be human.',
    recommendation: 'Safe to proceed with the conversation.',
  },
  MEDIUM: {
    title: 'Medium Risk',
    description: 'Voice shows minor synthetic characteristics.',
    recommendation: 'Proceed with caution and verify sensitive information.',
  },
  HIGH: {
    title: 'High Risk',
    description: 'This voice is likely AI-generated.',
    recommendation: 'Be cautious and avoid sharing sensitive information.',
  },
  CRITICAL: {
    title: 'Critical Risk',
    description: 'Strong indicators of AI-generated voice detected.',
    recommendation: 'Do not share any personal or financial information.',
  },
};

// API endpoints (for reference)
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  USERS: {
    ONLINE: '/api/users/online',
    BY_ID: (id) => `/api/users/${id}`,
  },
  CONTACTS: {
    LIST: '/api/contacts',
    ADD: '/api/contacts',
    REMOVE: (id) => `/api/contacts/${id}`,
  },
  CALLS: {
    HISTORY: '/api/calls/history',
    SESSION: (id) => `/api/calls/${id}`,
  },
};

// User status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
  AWAY: 'away',
};
