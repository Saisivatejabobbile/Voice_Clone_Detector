// Reusable Enterprise Badge Component
export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-semibold rounded-full border';
  
  const variants = {
    primary: 'bg-[#0B1F3A]/5 text-[#0B1F3A] border-[#0B1F3A]/15 dark:bg-[#00C2FF]/15 dark:text-[#38BDF8] dark:border-[#00C2FF]/30',
    secondary: 'bg-slate-100 text-[#475569] border-[#E2E8F0] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    ai: 'bg-[#00C2FF]/10 text-[#00779E] border-[#00C2FF]/30 dark:bg-[#00C2FF]/20 dark:text-[#38BDF8] dark:border-[#00C2FF]/40',
    info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    gray: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  return (
    <span 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Status Badge with Dot
export function StatusBadge({ status, showText = true, className = '' }) {
  const statusConfig = {
    online: { dot: 'bg-[#10B981]', text: 'Online', textColor: 'text-emerald-700 dark:text-emerald-400' },
    offline: { dot: 'bg-slate-400', text: 'Offline', textColor: 'text-slate-500 dark:text-slate-400' },
    busy: { dot: 'bg-[#EF4444]', text: 'Busy', textColor: 'text-rose-700 dark:text-rose-400' },
    in_call: { dot: 'bg-[#00C2FF] animate-pulse', text: 'In Call', textColor: 'text-[#00779E] dark:text-[#38BDF8]' },
  };
  
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {showText && <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>}
    </div>
  );
}
