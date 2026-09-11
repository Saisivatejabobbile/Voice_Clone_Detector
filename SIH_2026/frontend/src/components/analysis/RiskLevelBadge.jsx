import { RISK_LEVELS } from '../../constants';

// Enterprise Risk Level Badge Component
export default function RiskLevelBadge({ riskLevel = 'LOW', size = 'md' }) {
  if (!riskLevel) {
    return null;
  }

  const level = String(riskLevel).toUpperCase();

  const configs = {
    LOW: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-[#10B981]',
      label: 'SAFE'
    },
    MEDIUM: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      dot: 'bg-[#F59E0B]',
      label: 'SUSPICIOUS'
    },
    HIGH: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      dot: 'bg-[#EF4444]',
      label: 'HIGH RISK'
    },
    CRITICAL: {
      bg: 'bg-red-100 dark:bg-red-950/50 text-red-900 dark:text-red-200 border-red-300 dark:border-red-800/70',
      dot: 'bg-[#EF4444]',
      label: 'CRITICAL'
    },
  };

  const config = configs[level] || configs.LOW;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border tracking-wide uppercase ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
