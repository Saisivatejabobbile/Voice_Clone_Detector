import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import WaveformAnimation from '../components/call/WaveformAnimation';
import RiskDashboard from '../components/call/RiskDashboard';
import { ROUTES } from '../constants';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall';

import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { getAnalysisWebSocket } from '../services/websocket';
import { PhoneIcon, MicIcon } from '../utils/icons';

/**
 * ActiveCallPage Component
 * 
 * Displays active call UI with:
 * - Call duration prominently displayed
 * - Connection status (connecting, connected, reconnecting)
 * - Two-column layout: Call UI (left) + Risk Dashboard (right) - ONLY FOR RECEIVER
 * - Call controls (mute, end call, speaker)
 * - Real-time audio analysis with AudioWorklet integration
 * 
 * KEY BEHAVIOR:
 * - Risk Dashboard shows ONLY on RECEIVER side (not caller)
 * - Only CALLER's audio is analyzed (remoteStream on receiver = caller's audio)
 * 
 * Task: 9.2 Update ActiveCallPage with risk dashboard integration
 * Task: 7.3 Integrate AudioWorklet with WebRTC hook
 * Requirements: 14.1, 14.2, 6.6, 11.1, 11.7, 11.8
 */
export default function ActiveCallPage() {
  const navigate = useNavigate();
  const { callId } = useParams();
  
 const {
  callState,
  isMuted,
  incomingCall,
  remoteStream,
  isReceiver, // NEW: Check if user is receiver
  toggleMute,
  endCall,
  formatDuration: getCallDuration
} = useSharedSimplePeerCall();


  // Initialize analysis WebSocket connection (Task 7.3) - ONLY for receiver
  useEffect(() => {
    // ONLY connect analysis WebSocket if user is receiver
    if (!isReceiver) {
      console.log('[Analysis] Skipping analysis - user is CALLER (not receiver)');
      return;
    }

    const analysisWS = getAnalysisWebSocket();
    const token = localStorage.getItem('access_token');
    
 if (token && callId) {
  console.log('[Analysis] Connecting as RECEIVER - will analyze CALLER audio');
  analysisWS.connectWithCallId(token, callId).catch(err => {
    console.error('Failed to connect to analysis WebSocket:', err);
  });
}

    
    return () => {
      // Cleanup handled by AudioWorklet
    };
  }, [callId, isReceiver]);

  // Create callback to send audio chunks to analysis WebSocket (Task 7.3)
  // Wrapped in useCallback to prevent re-creation on every render
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    // ONLY send if user is receiver
    if (!isReceiver) {
      return; // Skip sending - caller doesn't analyze
    }

    const analysisWS = getAnalysisWebSocket();
    if (analysisWS.isConnected) {
      analysisWS.sendAudioChunk(callId, pcmData, sampleRate);
    }
  }, [isReceiver]);

  // Initialize AudioWorklet with remote stream (Task 7.3)
  // Only activate when call is connected and remote stream is available AND user is receiver
  const shouldProcessAudio = callState === 'connected' && remoteStream && callId && isReceiver;
  
  console.log('[AudioProcessor] shouldProcessAudio:', shouldProcessAudio, 
    '| isReceiver:', isReceiver, '| callState:', callState);
  
  useAudioProcessor(
    shouldProcessAudio ? remoteStream : null,
    callId,
    sendAudioChunk
  );

  // Redirect if no active call
  useEffect(() => {
    if (callState === 'idle' || callState === 'ended') {
      navigate(ROUTES.DASHBOARD);
    }
  }, [callState, navigate]);

  // Determine caller info
  const callerInfo = incomingCall || {
    caller_name: 'Connected User',
    caller_email: 'user@example.com'
  };

  const handleMuteToggle = () => {
    toggleMute();
  };

  const handleEndCall = () => {
    endCall();
    navigate(ROUTES.DASHBOARD);
  };

  // Determine connection status for display (Requirement 14.2, 6.6)
  const getConnectionStatus = () => {
    switch (callState) {
      case 'calling':
        return { label: 'Calling...', variant: 'warning', pulse: true };
      case 'ringing':
        return { label: 'Ringing...', variant: 'info', pulse: true };
      case 'connecting':
        return { label: 'Connecting...', variant: 'warning', pulse: true };
      case 'connected':
        return { label: 'Connected', variant: 'success', pulse: true };
      default:
        return { label: 'Disconnected', variant: 'danger', pulse: false };
    }
  };

  const connectionStatus = getConnectionStatus();

  // Show connecting state for non-connected calls
  if (callState !== 'connected') {
    return (
      <SimpleLayout>
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <PhoneIcon className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-white font-medium mb-2 text-xl">{connectionStatus.label}</p>
            <p className="text-gray-400 text-lg">Establishing connection</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-4 lg:p-8">
        {/* Header - Timer and Status - Prominently displayed (Requirement 6.6) */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white text-3xl font-mono font-bold">
                {getCallDuration()}
              </div>
              <Badge variant={connectionStatus.variant} size="md">
                {connectionStatus.pulse && (
                  <div className="w-2 h-2 bg-success-light rounded-full mr-2 animate-pulse" />
                )}
                {connectionStatus.label}
              </Badge>
              {/* Role Indicator for debugging */}
              <Badge variant={isReceiver ? "info" : "warning"} size="sm">
                {isReceiver ? '👂 Receiver' : '📞 Caller'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Call UI + Risk Dashboard (ONLY for receiver) */}
        <div className={`max-w-7xl mx-auto grid grid-cols-1 ${isReceiver ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
          
          {/* Left Column: Call UI */}
          <div className="flex flex-col">
            <div className="bg-dark-900/50 backdrop-blur-sm border border-dark-700 rounded-3xl p-8 lg:p-12 shadow-2xl">
              {/* Caller Info */}
              <div className="flex flex-col items-center mb-8">
                <Avatar 
                  name={callerInfo.caller_name || 'User'} 
                  size="3xl" 
                  status="in_call"
                  className="mb-4 ring-4 ring-primary-600/20"
                />
                
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2 text-center">
                  {callerInfo.caller_name || 'Connected User'}
                </h2>
                
                {callerInfo.caller_email && (
                  <p className="text-gray-400 text-base lg:text-lg">
                    {callerInfo.caller_email}
                  </p>
                )}
              </div>

              {/* Waveform Visualization */}
              <div className="mb-8">
                <WaveformAnimation 
                  isActive={!isMuted} 
                  bars={35}
                  color="primary"
                />
                <p className="text-center text-gray-400 text-base mt-4">
                  {isMuted ? 'Microphone muted' : 'Call in progress...'}
                </p>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-6 lg:gap-8">
                {/* Mute Button */}
                <button
                  onClick={handleMuteToggle}
                  className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center transition-all ${
                    isMuted 
                      ? 'bg-warning-dark hover:bg-warning-dark/80' 
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <MicIcon 
                    className={`w-5 h-5 lg:w-6 lg:h-6 ${isMuted ? 'text-warning-light' : 'text-white'}`}
                    muted={isMuted}
                  />
                </button>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-danger-dark hover:bg-danger-dark/80 flex items-center justify-center transition-all"
                  title="End Call"
                >
                  <PhoneIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white transform rotate-135" />
                </button>

                {/* Speaker Button (placeholder for future) */}
                <button
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-all opacity-50 cursor-not-allowed"
                  title="Speaker (Coming Soon)"
                  disabled
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414A2 2 0 014 14v-4a2 2 0 011.586-1.414L8 7.172a1 1 0 01.707-.293V7a1 1 0 012 0v0a1 1 0 01-.707.293L7.586 8.414v7.172l2.414 1.414A1 1 0 0111 17v0a1 1 0 01-2 0v-.121a1 1 0 01-.707-.293l-2.414-1.414A1.998 1.998 0 015.586 15.414z" />
                  </svg>
                </button>
              </div>

              {/* Call Info */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  End-to-end encrypted • VoiceShield
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Risk Dashboard - ONLY SHOW FOR RECEIVER (Task 9.2) */}
          {isReceiver && (
            <div className="flex flex-col">
              <RiskDashboard
                callId={callId}
                callerInfo={{
                  name: callerInfo.caller_name || 'Connected User',
                  phoneNumber: callerInfo.caller_email || '',
                  avatar: null
                }}
                isAnalyzing={callState === 'connected'}
              />
            </div>
          )}

        </div>
      </div>
    </SimpleLayout>
  );
}
