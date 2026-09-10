import { getInitials } from '../../utils/format';

// Reusable Avatar Component
export default function Avatar({ 
  name, 
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
    online: 'bg-success-light',
    offline: 'bg-gray-500',
    busy: 'bg-danger-light',
  };
  
  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-primary-600 flex items-center justify-center font-semibold text-white`}>
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-950 ${statusColors[status]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
