import { useEffect, useState } from 'react';

// Audio Waveform Animation Component - Vertical bars style
export default function WaveformAnimation({ isActive = true, bars = 30, color = 'primary' }) {
  const [heights, setHeights] = useState([]);

  // Color mapping
  const colorMap = {
    primary: 'bg-primary-500',
    success: 'bg-success-light',
    danger: 'bg-danger-light',
    warning: 'bg-warning-light',
  };

  const bgColor = colorMap[color] || colorMap.primary;

  useEffect(() => {
    if (!isActive) {
      // Set all bars to minimum height when inactive
      setHeights(Array(bars).fill(20));
      return;
    }

    // Animate bars with random heights
    const interval = setInterval(() => {
      const newHeights = Array.from({ length: bars }, () => 
        20 + Math.random() * 80
      );
      setHeights(newHeights);
    }, 150);

    return () => clearInterval(interval);
  }, [isActive, bars]);

  return (
    <div className="flex items-end justify-center gap-[3px] h-24 px-4">
      {Array.from({ length: bars }).map((_, index) => (
        <div
          key={index}
          className={`w-1 ${bgColor} rounded-t-sm transition-all duration-150 ease-out`}
          style={{
            height: `${heights[index] || 20}%`,
            opacity: isActive ? 0.8 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
