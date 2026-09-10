import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { useStableWebSocket } from './useStableWebSocket';
import { callsAPI } from '../services/api';

export function useSimplePeerCall() {
  const navigate = useNavigate();
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isReceiver, setIsReceiver] = useState(false); // NEW: Track if user is receiver (callee)
  
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const calleeIdRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const callStartTimeRef = useRef(null);
  
  const token = localStorage.getItem('access_token');
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
        caller_email: msg.caller_email
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
        
        peer.on('stream', (stream) => {
          console.log('[WebRTC] Got remote stream!');
          setRemoteStream(stream);
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play();
          setCallState('connected');
          startCallTimer();
          // Global overlay will show automatically
        });
        
        peer.on('error', (err) => {
          console.error('[WebRTC] Peer error:', err);
          endCall();
        });
        
        peerRef.current = peer;
      } catch (error) {
        console.error('[Call] Failed to get microphone:', error);
        alert('Microphone access denied');
        endCall();
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

  // Handle call rejected
  useEffect(() => {
    return ws.onMessage('call_rejected', () => {
      console.log('[Call] Call rejected');
      alert('Call rejected');
      endCall();
    });
  }, [ws]);

  // Handle call failed
  useEffect(() => {
    return ws.onMessage('call_failed', (msg) => {
      console.log('[Call] Call failed:', msg.reason, msg.message);
      alert(`Call failed: ${msg.message || msg.reason}`);
      endCall();
    });
  }, [ws]);

  // Handle hangup
  useEffect(() => {
    return ws.onMessage('hangup', () => {
      console.log('[Call] Call ended by remote user');
      endCall();
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
      alert('Not connected to server');
      return;
    }
    
    // Generate unique call_id
    const call_id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentCallIdRef.current = call_id;
    calleeIdRef.current = contactId;
    
    console.log(`[Call] Initiating call to ${contactName} (ID: ${contactId}) with call_id: ${call_id}`);
    setCallState('calling');
    setIsReceiver(false); // CALLER role
    
     ws.sendMessage({
    type: 'call_initiate',
    call_id: call_id,
    callee_id: contactId,
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
    calleeIdRef.current = callerId;
    
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
      
      peer.on('stream', (stream) => {
        console.log('[WebRTC] Got remote stream!');
        setRemoteStream(stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
        setCallState('connected');
        startCallTimer();
        // Global overlay will show automatically
      });
      
      peer.on('error', (err) => {
        console.error('[WebRTC] Peer error:', err);
        endCall();
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

  const endCall = useCallback(async () => {
    console.log('[Call] Ending call');
    console.log('[Call Debug] callState:', callState);
    console.log('[Call Debug] callStartTimeRef:', callStartTimeRef.current);
    console.log('[Call Debug] currentCallIdRef:', currentCallIdRef.current);
    console.log('[Call Debug] calleeIdRef:', calleeIdRef.current);
    console.log('[Call Debug] callDuration:', callDuration);
    
    // NOTE: Call history is now automatically saved by backend on hangup (Task 4.2)
    // No need to manually save from frontend
    // Backend _handle_hangup_routing() saves call history with risk scores
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    const callId = currentCallIdRef.current;
    if (callId) {
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
  }, [ws, callState, callDuration]);

  const formatDuration = useCallback(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

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
    formatDuration
  };
}
