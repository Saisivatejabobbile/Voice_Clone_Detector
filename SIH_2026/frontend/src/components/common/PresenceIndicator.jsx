import React from 'react';

/**
 * PresenceIndicator Component
 * 
 * Displays online/offline status indicator
 * Requirements: 16.4
 */
export default function PresenceIndicator({ isOnline, showLabel = false, size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div 
        className={`rounded-full transition-colors ${sizeClasses[size]} ${isOnline ? 'bg-success-light animate-pulse' : 'bg-gray-500'}`}
        title={isOnline ? 'Online' : 'Offline'}
      />
      {showLabel && (
        <span className={`text-sm font-medium ${isOnline ? 'text-success-light' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
