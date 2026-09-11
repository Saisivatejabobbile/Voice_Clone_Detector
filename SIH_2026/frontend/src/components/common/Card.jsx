// Reusable Enterprise Card Component
export default function Card({ 
  children, 
  hover = false, 
  className = '',
  onClick,
  ...props 
}) {
  const baseStyles = 'bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] rounded-xl shadow-sm overflow-hidden transition-colors duration-200';
  const hoverStyles = hover 
    ? 'transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] dark:hover:border-[#00C2FF]/60 cursor-pointer' 
    : '';
  
  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F] bg-white dark:bg-[#0F1D32] text-[#0F172A] dark:text-[#F1F5F9] ${className}`}>
      {children}
    </div>
  );
}

// Card Body
export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 text-[#0F172A] dark:text-[#F1F5F9] ${className}`}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F] bg-slate-50/50 dark:bg-[#0B1524]/60 ${className}`}>
      {children}
    </div>
  );
}
