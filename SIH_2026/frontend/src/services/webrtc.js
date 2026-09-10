// WebRTC Service for Peer-to-Peer Voice Calls
// Handles peer connection, media streams, and signaling

import { WEBRTC_CONFIG } from '../constants';

class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callState = 'IDLE';
    this.isMuted = false;
    this.isSpeakerOn = false;
    
    // Event handlers
    this.onRemoteStreamHandler = null;
    this.onStateChangeHandler = null;
    this.onIceCandidateHandler = null;
    this.onConnectionStateChangeHandler = null;
  }

  /**
   * Initialize WebRTC peer connection
   */
  async initialize() {
    try {
      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.onIceCandidateHandler) {
          this.onIceCandidateHandler(event.candidate);
        }
      };

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        this.remoteStream = event.streams[0];
        
        if (this.onRemoteStreamHandler) {
          this.onRemoteStreamHandler(this.remoteStream);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('Connection state changed:', state);
        
        if (this.onConnectionStateChangeHandler) {
          this.onConnectionStateChangeHandler(state);
        }

        // Update call state based on connection state
        switch (state) {
          case 'connected':
            this.updateState('CONNECTED');
            break;
          case 'disconnected':
          case 'failed':
            this.updateState('FAILED');
            break;
          case 'closed':
            this.updateState('ENDED');
            break;
          default:
            break;
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      };

      console.log('WebRTC peer connection initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  /**
   * Get local media stream (microphone)
   */
  async getLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('Local stream acquired');
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStream() {
    if (!this.localStream || !this.peerConnection) {
      throw new Error('Local stream or peer connection not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    console.log('Local stream added to peer connection');
  }

  /**
   * Create WebRTC offer (caller side)
   */
  async createOffer() {
    try {
      if (!this.peerConnection) {
        await this.initialize();
      }

      await this.getLocalStream();
      this.addLocalStream();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('WebRTC offer created');
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Create WebRTC answer (receiver side)
   */
  async createAnswer(offer) {
    try {
      if (!this.peerConnection) {
        await this.initialize();
      }

      await this.getLocalStream();
      this.addLocalStream();

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('WebRTC answer created');
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  /**
   * Handle remote offer (receiver side)
   */
  async handleOffer(offer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log('Remote offer set');
    } catch (error) {
      console.error('Failed to handle offer:', error);
      throw error;
    }
  }

  /**
   * Handle remote answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log('Remote answer set');
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log('ICE candidate added');
      }
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        console.log('Microphone muted:', this.isMuted);
        return this.isMuted;
      }
    }
    return this.isMuted;
  }

  /**
   * Toggle speaker (for future implementation)
   */
  toggleSpeaker() {
    // Note: Speaker control is limited in web browsers
    // This is mainly for UI state
    this.isSpeakerOn = !this.isSpeakerOn;
    console.log('Speaker on:', this.isSpeakerOn);
    return this.isSpeakerOn;
  }

  /**
   * Get remote stream for audio analysis
   */
  getRemoteStream() {
    return this.remoteStream;
  }

  /**
   * Get current local stream reference
   */
  getLocalMediaStream() {
    return this.localStream;
  }

  /**
   * Get call statistics
   */
  async getStats() {
    if (!this.peerConnection) {
      return null;
    }

    try {
      const stats = await this.peerConnection.getStats();
      const statsArray = [];
      
      stats.forEach((report) => {
        statsArray.push({
          type: report.type,
          id: report.id,
          timestamp: report.timestamp,
          ...report,
        });
      });

      return statsArray;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Update call state
   */
  updateState(newState) {
    this.callState = newState;
    if (this.onStateChangeHandler) {
      this.onStateChangeHandler(newState);
    }
  }

  /**
   * Get current call state
   */
  getState() {
    return this.callState;
  }

  /**
   * End call and cleanup
   */
  endCall() {
    console.log('Ending call and cleaning up...');

    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Reset state
    this.callState = 'IDLE';
    this.isMuted = false;
    this.isSpeakerOn = false;

    console.log('Call ended and resources cleaned up');
  }

  /**
   * Event handler setters
   */
  onRemoteStream(handler) {
    this.onRemoteStreamHandler = handler;
  }

  onStateChange(handler) {
    this.onStateChangeHandler = handler;
  }

  onIceCandidate(handler) {
    this.onIceCandidateHandler = handler;
  }

  onConnectionStateChange(handler) {
    this.onConnectionStateChangeHandler = handler;
  }

  /**
   * Check if microphone permission is granted
   */
  static async checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.warn('Permission API not supported:', error);
      return 'prompt';
    }
  }

  /**
   * Check if WebRTC is supported
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }
}

// Singleton instance
let webRTCManager = null;

/**
 * Get WebRTC manager instance
 */
export const getWebRTCManager = () => {
  if (!webRTCManager) {
    webRTCManager = new WebRTCManager();
  }
  return webRTCManager;
};

/**
 * Reset WebRTC manager (useful for testing)
 */
export const resetWebRTCManager = () => {
  if (webRTCManager) {
    webRTCManager.endCall();
    webRTCManager = null;
  }
};

export default WebRTCManager;
