import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CALL_STATES } from '../constants';
import { getWebRTCManager } from '../services/webrtc';
import { getSignalingWebSocket, getAnalysisWebSocket } from '../services/websocket';
import AudioProcessor from '../services/audioProcessor';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export function CallProvider({ children }) {
  const navigate = useNavigate();
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Service references
  const webrtcRef = useRef(null);
  const signalingWSRef = useRef(null);
  const analysisWSRef = useRef(null);
  const audioProcessorRef = useRef(null);

  // Initialize WebRTC and WebSocket services
  useEffect(() => {
    const token = localStorage.getItem('voiceshield_access_token');
    
    if (token) {
      // Initialize signaling WebSocket
      const signalingWS = getSignalingWebSocket();
      signalingWSRef.current = signalingWS;

      // Connect to signaling WebSocket
      signalingWS.connect(token).catch(err => {
        console.error('Failed to connect signaling WebSocket:', err);
      });

      // Listen for incoming calls
      signalingWS.on('incoming_call', (message) => {
        // Check if incoming calls are allowed in settings
        const allowIncomingCalls = localStorage.getItem('allowIncomingCalls');
        
        if (allowIncomingCalls === 'false') {
          // Auto-reject if incoming calls are disabled
          console.log('Incoming calls disabled - auto-rejecting call from:', message.caller_name);
          signalingWS.rejectCall(message.call_id);
          return;
        }
        
        // Check if notifications are enabled
        const incomingCallNotifications = localStorage.getItem('incomingCallNotifications');
        
        if (incomingCallNotifications !== 'false') {
          // Show browser notification if enabled
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Call', {
              body: `Call from ${message.caller_name}`,
              icon: '/logo.svg',
              tag: 'incoming-call'
            });
          }
        }
        
        receiveIncomingCall({
          id: message.from,
          full_name: message.caller_name,
          email: message.from,
        }, message.call_id);
      });

      // Listen for call accepted
      signalingWS.on('call_accepted', (message) => {
        console.log('Call accepted by:', message.by);
        setCallState(CALL_STATES.ACCEPTED);
      });

      // Listen for call rejected
      signalingWS.on('call_rejected', (message) => {
        console.log('Call rejected by:', message.by);
        setCallState(CALL_STATES.REJECTED);
        setTimeout(() => endCall(), 2000);
      });

      // Listen for WebRTC offer
      signalingWS.on('offer', async (message) => {
        console.log('Received offer');
        const webrtc = getWebRTCManager();
        webrtcRef.current = webrtc;
        
        const answer = await webrtc.createAnswer(message.sdp);
        signalingWS.sendAnswer(message.call_id, message.from, answer);
      });

      // Listen for WebRTC answer
      signalingWS.on('answer', async (message) => {
        console.log('Received answer');
        const webrtc = webrtcRef.current || getWebRTCManager();
        await webrtc.handleAnswer(message.sdp);
      });

      // Listen for ICE candidates
      signalingWS.on('ice_candidate', async (message) => {
        console.log('Received ICE candidate');
        const webrtc = webrtcRef.current || getWebRTCManager();
        await webrtc.addIceCandidate(message.candidate);
      });

      // Listen for hangup
      signalingWS.on('hangup', () => {
        console.log('Remote user hung up');
        endCall();
      });

      // Listen for risk updates
      const analysisWS = getAnalysisWebSocket();
      analysisWSRef.current = analysisWS;

      analysisWS.on('risk_update', (message) => {
        console.log('Risk update received:', message);
        setRiskData({
          risk_level: message.risk_level,
          risk_score: message.risk_score,
          synthetic_confidence: message.synthetic_confidence,
          model_confidence: message.model_confidence,
          recommendation: message.recommendation,
          acoustic_indicators: message.acoustic_indicators,
          prosody_indicators: message.prosody_indicators,
        });
      });

      analysisWS.on('analysis_status', (message) => {
        console.log('Analysis status:', message.state);
        setIsAnalyzing(message.state === 'ANALYZING');
      });
    }

    return () => {
      // Cleanup on unmount
      if (signalingWSRef.current) {
        signalingWSRef.current.disconnect();
      }
      if (analysisWSRef.current) {
        analysisWSRef.current.disconnect();
      }
    };
  }, []);

  // Start an outgoing call
  const startCall = useCallback(async (contact) => {
    try {
      const callId = `call-${Date.now()}`;
      
      setCurrentCall({
        id: callId,
        contact,
        startTime: Date.now(),
        isOutgoing: true,
      });
      
      setCallState(CALL_STATES.CALLING);
      
      // Initialize WebRTC
      const webrtc = getWebRTCManager();
      webrtcRef.current = webrtc;

      // Set up WebRTC event handlers
      webrtc.onRemoteStream((remoteStream) => {
        console.log('Remote stream received, starting audio analysis');
        startAudioAnalysis(remoteStream, callId);
      });

      webrtc.onIceCandidate((candidate) => {
        signalingWSRef.current?.sendIceCandidate(callId, contact.id, candidate);
      });

      webrtc.onConnectionStateChange((state) => {
        console.log('Connection state:', state);
        if (state === 'connected') {
          setCallState(CALL_STATES.CONNECTED);
        }
      });


      // Send call_initiate message to backend first
      signalingWSRef.current?.sendCallInitiate(callId, contact.id);

      // Create offer
      const offer = await webrtc.createOffer();
      
      // Send offer via signaling
      signalingWSRef.current?.sendOffer(callId, contact.id, offer);
      
      // Navigate to active call page
      navigate(`/call/${callId}`);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call: ' + error.message);
      setCallState(CALL_STATES.FAILED);
    }
  }, [navigate]);

  // Receive incoming call
  const receiveIncomingCall = useCallback((contact, callId) => {
    setIncomingCall({
      id: callId || `call-${Date.now()}`,
      contact,
      timestamp: Date.now(),
    });
    
    setCallState(CALL_STATES.RINGING);
  }, []);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      setCurrentCall({
        id: incomingCall.id,
        contact: incomingCall.contact,
        startTime: Date.now(),
        isOutgoing: false,
      });
      
      setCallState(CALL_STATES.ACCEPTED);
      setIncomingCall(null);
      
      // Initialize WebRTC
      const webrtc = getWebRTCManager();
      webrtcRef.current = webrtc;

      // Set up WebRTC event handlers
      webrtc.onRemoteStream((remoteStream) => {
        console.log('Remote stream received, starting audio analysis');
        startAudioAnalysis(remoteStream, incomingCall.id);
      });

      webrtc.onIceCandidate((candidate) => {
        signalingWSRef.current?.sendIceCandidate(
          incomingCall.id,
          incomingCall.contact.id,
          candidate
        );
      });

      webrtc.onConnectionStateChange((state) => {
        console.log('Connection state:', state);
        if (state === 'connected') {
          setCallState(CALL_STATES.CONNECTED);
        }
      });

      // Send accept message
      signalingWSRef.current?.acceptCall(incomingCall.id);
      
      // Navigate to active call page
      navigate(`/call/${incomingCall.id}`);
    } catch (error) {
      console.error('Failed to accept call:', error);
      alert('Failed to accept call: ' + error.message);
      setCallState(CALL_STATES.FAILED);
    }
  }, [incomingCall, navigate]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (incomingCall) {
      signalingWSRef.current?.rejectCall(incomingCall.id);
    }
    
    setIncomingCall(null);
    setCallState(CALL_STATES.REJECTED);
    
    setTimeout(() => {
      setCallState(CALL_STATES.IDLE);
    }, 1000);
  }, [incomingCall]);

  // End current call
  const endCall = useCallback(() => {
    if (currentCall) {
      signalingWSRef.current?.hangup(currentCall.id);
    }

    // Stop audio analysis
    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
      audioProcessorRef.current = null;
    }

    // Close analysis WebSocket
    if (analysisWSRef.current) {
      analysisWSRef.current.disconnect();
    }

    // End WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.endCall();
      webrtcRef.current = null;
    }

    setCurrentCall(null);
    setRiskData(null);
    setIsAnalyzing(false);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setCallState(CALL_STATES.ENDED);
    
    navigate('/dashboard');
    
    setTimeout(() => {
      setCallState(CALL_STATES.IDLE);
    }, 1000);
  }, [currentCall, navigate]);

  // Start audio analysis
  const startAudioAnalysis = useCallback(async (remoteStream, callId) => {
    try {
      // Initialize audio processor
      const processor = new AudioProcessor();
      audioProcessorRef.current = processor;
      
      await processor.initialize(remoteStream);
      
      // Connect analysis WebSocket
      const token = localStorage.getItem('voiceshield_access_token');
      await analysisWSRef.current?.connectWithCallId(token, callId);
      
      // Send PCM data to backend
      processor.onAudioData((pcmData) => {
        // Only send if voice activity detected (to reduce bandwidth)
        if (processor.hasVoiceActivity()) {
          analysisWSRef.current?.sendAudioChunk(callId, pcmData);
        }
      });
      
      processor.start();
      setIsAnalyzing(true);
      
      console.log('Audio analysis started');
    } catch (error) {
      console.error('Failed to start audio analysis:', error);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (webrtcRef.current) {
      const muted = webrtcRef.current.toggleMute();
      setIsMuted(muted);
      return muted;
    }
    return isMuted;
  }, [isMuted]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    if (webrtcRef.current) {
      const speakerOn = webrtcRef.current.toggleSpeaker();
      setIsSpeakerOn(speakerOn);
      return speakerOn;
    }
    return isSpeakerOn;
  }, [isSpeakerOn]);

  // Get audio volume for visualization
  const getAudioVolume = useCallback(() => {
    if (audioProcessorRef.current) {
      return audioProcessorRef.current.getVolumeLevel();
    }
    return 0;
  }, []);

  const value = {
    currentCall,
    incomingCall,
    callState,
    isMuted,
    isSpeakerOn,
    riskData,
    isAnalyzing,
    startCall,
    receiveIncomingCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    getAudioVolume,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}







