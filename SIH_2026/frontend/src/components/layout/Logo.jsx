import { Link } from 'react-router-dom';

// VoiceShield Logo Component - Enterprise Cybersecurity & Voice Integrity
export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  
  return (
    <Link to="/" className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Enterprise Security Shield with Voice Waveform */}
      <div className={`${sizes[size]} relative flex items-center justify-center flex-shrink-0`}>
        <svg viewBox="0 0 36 36" fill="none" className="w-full h-full drop-shadow-sm">
          {/* Outer Shield Shell */}
          <path 
            d="M18 2L5 7.5V17C5 25.5 10.5 32.5 18 34C25.5 32.5 31 25.5 31 17V7.5L18 2Z" 
            className="fill-[#0B1F3A] dark:fill-[#0F2744] stroke-[#123C69] dark:stroke-[#00C2FF]/50 stroke-2 transition-colors"
          />
          {/* Inner Security Core */}
          <path 
            d="M18 6L8.5 10.2V16.8C8.5 22.8 12.5 28 18 29.5C23.5 28 27.5 22.8 27.5 16.8V10.2L18 6Z" 
            className="fill-[#123C69]/60 dark:fill-[#123C69]/40"
          />
          {/* Electric Cyan Audio Wave Integrity Lines */}
          <line x1="12" y1="18" x2="12" y2="20" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="15" x2="15" y2="23" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="13" x2="18" y2="25" stroke="#00C2FF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="21" y1="15" x2="21" y2="23" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="18" x2="24" y2="20" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-bold text-[#0B1F3A] dark:text-white tracking-tight ${textSizes[size]}`}>
              Voice<span className="text-[#123C69] dark:text-[#00C2FF]">Shield</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00C2FF]/15 text-[#008BB8] dark:text-[#38BDF8] border border-[#00C2FF]/30">
              AI
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] tracking-wider uppercase font-medium mt-0.5">
            Voice Integrity
          </span>
        </div>
      )}
    </Link>
  );
}
