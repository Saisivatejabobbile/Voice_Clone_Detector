// Loading Spinner Component
export default function Loading({ size = 'md', text, className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-4 border-dark-700 border-t-primary-600 rounded-full animate-spin`} />
      {text && <p className="mt-4 text-gray-400">{text}</p>}
    </div>
  );
}

// Full Page Loading
export function FullPageLoading({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

// Inline Loading
export function InlineLoading({ text }) {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <div className="w-4 h-4 border-2 border-dark-700 border-t-primary-600 rounded-full animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
