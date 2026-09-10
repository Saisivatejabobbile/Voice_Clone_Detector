import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  requestMicrophoneAccess,
  stopMediaStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addICECandidate,
} from '../utils/webrtc';

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
 * useWebRTC Hook - Complete WebRTC Call Management
 * 
 * Manages complete WebRTC call lifecycle with signaling.
 * Requirements: Multiple tasks 5.5-5.11
 */
export const useWebRTCComplete = (signalingWebSocket) => {
  // Call state management
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  
  // Refs for WebRTC objects
  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const signalingWSRef = useRef(signalingWebSocket);
  
  // Update ref when signalingWebSocket changes
  useEffect(() => {
    signalingWSRef.current = signalingWebSocket;
  }, [signalingWebSocket]);
  
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
      
      // Clear incoming call if any
      setIncomingCall(null);
    }
  }, [callState]);
  
  /**
   * Task 5.5: Initiate call to contact
   */
  const initiateCall = useCallback(async (contactId, contactName) => {
    try {
      console.log(`Initiating call to contact ${contactId}...`);
      setError(null);
      
      // Generate unique call ID
      const callId = `call-${Date.now()}`;
      setCurrentCallId(callId);
      
      // Request microphone access
      const { stream, error: micError } = await requestMicrophoneAccess();
      if (micError) {
        setError(micError);
        transitionToState(CALL_STATES.FAILED);
        return;
      }
      
      setLocalStream(stream);
      transitionToState(CALL_STATES.CALLING);
      
      // Create peer connection
      const pc = createPeerConnection({
        localStream: stream,
        onRemoteStream: (remoteStr) => {
          console.log('Remote stream received');
          setRemoteStream(remoteStr);
        },
        onICECandidate: (candidate) => {
          if (signalingWebSocket?.isConnected) {
            signalingWSRef.current?.sendMessage({
              type: 'ice_candidate',
              call_id: callId,
              to: contactId,
              candidate: candidate,
            });
          }
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            transitionToState(CALL_STATES.CONNECTED);
          } else if (state === 'failed' || state === 'closed') {
            transitionToState(CALL_STATES.FAILED);
          }
        },
      });
      
      peerConnectionRef.current = pc;
      
      // Send call_initiate to signaling server
      signalingWebSocket?.sendMessage({
        type: 'call_initiate',
        call_id: callId,
        callee_id: contactId,
      });
      
      console.log(`Call ${callId} initiated to ${contactName}`);
      
    } catch (err) {
      console.error('Failed to initiate call:', err);
      setError(err.message);
      transitionToState(CALL_STATES.FAILED);
    }
  }, [signalingWebSocket, transitionToState]);
  
  /**
   * Task 5.6: Accept incoming call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.error('No incoming call to accept');
      return;
    }
    
    try {
      console.log(`Accepting call ${incomingCall.call_id}...`);
      setError(null);
      setCurrentCallId(incomingCall.call_id);
      
      // Request microphone access
      const { stream, error: micError } = await requestMicrophoneAccess();
      if (micError) {
        setError(micError);
        transitionToState(CALL_STATES.FAILED);
        return;
      }
      
      setLocalStream(stream);
      
      // Send call_accept message
      signalingWebSocket?.sendMessage({
        type: 'call_accept',
        call_id: incomingCall.call_id,
      });
      
      // Create peer connection
      const pc = createPeerConnection({
        localStream: stream,
        onRemoteStream: (remoteStr) => {
          console.log('Remote stream received');
          setRemoteStream(remoteStr);
        },
        onICECandidate: (candidate) => {
          if (signalingWebSocket?.isConnected) {
            signalingWSRef.current?.sendMessage({
              type: 'ice_candidate',
              call_id: incomingCall.call_id,
              to: incomingCall.from,
              candidate: candidate,
            });
          }
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            transitionToState(CALL_STATES.CONNECTED);
          } else if (state === 'failed' || state === 'closed') {
            transitionToState(CALL_STATES.FAILED);
          }
        },
      });
      
      peerConnectionRef.current = pc;
      transitionToState(CALL_STATES.RINGING);
      
      // Process queued ICE candidates
      iceCandidatesQueueRef.current.forEach(candidate => {
        addICECandidate(pc, candidate);
      });
      iceCandidatesQueueRef.current = [];
      
      console.log('Call accepted, waiting for SDP offer...');
      
    } catch (err) {
      console.error('Failed to accept call:', err);
      setError(err.message);
      transitionToState(CALL_STATES.FAILED);
    }
  }, [incomingCall, signalingWebSocket, transitionToState]);
  
  /**
   * Task 5.7: Reject incoming call
   */
  const rejectCall = useCallback(() => {
    if (!incomingCall) {
      console.error('No incoming call to reject');
      return;
    }
    
    console.log(`Rejecting call ${incomingCall.call_id}...`);
    
    // Send call_reject message
    signalingWebSocket?.sendMessage({
      type: 'call_reject',
      call_id: incomingCall.call_id,
    });
    
    setIncomingCall(null);
    transitionToState(CALL_STATES.IDLE);
  }, [incomingCall, signalingWebSocket, transitionToState]);
  
  /**
   * Task 5.8: Handle SDP offer/answer
   */
  const handleSDPOffer = useCallback(async (sdp) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection for SDP offer');
      return;
    }
    
    try {
      console.log('Handling SDP offer...');
      
      // Set remote description
      await setRemoteDescription(peerConnectionRef.current, sdp);
      
      // Create answer
      const { answer, error: answerError } = await createAnswer(peerConnectionRef.current);
      if (answerError) {
        console.error('Failed to create answer:', answerError);
        return;
      }
      
      // Send SDP answer
      signalingWebSocket?.sendMessage({
        type: 'sdp_answer',
        call_id: currentCallId,
        to: incomingCall.from,
        sdp: answer,
      });
      
      console.log('SDP answer sent');
      
    } catch (err) {
      console.error('Failed to handle SDP offer:', err);
      setError(err.message);
    }
  }, [currentCallId, incomingCall, signalingWebSocket]);
  
  const handleSDPAnswer = useCallback(async (sdp) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection for SDP answer');
      return;
    }
    
    try {
      console.log('Handling SDP answer...');
      await setRemoteDescription(peerConnectionRef.current, sdp);
      console.log('SDP answer processed');
    } catch (err) {
      console.error('Failed to handle SDP answer:', err);
      setError(err.message);
    }
  }, []);
  
  /**
   * Task 5.9: Handle ICE candidate
   */
  const handleICECandidate = useCallback(async (candidate) => {
    if (!peerConnectionRef.current) {
      console.log('Peer connection not ready, queuing ICE candidate');
      iceCandidatesQueueRef.current.push(candidate);
      return;
    }
    
    try {
      await addICECandidate(peerConnectionRef.current, candidate);
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);
  
  /**
   * Task 5.10: Call controls - Mute toggle
   */
  const toggleMute = useCallback(() => {
    if (!localStream) {
      console.warn('No local stream to mute');
      return;
    }
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      console.log(`Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
    }
  }, [localStream]);
  
  /**
   * Task 5.10: Call controls - End call
   */
  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    // Send hangup message
    if (currentCallId && signalingWebSocket?.isConnected) {
      signalingWSRef.current?.sendMessage({
        type: 'hangup',
        call_id: currentCallId,
      });
    }
    
    // Stop local stream
    if (localStream) {
      stopMediaStream(localStream);
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setRemoteStream(null);
    setCurrentCallId(null);
    setIsMuted(false);
    transitionToState(CALL_STATES.ENDED);
  }, [currentCallId, localStream, signalingWebSocket, transitionToState]);
  
  /**
   * Handle incoming signaling messages
   */
  useEffect(() => {
    if (!signalingWSRef.current) return;
    
    const handleIncomingCall = (message) => {
      console.log('Incoming call from:', message.caller_name);
      setIncomingCall({
        call_id: message.call_id,
        from: message.from,
        caller_name: message.caller_name,
        caller_email: message.caller_email,
      });
      transitionToState(CALL_STATES.RINGING);
    };
    
    const handleCallAccepted = async (message) => {
      console.log('Call accepted');
      
      // Create and send SDP offer
      if (peerConnectionRef.current) {
        const { offer, error: offerError } = await createOffer(peerConnectionRef.current);
        if (!offerError && offer) {
          signalingWSRef.current?.sendMessage({
            type: 'sdp_offer',
            call_id: message.call_id,
            to: message.by,
            sdp: offer,
          });
        }
      }
    };
    
    const handleCallRejected = (message) => {
      console.log('Call rejected');
      setError('Call was rejected');
      endCall();
    };
    
    const handleCallFailed = (message) => {
      console.error('Call failed:', message.reason);
      setError(message.message || 'Call failed');
      transitionToState(CALL_STATES.FAILED);
      endCall();
    };
    
    const handleHangup = (message) => {
      console.log('Remote user ended call');
      endCall();
    };
    
    // Register message handlers
    const cleanups = [
      signalingWSRef.current?.onMessage('incoming_call', handleIncomingCall),
      signalingWSRef.current?.onMessage('call_accepted', handleCallAccepted),
      signalingWSRef.current?.onMessage('call_rejected', handleCallRejected),
      signalingWSRef.current?.onMessage('call_failed', handleCallFailed),
      signalingWSRef.current?.onMessage('hangup', handleHangup),
      signalingWSRef.current?.onMessage('sdp_offer', (msg) => handleSDPOffer(msg.sdp)),
      signalingWSRef.current?.onMessage('sdp_answer', (msg) => handleSDPAnswer(msg.sdp)),
      signalingWSRef.current?.onMessage('ice_candidate', (msg) => handleICECandidate(msg.candidate)),
    ];
    
    return () => {
      cleanups.forEach(cleanup => cleanup && cleanup());
    };
  }, [handleSDPOffer, handleSDPAnswer, handleICECandidate, endCall, transitionToState]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('useWebRTC cleanup');
      
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Stop local stream
      if (localStream) {
        stopMediaStream(localStream);
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
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
    error,
    incomingCall,
    
    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    toggleMute,
    endCall,
    
    // Refs
    peerConnectionRef,
    
    // Utils
    formatDuration,
  };
};

export default useWebRTCComplete;
