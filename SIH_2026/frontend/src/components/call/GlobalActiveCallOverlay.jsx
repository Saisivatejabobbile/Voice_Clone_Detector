import { useLocation } from 'react-router-dom';
import { useCall } from '../../context/CallContext';
import { useSharedSimplePeerCall } from '../../hooks/useSharedSimplePeerCall.jsx';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import WaveformAnimation from './WaveformAnimation';
import { PhoneIcon, MicIcon } from '../../utils/icons';

export default function GlobalActiveCallOverlay() {
  const location = useLocation();
  
  // Use the SimplePeer hook which has the actual call state
  const {
    callState,
    isMuted,
    toggleMute,
    endCall,
    formatDuration
  } = useSharedSimplePeerCall();

  console.log('[GlobalOverlay] callState:', callState, 'pathname:', location.pathname);

  // Don't show on ActiveCallPage - it has its own UI + RiskDashboard
  if (location.pathname.startsWith('/call/')) {
    console.log('[GlobalOverlay] On ActiveCallPage, hiding overlay');
    return null;
  }

  // Only show when call is connected
  if (callState !== 'connected') {
    return null;
  }

  console.log('[GlobalOverlay] Rendering overlay!');

  const handleEndCall = () => {
    console.log('[GlobalOverlay] End call button clicked!');
    endCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header - Timer and Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-300 text-2xl font-mono font-bold">
            {formatDuration()}
          </div>
          <Badge variant="success" size="sm">
            <div className="w-2 h-2 bg-success-light rounded-full mr-2 animate-pulse" />
            Connected
          </Badge>
        </div>

        {/* Main Card */}
        <div className="bg-dark-900/50 backdrop-blur-sm border border-dark-700 rounded-3xl p-12 shadow-2xl">
          {/* Caller Info */}
          <div className="flex flex-col items-center mb-8">
            <Avatar 
              name="Connected User"
              size="3xl" 
              status="in_call"
              className="mb-4 ring-4 ring-primary-600/20"
            />
            
            <h2 className="text-4xl font-bold text-white mb-2">
              Connected User
            </h2>
            
            <p className="text-gray-400 text-lg">
              user@example.com
            </p>
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
          <div className="flex items-center justify-center gap-8">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isMuted 
                  ? 'bg-warning-dark hover:bg-warning-dark/80' 
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <MicIcon 
                className={`w-8 h-8 ${isMuted ? 'text-warning-light' : 'text-white'}`}
                muted={isMuted}
              />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-danger-dark hover:bg-danger-dark/80 flex items-center justify-center transition-all"
              title="End Call"
            >
              <PhoneIcon className="w-8 h-8 text-white transform rotate-135" />
            </button>

            {/* Speaker Button (placeholder for future) */}
            <button
              className="w-20 h-20 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-all"
              title="Speaker"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414A2 2 0 014 14v-4a2 2 0 011.586-1.414L8 7.172a1 1 0 01.707-.293V7a1 1 0 012 0v0a1 1 0 01-.707.293L7.586 8.414v7.172l2.414 1.414A1 1 0 0111 17v0a1 1 0 01-2 0v-.121a1 1 0 01-.707-.293l-2.414-1.414A1.998 1.998 0 015.586 15.414z" /></svg>
            </button>
          </div>

          {/* Call Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Voice call � End-to-end encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
