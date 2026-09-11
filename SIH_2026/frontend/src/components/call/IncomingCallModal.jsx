import { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

// Incoming Call Modal Component - Enterprise Security Verification
export default function IncomingCallModal({ 
  caller, 
  onAccept, 
  onReject, 
  isOpen 
}) {
  const oscillatorRef = useRef(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    if (isOpen && caller) {
      console.log('Incoming call from:', caller?.full_name);
      playRingtone();
      return () => {
        stopRingtone();
      };
    }
  }, [isOpen, caller]);

  const playRingtone = async () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 480;
      gainNode.gain.value = 0.4;
      
      oscillator.start();
      
      const interval = setInterval(() => {
        oscillator.frequency.value = oscillator.frequency.value === 480 ? 620 : 480;
      }, 500);
      
      oscillatorRef.current = { audioContext, oscillator, gainNode, interval };
      setAudioBlocked(false);
    } catch (error) {
      console.warn('Ringtone blocked:', error.message);
      setAudioBlocked(true);
    }
  };

  const stopRingtone = () => {
    if (oscillatorRef.current) {
      const { audioContext, oscillator, interval } = oscillatorRef.current;
      clearInterval(interval);
      try {
        oscillator.stop();
        audioContext.close();
      } catch (e) {
        // Ignored
      }
      oscillatorRef.current = null;
    }
  };

  const handleAccept = () => {
    stopRingtone();
    onAccept();
  };

  const handleReject = () => {
    stopRingtone();
    onReject();
  };

  const enableAudio = () => {
    stopRingtone();
    playRingtone();
  };

  if (!isOpen || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* High-trust Backdrop */}
      <div className="absolute inset-0 bg-[#0B1F3A]/70 backdrop-blur-md" />
      
      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-auto text-center overflow-hidden text-[#0F172A] dark:text-[#F1F5F9] transition-colors">
        {/* Security Header Band */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#12233C] border border-slate-200 dark:border-[#1E3A5F] text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
          SECURE INCOMING VOICE CALL
        </div>

        {/* Caller Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar 
              name={caller.full_name || caller.caller_name || 'Caller'} 
              src={caller.avatar}
              size="2xl" 
              className="ring-4 ring-[#0B1F3A]/10 dark:ring-[#00C2FF]/20 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white dark:border-[#0F1D32]" />
          </div>
          
          <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white mb-1">
            {caller.full_name || caller.caller_name || 'Authorized Caller'}
          </h2>
          
          <p className="text-sm font-mono text-[#64748B] dark:text-[#94A3B8] mb-2">{caller.email || caller.caller_email || 'Secured VoIP line'}</p>
          
          {caller.phone_number && (
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-2">{caller.phone_number}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-[#008BB8] dark:text-[#38BDF8] bg-[#00C2FF]/10 dark:bg-[#00C2FF]/20 border border-transparent dark:border-[#00C2FF]/30 px-3 py-1 rounded-full mb-6 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-ping" />
            Live AI Impersonation Shield Armed
          </div>
          
          {audioBlocked && (
            <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-left">
              <p className="text-amber-800 dark:text-amber-200 text-xs">
                Ringtone blocked by browser.{' '}
                <button 
                  onClick={enableAudio}
                  className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100"
                >
                  Click to play audio
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            variant="danger"
            size="lg"
            onClick={handleReject}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.12.45 2.33.69 3.48.69a1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.15.24 2.36.69 3.48a1 1 0 01-.21 1.11l-2.36 2.2z" />
            </svg>
            <span>Decline</span>
          </Button>
          
          <Button
            variant="success"
            size="lg"
            onClick={handleAccept}
            className="w-full py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.12.45 2.33.69 3.48.69a1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.15.24 2.36.69 3.48a1 1 0 01-.21 1.11l-2.36 2.2z" />
            </svg>
            <span>Accept</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
