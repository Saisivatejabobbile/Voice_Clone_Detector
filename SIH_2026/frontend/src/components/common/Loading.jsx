// Enterprise Loading Spinner Component
export default function Loading({ size = 'md', text, className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-slate-200 dark:border-slate-800 border-t-[#00C2FF] rounded-full animate-spin`} />
      {text && <p className="mt-3 text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">{text}</p>}
    </div>
  );
}

// Full Page Loading
export function FullPageLoading({ text = 'Loading system security telemetry...' }) {
  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

// Inline Loading
export function InlineLoading({ text }) {
  return (
    <div className="inline-flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
      <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-800 border-t-[#00C2FF] rounded-full animate-spin" />
      {text && <span className="text-xs font-medium">{text}</span>}
    </div>
  );
}
