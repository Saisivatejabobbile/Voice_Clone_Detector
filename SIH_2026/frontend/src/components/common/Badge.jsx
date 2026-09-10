// Reusable Badge Component
export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    primary: 'bg-primary-900/30 text-primary-400',
    success: 'bg-success-dark/20 text-success-light',
    warning: 'bg-warning-dark/20 text-warning-light',
    danger: 'bg-danger-dark/20 text-danger-light',
    info: 'bg-blue-900/30 text-blue-400',
    gray: 'bg-gray-800 text-gray-300',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Status Badge with Dot
export function StatusBadge({ status, showText = true, className = '' }) {
  const statusConfig = {
    online: { color: 'bg-success-light', text: 'Online' },
    offline: { color: 'bg-gray-500', text: 'Offline' },
    busy: { color: 'bg-danger-light', text: 'Busy' },
    in_call: { color: 'bg-warning-light', text: 'In Call' },
  };
  
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {showText && <span className="text-sm text-gray-400">{config.text}</span>}
    </div>
  );
}
