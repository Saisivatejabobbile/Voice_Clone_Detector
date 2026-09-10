// Empty State Component
export default function EmptyState({ 
  icon, 
  title, 
  message, 
  action,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="text-6xl mb-4 text-dark-700">
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          {title}
        </h3>
      )}
      
      {message && (
        <p className="text-gray-500 mb-6 max-w-md">
          {message}
        </p>
      )}
      
      {action}
    </div>
  );
}
