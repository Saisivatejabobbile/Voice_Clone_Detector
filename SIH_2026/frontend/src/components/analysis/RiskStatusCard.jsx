import { RISK_MESSAGES } from '../../constants';
import { CheckIcon, AlertIcon } from '../../utils/icons';

// Enterprise Risk Status Card
export default function RiskStatusCard({ riskData }) {
  if (!riskData) {
    return null;
  }

  const message = RISK_MESSAGES[riskData.risk_level] || RISK_MESSAGES.LOW;

  const colorStyles = {
    LOW: {
      border: 'border-emerald-200 dark:border-emerald-800/60',
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      text: 'text-emerald-800 dark:text-emerald-300',
      progressBar: 'bg-[#10B981]',
      scoreColor: 'text-[#10B981]',
      icon: <CheckIcon className="w-5 h-5 text-[#10B981]" />,
    },
    MEDIUM: {
      border: 'border-amber-200 dark:border-amber-800/60',
      bg: 'bg-amber-50/70 dark:bg-amber-950/20',
      text: 'text-amber-800 dark:text-amber-300',
      progressBar: 'bg-[#F59E0B]',
      scoreColor: 'text-[#F59E0B]',
      icon: <AlertIcon className="w-5 h-5 text-[#F59E0B]" />,
    },
    HIGH: {
      border: 'border-rose-200 dark:border-rose-800/60',
      bg: 'bg-rose-50/70 dark:bg-rose-950/20',
      text: 'text-rose-800 dark:text-rose-300',
      progressBar: 'bg-[#EF4444]',
      scoreColor: 'text-[#EF4444]',
      icon: <AlertIcon className="w-5 h-5 text-[#EF4444]" />,
    },
    CRITICAL: {
      border: 'border-red-300 dark:border-red-800/70',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-900 dark:text-red-200',
      progressBar: 'bg-[#EF4444]',
      scoreColor: 'text-[#EF4444]',
      icon: <AlertIcon className="w-5 h-5 text-[#EF4444]" />,
    },
  };

  const styles = colorStyles[riskData.risk_level] || colorStyles.LOW;

  return (
    <div className={`border ${styles.border} ${styles.bg} rounded-xl p-5 shadow-sm`}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-center shadow-xs">
          {styles.icon}
        </div>
        <div>
          <h3 className={`font-bold text-sm tracking-wide uppercase ${styles.text}`}>
            {message.title || `${riskData.risk_level} Risk`}
          </h3>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-2">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Risk Score</span>
          <span className={`font-mono font-bold text-2xl ${styles.scoreColor}`}>
            {riskData.risk_score}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/80 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-full overflow-hidden">
          <div
            className={`h-full ${styles.progressBar} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(riskData.risk_score, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommendation Message */}
      <p className="text-xs text-[#0F172A] dark:text-[#F1F5F9] mt-3 font-medium leading-relaxed bg-white/70 dark:bg-[#0F1D32]/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-[#1E3A5F]">
        {riskData.recommendation || message.message || message.description}
      </p>
    </div>
  );
}
