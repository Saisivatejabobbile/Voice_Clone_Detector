// Reusable Input Component
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
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={`w-full px-4 py-2 ${icon ? 'pl-10' : ''} bg-dark-900 border ${
            error ? 'border-danger' : 'border-dark-700'
          } rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-danger' : 'focus:ring-primary-600'
          } focus:border-transparent transition-all ${className}`}
          {...props}
        />
      </div>
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}

// Textarea Component
export function Textarea({ 
  label, 
  error, 
  helper,
  rows = 4,
  className = '',
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        rows={rows}
        className={`w-full px-4 py-2 bg-dark-900 border ${
          error ? 'border-danger' : 'border-dark-700'
        } rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-danger' : 'focus:ring-primary-600'
        } focus:border-transparent transition-all resize-none ${className}`}
        {...props}
      />
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
