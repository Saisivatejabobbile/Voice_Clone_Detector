import { getInitials } from '../../utils/format';

// Deterministic high-contrast color palettes for avatars (cybersecurity aesthetic)
const AVATAR_PALETTES = [
  'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700/70',
  'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-700/70',
  'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-700/70',
  'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/70',
  'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-700/70',
  'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
];

function getPaletteForName(name = '') {
  let hash = 0;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// Reusable Avatar Component
export default function Avatar({ 
  name = '', 
  src, 
  size = 'md', 
  status,
  className = '',
  ...props 
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };
  
  const statusColors = {
    online: 'bg-[#10B981]',
    offline: 'bg-[#94A3B8]',
    busy: 'bg-[#EF4444]',
  };

  const palette = getPaletteForName(name);
  const initials = getInitials(name);
  
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizes[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full border flex items-center justify-center font-bold tracking-tight select-none shadow-2xs ${palette}`}>
          {initials}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0F1D32] ${statusColors[status] || statusColors.offline}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
