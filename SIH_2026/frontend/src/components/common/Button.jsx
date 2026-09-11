// Reusable Enterprise Button Component
export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C2FF] disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const variants = {
    // Primary Navy
    primary: 'bg-[#0B1F3A] hover:bg-[#123C69] text-white shadow-sm active:bg-[#071527] dark:bg-[#123C69] dark:hover:bg-[#1A4D85] dark:border dark:border-[#1E3A5F]',
    
    // Secondary Enterprise Light / Dark Slate
    secondary: 'bg-white hover:bg-slate-50 text-[#0B1F3A] border border-[#CBD5E1] shadow-sm active:bg-slate-100 dark:bg-[#12233C] dark:hover:bg-[#162C4E] dark:text-[#F1F5F9] dark:border-[#1E3A5F]',
    
    // AI Action - Electric Cyan
    ai: 'bg-[#00C2FF] hover:bg-[#00AEE6] text-[#0B1F3A] font-bold shadow-sm active:bg-[#009ACB]',
    
    // Semantic Actions
    success: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm',
    warning: 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-sm',
    
    // Subtle Outlines / Ghosts
    outline: 'border border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A]/5 dark:border-[#00C2FF] dark:text-[#00C2FF] dark:hover:bg-[#00C2FF]/10',
    ghost: 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-[#162C4E]',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs tracking-wide',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
