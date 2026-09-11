import { useEffect, useState } from 'react';

/**
 * Enterprise Audio Waveform Monitoring Component
 * Precision real-time signal monitor using Electric Cyan #00C2FF accents
 */
export default function WaveformAnimation({ 
  isActive = true, 
  bars = 32, 
  color = 'cyan',
  height = 'h-20'
}) {
  const [heights, setHeights] = useState([]);

  // Color mapping
  const colorMap = {
    cyan: 'bg-[#00C2FF]',
    primary: 'bg-[#0B1F3A]',
    blue: 'bg-[#123C69]',
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
  };

  const barColor = colorMap[color] || colorMap.cyan;

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(bars).fill(15));
      return;
    }

    // Gentle enterprise sampling animation
    const interval = setInterval(() => {
      const newHeights = Array.from({ length: bars }, (_, i) => {
        // Natural speech frequency curve simulation (center heavier)
        const centerFactor = 1 - Math.abs(i - bars / 2) / (bars / 2) * 0.4;
        return Math.max(12, Math.min(95, Math.floor((Math.random() * 70 + 20) * centerFactor)));
      });
      setHeights(newHeights);
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, bars]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`flex items-end justify-center gap-[2.5px] ${height} w-full px-2 py-1 bg-slate-50 dark:bg-[#0B1524] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl transition-colors`}>
        {Array.from({ length: bars }).map((_, index) => (
          <div
            key={index}
            className={`w-[3px] sm:w-1 ${barColor} rounded-t-[1px] transition-all duration-100 ease-out`}
            style={{
              height: `${heights[index] || 15}%`,
              opacity: isActive ? 0.9 : 0.25,
            }}
          />
        ))}
      </div>
      
      {/* Telemetry Status Line */}
      <div className="flex items-center justify-between w-full mt-2 px-1 text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#00C2FF] animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
          {isActive ? 'LIVE PCM STREAM 16kHz' : 'STREAM IDLE'}
        </span>
        <span>TRANSIENT BUFFER</span>
      </div>
    </div>
  );
}
