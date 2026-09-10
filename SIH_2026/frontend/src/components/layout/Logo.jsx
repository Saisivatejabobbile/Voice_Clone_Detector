import { Link } from 'react-router-dom';

// VoiceShield Logo Component
export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      {/* Shield Icon */}
      <div className={`${sizes[size]} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path 
            d="M12 2L4 6V12C4 17.5 7.5 22.25 12 23C16.5 22.25 20 17.5 20 12V6L12 2Z" 
            className="fill-primary-600"
          />
          <path 
            d="M12 7L9 9.5V13C9 15 10.5 16.75 12 17C13.5 16.75 15 15 15 13V9.5L12 7Z" 
            className="fill-primary-400"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold text-gradient ${textSizes[size]}`}>
          VoiceShield
        </span>
      )}
    </Link>
  );
}
