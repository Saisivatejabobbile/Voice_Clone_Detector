import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';

/**
 * IncomingCallModal Component
 * 
 * Displays modal for incoming calls with accept/reject options.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const IncomingCallModal = ({ callerInfo, onAccept, onReject }) => {
  if (!callerInfo) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-pulse-slow">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto flex items-center justify-center text-white text-4xl font-bold">
              {callerInfo.caller_name ? callerInfo.caller_name.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {callerInfo.caller_name || 'Unknown Caller'}
          </h2>
          
          {callerInfo.caller_email && (
            <p className="text-gray-600 dark:text-gray-400">
              {callerInfo.caller_email}
            </p>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Incoming Voice Call
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
          >
            <PhoneOff size={20} />
            <span>Decline</span>
          </button>
          
          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-lg animate-bounce-slow"
          >
            <Phone size={20} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
