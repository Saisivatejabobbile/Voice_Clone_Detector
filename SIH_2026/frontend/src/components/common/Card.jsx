// Reusable Card Component
export default function Card({ 
  children, 
  hover = false, 
  className = '',
  onClick,
  ...props 
}) {
  const baseStyles = 'bg-dark-900 border border-dark-800 rounded-lg shadow-lg';
  const hoverStyles = hover ? 'transition-all duration-200 hover:shadow-glow hover:border-primary-600 cursor-pointer' : '';
  
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
    <div className={`px-6 py-4 border-b border-dark-800 ${className}`}>
      {children}
    </div>
  );
}

// Card Body
export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-dark-800 ${className}`}>
      {children}
    </div>
  );
}
