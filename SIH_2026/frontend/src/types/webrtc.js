// WebRTC Types and Configuration
export const CallState = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  FAILED: 'failed',
  REJECTED: 'rejected'
};

export const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000
  },
  video: false
};

export default { CallState, rtcConfiguration, audioConstraints };
