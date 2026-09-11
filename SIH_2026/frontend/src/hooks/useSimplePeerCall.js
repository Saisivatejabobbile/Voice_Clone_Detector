import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { useStableWebSocket } from './useStableWebSocket';
import { useAuth } from '../context/AuthContext';
import { callsAPI } from '../services/api';
import { ROUTES } from '../constants';

export function useSimplePeerCall() {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerDetails, setCallerDetails] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isReceiver, setIsReceiver] = useState(false); // Track if user is receiver (callee)
  
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const calleeIdRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const endCallRef = useRef(null);
  const pendingSignalsRef = useRef([]);
  
  const token = authToken || 
    (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('access_token') || sessionStorage.getItem('voiceshield_access_token')) : null) || 
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('voiceshield_access_token')) : null);
  
  const signalingWsUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname || 'localhost'}:8000/ws/signaling`
    : 'ws://localhost:8000/ws/signaling';

  const ws = useStableWebSocket(signalingWsUrl, token);

  const drainPendingSignals = useCallback((peer) => {
    if (!peer || pendingSignalsRef.current.length === 0) return;
    console.log(`[WebRTC] Draining ${pendingSignalsRef.current.length} queued signals`);
    while (pendingSignalsRef.current.length > 0) {
      const sig = pendingSignalsRef.current.shift();
      try {
        peer.signal(sig);
      } catch (err) {
        console.warn('[WebRTC] Error signaling queued item:', err);
      }
    }
  }, []);

  // Handle incoming call
  useEffect(() => {
    return ws.onMessage('incoming_call', (msg) => {
      console.log('[Call] Incoming call from:', msg.caller_name, 'call_id:', msg.call_id);
      currentCallIdRef.current = msg.call_id;  // Store call_id
      const callerObj = {
        call_id: msg.call_id,
        from: msg.from,
        caller_name: msg.caller_name,
        caller_email: msg.caller_email,
        full_name: msg.caller_name,
        email: msg.caller_email,
        contact: {
          id: msg.from,
          full_name: msg.caller_name,
          email: msg.caller_email
        }
      };
      setIncomingCall(callerObj);
      setCallerDetails(callerObj);
      setCallState('ringing');
    });
  }, [ws]);

// Helper to acquire a real audio stream, or gracefully fallback to a silent audio stream
// to prevent WebRTC crashes when microphones are missing, busy, or permissions are pending
async function getAudioStreamWithFallback() {
  try {
    if (navigator?.mediaDevices?.getUserMedia) {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (s && s.getAudioTracks().length > 0) {
        return s;
      }
    }
  } catch (err) {
    console.warn('[Call] getUserMedia failed or microphone access restricted, using silent audio stream fallback:', err);
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) track.enabled = false;
      return dst.stream;
    }
  } catch (fallbackErr) {
    console.warn('[Call] AudioContext fallback failed:', fallbackErr);
  }
  return null;
}

  // Handle call accepted
  useEffect(() => {
    return ws.onMessage('call_accepted', async (msg) => {
      console.log('[Call] Call accepted by peer, creating peer as INITIATOR (CALLER):', msg);
      
      try {
        if (typeof window !== 'undefined') {
          if (!window.process) window.process = { env: {} };
          if (!window.process.nextTick) {
            window.process.nextTick = (fn, ...args) => queueMicrotask(() => fn(...args));
          }
        }

        const stream = await getAudioStreamWithFallback();
        localStreamRef.current = stream;
        
        const peer = new SimplePeer({
          initiator: true,
          stream: stream || undefined,
          trickle: true,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        
        peer.on('signal', (data) => {
          console.log('[WebRTC] Caller sending signal to callee:', data.type || 'candidate');
          
          // Detect signal type and send appropriate message
          if (data.type === 'offer') {
            ws.sendMessage({ 
              type: 'sdp_offer', 
              call_id: currentCallIdRef.current,
              to: calleeIdRef.current,
              sdp: data.sdp
            });
          } else if (data.type === 'answer') {
            ws.sendMessage({ 
              type: 'sdp_answer', 
              call_id: currentCallIdRef.current,
              to: calleeIdRef.current,
              sdp: data.sdp
            });
          } else if (data.candidate) {
            ws.sendMessage({ 
              type: 'ice_candidate', 
              call_id: currentCallIdRef.current,
              to: calleeIdRef.current,
              candidate: data
            });
          }
        });
        
        let isPeerConnected = false;
        
        peer.on('connect', () => {
          console.log('[WebRTC] Initiator peer connected');
          isPeerConnected = true;
          setCallState('connected');
        });

        peer.on('stream', (stream) => {
          console.log('[WebRTC] Caller got remote stream!');
          isPeerConnected = true;
          setRemoteStream(stream);
          try {
            const audio = new Audio();
            audio.srcObject = stream;
            audio.play().catch(e => {
              console.warn('[WebRTC] Caller stream autoplay prevented:', e);
            });
          } catch (e) {
            console.warn('[WebRTC] Caller audio play error:', e);
          }
          setCallState('connected');
          startCallTimer();
        });
        
        peer.on('error', (err) => {
          console.error('[WebRTC] Caller peer error:', err);
          if (isPeerConnected) {
            endCallRef.current?.(false, currentCallIdRef.current);
          }
        });

        peer.on('close', () => {
          console.log('[WebRTC] Caller peer connection closed');
          if (isPeerConnected) {
            endCallRef.current?.(false, currentCallIdRef.current);
          }
        });
        
        peerRef.current = peer;
        drainPendingSignals(peer);
      } catch (error) {
        console.error('[Call] Failed to initialize initiator peer:', error);
      }
    });
  }, [ws, drainPendingSignals]);

  // Handle SDP offer
  useEffect(() => {
    return ws.onMessage('sdp_offer', (msg) => {
      console.log('[WebRTC] Received SDP offer from peer');
      if (peerRef.current) {
        try {
          peerRef.current.signal({ type: 'offer', sdp: msg.sdp });
        } catch (e) {
          console.warn('[WebRTC] Error signaling offer:', e);
        }
      } else {
        console.log('[WebRTC] Peer not ready, queueing sdp_offer');
        pendingSignalsRef.current.push({ type: 'offer', sdp: msg.sdp });
      }
    });
  }, [ws]);

  // Handle SDP answer
  useEffect(() => {
    return ws.onMessage('sdp_answer', (msg) => {
      console.log('[WebRTC] Received SDP answer from peer');
      if (peerRef.current) {
        try {
          peerRef.current.signal({ type: 'answer', sdp: msg.sdp });
        } catch (e) {
          console.warn('[WebRTC] Error signaling answer:', e);
        }
      } else {
        console.log('[WebRTC] Peer not ready, queueing sdp_answer');
        pendingSignalsRef.current.push({ type: 'answer', sdp: msg.sdp });
      }
    });
  }, [ws]);

  // Handle ICE candidate
  useEffect(() => {
    return ws.onMessage('ice_candidate', (msg) => {
      console.log('[WebRTC] Received ICE candidate from peer');
      if (peerRef.current && msg.candidate) {
        try {
          peerRef.current.signal(msg.candidate);
        } catch (e) {
          console.warn('[WebRTC] Error signaling ICE candidate:', e);
        }
      } else if (msg.candidate) {
        console.log('[WebRTC] Peer not ready, queueing ice_candidate');
        pendingSignalsRef.current.push(msg.candidate);
      }
    });
  }, [ws]);

  // Handle call rejected by remote peer
  useEffect(() => {
    return ws.onMessage('call_rejected', (msg) => {
      console.log('[Call] Call rejected by peer:', msg);
      endCallRef.current?.(true, msg?.call_id);
    });
  }, [ws]);

  // Handle call failed
  useEffect(() => {
    return ws.onMessage('call_failed', (msg) => {
      console.log('[Call] Call failed:', msg?.reason, msg?.message);
      endCallRef.current?.(true, msg?.call_id);
    });
  }, [ws]);

  // Handle hangup from remote peer
  useEffect(() => {
    return ws.onMessage('hangup', (msg) => {
      console.log('[Call] Call ended by remote user:', msg);
      endCallRef.current?.(true, msg?.call_id);
    });
  }, [ws]);

  const startCallTimer = () => {
    callStartTimeRef.current = new Date();
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const initiateCall = useCallback((contactId, contactName) => {
    if (!ws.isConnected) {
      alert('Signaling gateway is not connected. Please ensure you are connected to the network.');
      return;
    }
    
    // Generate unique call_id
    const call_id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentCallIdRef.current = call_id;
    
    // Ensure numeric ID if possible for backend integer matching
    const numericCalleeId = Number(contactId);
    calleeIdRef.current = !isNaN(numericCalleeId) && numericCalleeId > 0 ? numericCalleeId : contactId;
    
    console.log(`[Call] Initiating call to ${contactName} (ID: ${calleeIdRef.current}) with call_id: ${call_id}`);
    setCallState('calling');
    setIsReceiver(false); // CALLER role
    setCallerDetails({
      caller_name: contactName,
      full_name: contactName,
      id: calleeIdRef.current
    });
    
    ws.sendMessage({
      type: 'call_initiate',
      call_id: call_id,
      callee_id: calleeIdRef.current,
      callee_name: contactName
    });

    // Navigate to active call page
    navigate(`/call/${call_id}`);
  }, [ws, navigate]);


  const rejectCall = useCallback(() => {
    const callId = incomingCall?.call_id || currentCallIdRef.current;
    console.log('[Call] Rejecting call:', callId);
    
    if (callId) {
      ws.sendMessage({ 
        type: 'call_reject', 
        call_id: callId 
      });
    }
    
    setIncomingCall(null);
    setCallState('idle');
  }, [ws, incomingCall]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.error('[Call] No incoming call to accept');
      return;
    }
    
    console.log('[Call] Accepting call as RECEIVER (CALLEE):', incomingCall);
    setCallState('connecting');
    setIsReceiver(true); // RECEIVER role
    
    const callId = incomingCall.call_id;
    const callerId = incomingCall.from;
    
    // For receiver: store caller as the "other party" for history
    const numericCallerId = Number(callerId);
    calleeIdRef.current = !isNaN(numericCallerId) && numericCallerId > 0 ? numericCallerId : callerId;
    currentCallIdRef.current = callId;
    
    setIncomingCall(null);
    navigate(`/call/${callId}`);
    try {
      if (typeof window !== 'undefined') {
        if (!window.process) window.process = { env: {} };
        if (!window.process.nextTick) {
          window.process.nextTick = (fn, ...args) => queueMicrotask(() => fn(...args));
        }
      }

      const stream = await getAudioStreamWithFallback();
      localStreamRef.current = stream;
      
      const peer = new SimplePeer({
        initiator: false,
        stream: stream || undefined,
        trickle: true,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      
      peer.on('signal', (data) => {
        console.log('[WebRTC] Callee sending signal to caller:', data.type || 'candidate');
        
        // Detect signal type and send appropriate message
        if (data.type === 'offer') {
          ws.sendMessage({ 
            type: 'sdp_offer', 
            call_id: callId,
            to: callerId,
            sdp: data.sdp
          });
        } else if (data.type === 'answer') {
          ws.sendMessage({ 
            type: 'sdp_answer', 
            call_id: callId,
            to: callerId,
            sdp: data.sdp
          });
        } else if (data.candidate) {
          ws.sendMessage({ 
            type: 'ice_candidate', 
            call_id: callId,
            to: callerId,
            candidate: data
          });
        }
      });
      
      let isPeerConnected = false;

      peer.on('connect', () => {
        console.log('[WebRTC] Receiver peer connected');
        isPeerConnected = true;
        setCallState('connected');
      });

      peer.on('stream', (stream) => {
        console.log('[WebRTC] Callee got remote stream!');
        isPeerConnected = true;
        setRemoteStream(stream);
        try {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play().catch(e => {
            console.warn('[WebRTC] Callee stream autoplay prevented:', e);
          });
        } catch (e) {
          console.warn('[WebRTC] Callee stream audio error:', e);
        }
        setCallState('connected');
        startCallTimer();
      });
      
      peer.on('error', (err) => {
        console.error('[WebRTC] Callee peer error:', err);
        if (isPeerConnected) {
          endCallRef.current?.(false, callId);
        }
      });

      peer.on('close', () => {
        console.log('[WebRTC] Callee peer connection closed');
        if (isPeerConnected) {
          endCallRef.current?.(false, callId);
        }
      });
      
      peerRef.current = peer;
      drainPendingSignals(peer);
      
      // Send acceptance message upstream
      console.log('[Call] Sending call_accept to backend for call_id:', callId);
      ws.sendMessage({ 
        type: 'call_accept', 
        call_id: callId 
      });
    } catch (error) {
      console.error('[Call] Failed to initialize callee peer:', error);
      // Ensure call_accept is still dispatched to caller so connection attempt can proceed
      ws.sendMessage({ 
        type: 'call_accept', 
        call_id: callId 
      });
    }
  }, [ws, incomingCall, navigate, drainPendingSignals]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const endCall = useCallback((isRemote = false, explicitCallId = null) => {
    console.log('[Call] Ending call, isRemote:', isRemote, 'explicitCallId:', explicitCallId);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.warn('[WebRTC] Peer destroy error:', e);
      }
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('[Call] Stop track error:', e);
      }
      localStreamRef.current = null;
    }
    
    // Resolve callId from param, ref, or URL path
    const urlCallId = typeof window !== 'undefined' && window.location.pathname.startsWith('/call/')
      ? window.location.pathname.split('/call/')[1]
      : null;
    const callId = explicitCallId || currentCallIdRef.current || urlCallId;
    
    // Only send hangup upstream if this side initiated the termination
    if (!isRemote && callId) {
      console.log('[Call] Sending hangup upstream for call_id:', callId);
      ws.sendMessage({ 
        type: 'hangup', 
        call_id: callId 
      });
    }
    
    setCallState('idle');
    setIncomingCall(null);
    setCallerDetails(null);
    setCallDuration(0);
    setIsMuted(false);
    setRemoteStream(null);
    setIsReceiver(false);
    currentCallIdRef.current = null;
    calleeIdRef.current = null;
    callStartTimeRef.current = null;

    // Immediately navigate away from active call screen on both sides
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/call/')) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [ws, navigate]);

  // Keep ref synchronized on every render
  endCallRef.current = endCall;

  // Listen to beforeunload to cleanly hangup if window or tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState !== 'idle') {
        const urlCallId = typeof window !== 'undefined' && window.location.pathname.startsWith('/call/')
          ? window.location.pathname.split('/call/')[1]
          : null;
        const callId = currentCallIdRef.current || urlCallId;
        if (callId) {
          ws.sendMessage({ type: 'hangup', call_id: callId });
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [ws, callState]);

  const formatDuration = useCallback(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  const simulateIncomingCall = useCallback((callerData = null) => {
    const simCallId = `call_sim_${Date.now()}`;
    currentCallIdRef.current = simCallId;
    const simCaller = {
      call_id: simCallId,
      from: callerData?.id || 999,
      caller_name: callerData?.full_name || 'Dr. Evelyn Reed (Verified)',
      caller_email: callerData?.email || 'evelyn.reed@enterprise.corp',
      full_name: callerData?.full_name || 'Dr. Evelyn Reed (Verified)',
      email: callerData?.email || 'evelyn.reed@enterprise.corp',
      contact: {
        id: callerData?.id || 999,
        full_name: callerData?.full_name || 'Dr. Evelyn Reed (Verified)',
        email: callerData?.email || 'evelyn.reed@enterprise.corp'
      }
    };
    setIncomingCall(simCaller);
    setCallerDetails(simCaller);
    setCallState('ringing');
  }, []);

  return {
    callState,
    incomingCall,
    callerDetails,
    isMuted,
    remoteStream,
    isReceiver, // Export isReceiver flag
    isConnected: ws.isConnected,
    initiateCall,
    acceptCall,
    rejectCall,
    toggleMute,
    endCall,
    formatDuration,
    simulateIncomingCall
  };
}
