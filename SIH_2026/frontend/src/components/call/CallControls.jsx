// Call Controls Component - Enterprise Telephony Interface
export default function CallControls({ 
  onMuteToggle, 
  onSpeakerToggle, 
  onAddUser,
  onEndCall,
  isMuted = false,
  isSpeakerOn = false,
}) {
  return (
    <div className="flex items-center justify-center gap-5">
      {/* Mute Button */}
      <button
        type="button"
        onClick={onMuteToggle}
        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
          isMuted 
            ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] ring-4 ring-[#EF4444]/20' 
            : 'bg-white dark:bg-[#12233C] text-[#0B1F3A] dark:text-[#F1F5F9] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-slate-50 dark:hover:bg-[#162C4E]'
        }`}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Speaker Button */}
      <button
        type="button"
        onClick={onSpeakerToggle}
        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
          isSpeakerOn 
            ? 'bg-[#0B1F3A] dark:bg-[#00C2FF] text-white dark:text-[#0B1F3A] hover:bg-[#123C69] dark:hover:bg-[#00AEE6] ring-4 ring-[#0B1F3A]/20 dark:ring-[#00C2FF]/30' 
            : 'bg-white dark:bg-[#12233C] text-[#0B1F3A] dark:text-[#F1F5F9] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-slate-50 dark:hover:bg-[#162C4E]'
        }`}
        title={isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </button>

      {/* Add User Button */}
      <button
        type="button"
        onClick={onAddUser}
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#12233C] text-[#0B1F3A] dark:text-[#F1F5F9] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:bg-slate-50 dark:hover:bg-[#162C4E] flex items-center justify-center transition-all shadow-sm"
        title="Invite Verified Participant"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </button>

      {/* End Call Button */}
      <button
        type="button"
        onClick={onEndCall}
        className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
        title="Terminate Call Session"
      >
        <svg className="w-6 h-6 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.12.45 2.33.69 3.48.69a1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.15.24 2.36.69 3.48a1 1 0 01-.21 1.11l-2.36 2.2z" />
        </svg>
      </button>
    </div>
  );
}
