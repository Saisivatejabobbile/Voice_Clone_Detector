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
  
  const token = authToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('access_token') : null) || localStorage.getItem('access_token');
  const ws = useStableWebSocket('ws://localhost:8000/ws/signaling', token);

  // Handle incoming call
  useEffect(() => {
    return ws.onMessage('incoming_call', (msg) => {
      console.log('[Call] Incoming call from:', msg.caller_name, 'call_id:', msg.call_id);
      currentCallIdRef.current = msg.call_id;  // Store call_id
      setIncomingCall({
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
      });
      setCallState('ringing');
    });
  }, [ws]);

  // Handle call accepted
  useEffect(() => {
    return ws.onMessage('call_accepted', async (msg) => {
      console.log('[Call] Call accepted, creating peer as INITIATOR (CALLER)');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        const peer = new SimplePeer({
          initiator: true,
          stream: stream,
          trickle: true,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        
        peer.on('signal', (data) => {
          console.log('[WebRTC] Sending signal to callee:', data.type);
          
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
        });

        peer.on('stream', (stream) => {
          console.log('[WebRTC] Got remote stream!');
          isPeerConnected = true;
          setRemoteStream(stream);
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play();
          setCallState('connected');
          startCallTimer();
        });
        
        peer.on('error', (err) => {
          console.error('[WebRTC] Peer error:', err);
          if (isPeerConnected) {
            endCallRef.current?.(true);
          }
        });

        peer.on('close', () => {
          console.log('[WebRTC] Peer connection closed');
          if (isPeerConnected) {
            endCallRef.current?.(true);
          }
        });
        
        peerRef.current = peer;
      } catch (error) {
        console.error('[Call] Failed to get microphone:', error);
        alert('Microphone access denied');
        endCallRef.current?.();
      }
    });
  }, [ws]);

  // Handle SDP offer
  useEffect(() => {
    return ws.onMessage('sdp_offer', (msg) => {
      console.log('[WebRTC] Received SDP offer from peer');
      if (peerRef.current) {
        peerRef.current.signal({ type: 'offer', sdp: msg.sdp });
      }
    });
  }, [ws]);

  // Handle SDP answer
  useEffect(() => {
    return ws.onMessage('sdp_answer', (msg) => {
      console.log('[WebRTC] Received SDP answer from peer');
      if (peerRef.current) {
        peerRef.current.signal({ type: 'answer', sdp: msg.sdp });
      }
    });
  }, [ws]);

  // Handle ICE candidate
  useEffect(() => {
    return ws.onMessage('ice_candidate', (msg) => {
      console.log('[WebRTC] Received ICE candidate from peer');
      if (peerRef.current) {
        peerRef.current.signal(msg.candidate);
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
    
    ws.sendMessage({
      type: 'call_initiate',
      call_id: call_id,
      callee_id: calleeIdRef.current,
      callee_name: contactName
    });

    // Navigate to active call page
    navigate(`/call/${call_id}`);
  }, [ws, navigate]);


  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.error('[Call] No incoming call to accept');
      return;
    }
    
    console.log('[Call] Accepting call as RECEIVER (CALLEE)');
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      const peer = new SimplePeer({
        initiator: false,
        stream: stream,
        trickle: true,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      
      peer.on('signal', (data) => {
        console.log('[WebRTC] Sending signal to caller:', data.type);
        
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
      });

      peer.on('stream', (stream) => {
        console.log('[WebRTC] Got remote stream!');
        isPeerConnected = true;
        setRemoteStream(stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
        setCallState('connected');
        startCallTimer();
      });
      
      peer.on('error', (err) => {
        console.error('[WebRTC] Peer error:', err);
        if (isPeerConnected) {
          endCallRef.current?.(true);
        }
      });

      peer.on('close', () => {
        console.log('[WebRTC] Peer connection closed');
        if (isPeerConnected) {
          endCallRef.current?.(true);
        }
      });
      
      peerRef.current = peer;
      
      // Send acceptance message
      ws.sendMessage({ 
        type: 'call_accept', 
        call_id: callId 
      });
    } catch (error) {
      console.error('[Call] Failed to get microphone:', error);
      alert('Microphone access denied');
      rejectCall();
    }
 }, [ws, incomingCall, navigate]);


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
    setCallState('ringing');
  }, []);

  return {
    callState,
    incomingCall,
    isMuted,
    remoteStream,
    isReceiver, // NEW: Export isReceiver flag
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
