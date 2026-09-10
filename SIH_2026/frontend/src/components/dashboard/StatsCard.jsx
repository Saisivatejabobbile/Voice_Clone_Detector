// Stats Card Component for Dashboard
export default function StatsCard({ icon, label, value, color = 'primary', trend }) {
  const colorClasses = {
    primary: 'from-primary-600 to-primary-800',
    success: 'from-success to-success-dark',
    warning: 'from-warning to-warning-dark',
    danger: 'from-danger to-danger-dark',
    info: 'from-blue-600 to-blue-800',
  };

  return (
    <div className="card p-6 card-hover">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.positive ? 'text-success-light' : 'text-danger-light'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
        
        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-glow-sm`}>
          {typeof icon === 'string' ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            <div className="text-white">{icon}</div>
          )}
        </div>
      </div>
    </div>
  );
}
