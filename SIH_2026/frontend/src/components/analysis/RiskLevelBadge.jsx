import { RISK_LEVELS, RISK_COLORS, RISK_MESSAGES } from '../../constants';

// Risk Level Badge Component
export default function RiskLevelBadge({ riskLevel, size = 'md' }) {
  if (!riskLevel || !RISK_LEVELS[riskLevel]) {
    return null;
  }

  const colors = RISK_COLORS[riskLevel];
  const message = RISK_MESSAGES[riskLevel];

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${colors.bg} ${colors.text} border ${colors.border} ${sizeClasses[size]}`}
    >
      <span className="text-lg">{message.icon}</span>
      <span>{riskLevel} RISK</span>
    </div>
  );
}
