import { RISK_MESSAGES } from '../../constants';
import { CheckIcon, AlertIcon } from '../../utils/icons';

// Compact Risk Status Card (matches reference design)
export default function RiskStatusCard({ riskData }) {
  if (!riskData) {
    return null;
  }

  const message = RISK_MESSAGES[riskData.risk_level] || RISK_MESSAGES.LOW;

  // Icon mapping for each risk level
  const iconMap = {
    LOW: <CheckIcon className="w-5 h-5" />,
    MEDIUM: <AlertIcon className="w-5 h-5" />,
    HIGH: <AlertIcon className="w-5 h-5" />,
  };

  // Color mapping for each risk level
  const colorStyles = {
    LOW: {
      border: 'border-success-light',
      bg: 'bg-success-dark/10',
      text: 'text-success-light',
      progressBg: 'bg-success-dark/30',
      progressBar: 'bg-success-light',
      icon: iconMap.LOW,
    },
    MEDIUM: {
      border: 'border-warning-light',
      bg: 'bg-warning-dark/10',
      text: 'text-warning-light',
      progressBg: 'bg-warning-dark/30',
      progressBar: 'bg-warning-light',
      icon: iconMap.MEDIUM,
    },
    HIGH: {
      border: 'border-danger-light',
      bg: 'bg-danger-dark/10',
      text: 'text-danger-light',
      progressBg: 'bg-danger-dark/30',
      progressBar: 'bg-danger-light',
      icon: iconMap.HIGH,
    },
  };

  const styles = colorStyles[riskData.risk_level] || colorStyles.LOW;

  return (
    <div className={`border-2 ${styles.border} ${styles.bg} rounded-xl p-4`}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full ${styles.bg} flex items-center justify-center`}>
          {styles.icon}
        </div>
        <h3 className={`font-bold text-lg ${styles.text}`}>
          {message.title}
        </h3>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Risk Score</span>
          <span className={`font-bold text-xl ${styles.text}`}>
            {riskData.risk_score}%
          </span>
        </div>
        <div className={`w-full h-2 ${styles.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${styles.progressBar} transition-all duration-500 ease-out`}
            style={{ width: `${riskData.risk_score}%` }}
          />
        </div>
      </div>

      {/* Message */}
      <p className="text-gray-300 text-sm mt-3">
        {riskData.recommendation || message.message}
      </p>
    </div>
  );
}
