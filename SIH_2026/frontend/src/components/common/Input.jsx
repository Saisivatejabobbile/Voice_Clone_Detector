// Reusable Enterprise Input Component
export default function Input({ 
  label, 
  error, 
  helper, 
  icon, 
  type = 'text', 
  className = '', 
  ...props 
}) {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] dark:text-slate-200 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={`w-full px-3.5 py-2.5 ${icon ? 'pl-10' : ''} bg-white dark:bg-[#0B1524] border ${
            error ? 'border-[#EF4444]' : 'border-[#CBD5E1] dark:border-[#1E3A5F]'
          } rounded-lg text-[#0F172A] dark:text-[#F1F5F9] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all ${className}`}
          {...props}
        />
      </div>
      
      {helper && !error && (
        <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">{helper}</p>
      )}
      
      {error && (
        <p className="mt-1.5 text-xs text-[#EF4444] dark:text-red-400 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// Enterprise Textarea Component
export function Textarea({ 
  label, 
  error, 
  helper, 
  rows = 4, 
  className = '', 
  ...props 
}) {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] dark:text-slate-200 mb-1.5">
          {label}
        </label>
      )}
      
      <textarea
        rows={rows}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-[#0B1524] border ${
          error ? 'border-[#EF4444]' : 'border-[#CBD5E1] dark:border-[#1E3A5F]'
        } rounded-lg text-[#0F172A] dark:text-[#F1F5F9] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all resize-none ${className}`}
        {...props}
      />
      
      {helper && !error && (
        <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">{helper}</p>
      )}
      
      {error && (
        <p className="mt-1.5 text-xs text-[#EF4444] dark:text-red-400 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
