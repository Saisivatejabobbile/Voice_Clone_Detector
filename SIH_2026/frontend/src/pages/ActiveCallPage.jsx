import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import WaveformAnimation from '../components/call/WaveformAnimation';
import RiskDashboard from '../components/call/RiskDashboard';
import CallControls from '../components/call/CallControls';
import { ROUTES } from '../constants';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall';
import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { getAnalysisWebSocket } from '../services/websocket';
import { PhoneIcon } from '../utils/icons';

// ActiveCallPage Component - Enterprise Live Call & Voice Integrity Monitoring Room
export default function ActiveCallPage() {
  const navigate = useNavigate();
  const { callId } = useParams();
  
  const {
    callState,
    isMuted,
    incomingCall,
    callerDetails,
    remoteStream,
    isReceiver,
    toggleMute,
    endCall,
    formatDuration: getCallDuration
  } = useSharedSimplePeerCall();

  // Robust determination: verify both state and persistent session storage
  const isCallReceiver = isReceiver || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(`call_role_${callId}`) === 'receiver');

  // Initialize analysis WebSocket connection - ONLY for receiver
  useEffect(() => {
    if (!isCallReceiver) {
      console.log('[Analysis] User is CALLER - voice clone and spam analysis disabled on caller terminal');
      return;
    }

    const analysisWS = getAnalysisWebSocket();
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    
    if (token && callId) {
      console.log('[Analysis] Connecting as RECEIVER - will analyze incoming caller audio');
      analysisWS.connectWithCallId(token, callId, 'receiver').catch(err => {
        console.error('Failed to connect to analysis WebSocket:', err);
      });
    }
  }, [callId, isCallReceiver]);

  // Create callback to send audio chunks to analysis WebSocket
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    if (!isCallReceiver) {
      return;
    }

    const analysisWS = getAnalysisWebSocket();
    if (analysisWS.isConnected) {
      analysisWS.sendAudioChunk(callId, pcmData, sampleRate);
    }
  }, [isCallReceiver]);

  // Initialize AudioWorklet with remote stream - ONLY for receiver
  const shouldProcessAudio = callState === 'connected' && remoteStream && callId && isCallReceiver;
  
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
  const callerInfo = incomingCall || callerDetails || {
    caller_name: 'Connected Participant',
    caller_email: 'authorized.user@network.corp'
  };

  const handleMuteToggle = () => {
    toggleMute();
  };

  const handleEndCall = () => {
    endCall();
    navigate(ROUTES.DASHBOARD);
  };

  // Determine connection status for display
  const getConnectionStatus = () => {
    switch (callState) {
      case 'calling':
        return { label: 'Calling...', variant: 'warning', pulse: true };
      case 'ringing':
        return { label: 'Ringing...', variant: 'ai', pulse: true };
      case 'connecting':
        return { label: 'Connecting...', variant: 'warning', pulse: true };
      case 'connected':
        return { label: 'Encrypted Stream Connected', variant: 'success', pulse: true };
      default:
        return { label: 'Disconnected', variant: 'danger', pulse: false };
    }
  };

  const connectionStatus = getConnectionStatus();

  // Show connecting state for non-connected calls
  if (callState !== 'connected') {
    return (
      <SimpleLayout>
        <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-10 max-w-md w-full text-center shadow-lg text-[#0F172A] dark:text-[#F1F5F9]">
            <div className="w-16 h-16 bg-[#0B1F3A]/5 dark:bg-[#00C2FF]/10 border border-[#0B1F3A]/10 dark:border-[#00C2FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-pulse text-[#0B1F3A] dark:text-[#00C2FF]">
              <PhoneIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white mb-1.5">{connectionStatus.label}</h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">Establishing secure WebRTC signaling exchange...</p>
            
            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
            >
              Cancel Call
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] p-4 sm:p-6 lg:p-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Bar - Timer and Status */}
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className="font-mono text-3xl font-bold text-[#0B1F3A] dark:text-[#00C2FF] tracking-tight bg-slate-50 dark:bg-[#0B1524] px-3.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E3A5F]">
                {getCallDuration()}
              </div>
              
              <Badge variant={connectionStatus.variant} size="md">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                {connectionStatus.label}
              </Badge>

              <Badge variant={isCallReceiver ? "ai" : "primary"} size="sm">
                {isCallReceiver ? '🛡 Receiver (Live Inspection Active)' : '🎙 Caller (Outgoing)'}
              </Badge>
            </div>

            <button
              onClick={handleEndCall}
              className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors self-start sm:self-auto shadow-sm"
            >
              End Session
            </button>
          </div>

          {/* Two-Column Grid: Call Room (Left) + Risk Intelligence Dashboard (Right - Receiver Only) */}
          <div className={`grid grid-cols-1 ${isCallReceiver ? 'lg:grid-cols-12' : 'max-w-2xl mx-auto'} gap-6 items-start`}>
            
            {/* Left Column: Call Console */}
            <div className={`${isCallReceiver ? 'lg:col-span-5' : 'w-full'} flex flex-col`}>
              <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-8 shadow-sm transition-colors">
                {/* Caller Info */}
                <div className="flex flex-col items-center mb-6">
                  <Avatar 
                    name={callerInfo.caller_name || 'Participant'} 
                    size="3xl" 
                    status="in_call"
                    className="mb-4 ring-4 ring-[#0B1F3A]/10 dark:ring-[#00C2FF]/20 shadow-md"
                  />
                  
                  <h2 className="text-2xl font-bold text-[#0B1F3A] dark:text-white text-center">
                    {callerInfo.caller_name || 'Connected User'}
                  </h2>
                  
                  {callerInfo.caller_email && (
                    <p className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                      {callerInfo.caller_email}
                    </p>
                  )}

                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#12233C] text-[11px] font-semibold text-[#0B1F3A] dark:text-slate-200 border border-slate-200 dark:border-[#1E3A5F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    End-to-End Encrypted Call
                  </div>
                </div>

                {/* Waveform Visualization */}
                <div className="mb-6">
                  <WaveformAnimation 
                    isActive={!isMuted} 
                    bars={32}
                    color="cyan"
                  />
                  <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 font-medium">
                    {isMuted 
                      ? 'Local microphone is muted' 
                      : (isCallReceiver 
                          ? 'Incoming audio stream is analyzed for AI clones & spam' 
                          : 'Encrypted voice connection active')}
                  </p>
                </div>

                {/* Call Controls */}
                <div className="pt-2">
                  <CallControls 
                    onMuteToggle={handleMuteToggle}
                    onSpeakerToggle={() => {}}
                    onAddUser={() => {}}
                    onEndCall={handleEndCall}
                    isMuted={isMuted}
                    isSpeakerOn={false}
                  />
                </div>

                {/* Privacy Footnote */}
                <div className="mt-8 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F] text-center">
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                    Zero Audio Retention Policy • Memory Discard Enforced
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Real-Time Risk Dashboard (Receiver only - never shown on caller side) */}
            {isCallReceiver && (
              <div className="lg:col-span-7 flex flex-col">
                <RiskDashboard
                  callId={callId}
                  callerInfo={{
                    name: callerInfo.caller_name || 'Connected Participant',
                    phoneNumber: callerInfo.caller_email || '',
                    avatar: null
                  }}
                  isAnalyzing={callState === 'connected'}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}
