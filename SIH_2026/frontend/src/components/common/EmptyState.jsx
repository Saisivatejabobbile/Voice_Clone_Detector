// Enterprise Empty State Component
export default function EmptyState({ 
  icon, 
  title, 
  message, 
  action,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl shadow-sm ${className}`}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] mb-4 shadow-sm">
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className="text-base font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1.5">
          {title}
        </h3>
      )}
      
      {message && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6 max-w-sm leading-relaxed">
          {message}
        </p>
      )}
      
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  );
}
