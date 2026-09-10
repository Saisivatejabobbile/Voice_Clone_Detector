import React from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';

/**
 * CallControls Component
 * 
 * Provides mute and end call controls during active calls.
 * Requirements: 6.1, 6.2, 6.3
 */
export const CallControls = ({ isMuted, onToggleMute, onEndCall, callDuration }) => {
  return (
    <div className="flex items-center justify-center gap-6 p-6 bg-gray-900 rounded-2xl shadow-2xl">
      {/* Call Duration */}
      {callDuration && (
        <div className="text-white text-lg font-mono">
          {callDuration}
        </div>
      )}
      
      {/* Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-all ${
          isMuted
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-700 hover:bg-gray-600'
        } text-white shadow-lg`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      
      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
        title="End Call"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

export default CallControls;
