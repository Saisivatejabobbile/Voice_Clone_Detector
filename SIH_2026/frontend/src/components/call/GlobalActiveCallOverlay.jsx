import { useLocation } from 'react-router-dom';
import { useSharedSimplePeerCall } from '../../hooks/useSharedSimplePeerCall.jsx';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import WaveformAnimation from './WaveformAnimation';
import { PhoneIcon, MicIcon } from '../../utils/icons';

// Global Active Call Overlay - Modern Enterprise Call Capsule
export default function GlobalActiveCallOverlay() {
  const location = useLocation();
  
  const {
    callState,
    isMuted,
    toggleMute,
    endCall,
    formatDuration,
    isReceiver,
    callId
  } = useSharedSimplePeerCall();

  const isCallReceiver = isReceiver || (typeof sessionStorage !== 'undefined' && callId && sessionStorage.getItem(`call_role_${callId}`) === 'receiver');

  // Don't show on ActiveCallPage (which has its own full UI + RiskDashboard)
  if (location.pathname.startsWith('/call/')) {
    return null;
  }

  // Only show when call is connected
  if (callState !== 'connected') {
    return null;
  }

  const handleEndCall = () => {
    endCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1F3A]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl shadow-2xl p-8 text-[#0F172A] dark:text-[#F1F5F9] transition-colors">
        {/* Header - Timer and Status */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F] mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-[#38BDF8]">
              {isCallReceiver ? 'Active Call • Voice Inspection' : 'Encrypted Outgoing Call'}
            </span>
          </div>
          <div className="font-mono text-xl font-bold text-[#0B1F3A] dark:text-white bg-slate-100 dark:bg-[#12233C] border border-transparent dark:border-[#1E3A5F] px-3 py-1 rounded-lg">
            {formatDuration()}
          </div>
        </div>

        {/* Caller Info */}
        <div className="flex flex-col items-center mb-6">
          <Avatar 
            name="Verified Caller"
            size="2xl" 
            className="mb-3 ring-4 ring-[#0B1F3A]/10 dark:ring-[#00C2FF]/20 shadow-md"
          />
          
          <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">
            Connected Participant
          </h2>
          
          <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            {isCallReceiver ? 'Real-Time Voice Integrity Active' : 'Secure P2P Channel'}
          </p>
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
              ? 'Microphone muted locally' 
              : (isCallReceiver 
                  ? 'Incoming audio analyzed in real-time' 
                  : 'Encrypted voice connection active')}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
              isMuted 
                ? 'bg-[#EF4444] text-white' 
                : 'bg-white dark:bg-[#12233C] border border-[#CBD5E1] dark:border-[#1E3A5F] text-[#0B1F3A] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1E3A5F]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <MicIcon 
              className={`w-6 h-6 ${isMuted ? 'text-white' : 'text-[#0B1F3A] dark:text-white'}`}
              muted={isMuted}
            />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center transition-all shadow-md active:scale-95"
            title="End Call"
          >
            <PhoneIcon className="w-7 h-7 text-white transform rotate-135" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F] text-center">
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
            Zero Audio Retention • Transient Memory Only
          </p>
        </div>
      </div>
    </div>
  );
}
