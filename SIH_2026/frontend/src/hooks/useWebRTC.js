import { useState, useEffect, useCallback, useRef } from 'react';

// Call states
export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  FAILED: 'failed',
};

/**
 * useWebRTC Hook - Core State Management
 * 
 * Manages WebRTC call state, streams, and peer connections.
 * Requirements: 2.7, 5.5, 7.1, 7.2
 */
export const useWebRTC = () => {
  // Call state management
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Refs for WebRTC objects (don't trigger re-renders)
  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  
  /**
   * Call state machine transitions
   */
  const transitionToState = useCallback((newState) => {
    console.log(`Call state transition: ${callState} → ${newState}`);
    setCallState(newState);
    
    // Handle state-specific side effects
    if (newState === CALL_STATES.CONNECTED) {
      // Start call duration counter
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    if (newState === CALL_STATES.ENDED || newState === CALL_STATES.FAILED) {
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [callState]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('useWebRTC cleanup: stopping streams and closing connections');
      
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Stop local stream tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped local track: ${track.kind}`);
        });
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log('Peer connection closed');
      }
    };
  }, [localStream]);
  
  /**
   * Format call duration (seconds → MM:SS)
   */
  const formatDuration = useCallback(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);
  
  return {
    // State
    callState,
    currentCallId,
    localStream,
    remoteStream,
    isMuted,
    callDuration,
    
    // Setters (for other hooks to use)
    setCallState: transitionToState,
    setCurrentCallId,
    setLocalStream,
    setRemoteStream,
    setIsMuted,
    
    // Refs
    peerConnectionRef,
    
    // Utils
    formatDuration,
  };
};

export default useWebRTC;
