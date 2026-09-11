import React from 'react';

/**
 * PresenceIndicator Component - Cyber Trust Palette
 */
export default function PresenceIndicator({ isOnline, showLabel = false, size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div 
        className={`rounded-full transition-colors ${sizeClasses[size]} ${
          isOnline ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
        }`}
        title={isOnline ? 'Verified Online' : 'Offline'}
      />
      {showLabel && (
        <span className={`text-xs font-semibold ${isOnline ? 'text-[#065F46]' : 'text-[#64748B]'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
