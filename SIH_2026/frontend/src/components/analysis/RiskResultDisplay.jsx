import { RISK_MESSAGES, RISK_COLORS } from '../../constants';
import RiskLevelBadge from './RiskLevelBadge';
import Button from '../common/Button';
import { CheckIcon, AlertIcon, ExclamationIcon } from '../../utils/icons';

// Full-page Risk Result Display Component
export default function RiskResultDisplay({ riskData, onDismiss, onEndCall }) {
  if (!riskData) return null;

  const message = RISK_MESSAGES[riskData.risk_level] || RISK_MESSAGES.LOW;
  const colors = RISK_COLORS[riskData.risk_level];

  // Icon mapping for risk levels
  const iconMap = {
    LOW: <CheckIcon className="w-16 h-16" />,
    MEDIUM: <AlertIcon className="w-16 h-16" />,
    HIGH: <ExclamationIcon className="w-16 h-16" />,
  };

  const icon = iconMap[riskData.risk_level] || iconMap.LOW;
  const smallIcon = {
    LOW: <CheckIcon className="w-6 h-6" />,
    MEDIUM: <AlertIcon className="w-6 h-6" />,
    HIGH: <ExclamationIcon className="w-6 h-6" />,
  }[riskData.risk_level] || iconMap.LOW;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-2xl w-full mx-4 space-y-6">
        {/* Large Icon */}
        <div className="flex justify-center">
          <div
            className={`w-32 h-32 rounded-full ${colors.bg} ${colors.border} border-4 flex items-center justify-center animate-bounce-slow`}
          >
            <div className={colors.text}>{icon}</div>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex justify-center">
          <RiskLevelBadge riskLevel={riskData.risk_level} size="lg" />
        </div>

        {/* Title and Message */}
        <div className="text-center space-y-3">
          <h1 className={`text-4xl font-bold ${colors.text}`}>
            {message.title}
          </h1>
          <p className="text-xl text-gray-300">{message.message}</p>
        </div>

        {/* Metrics Card */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white text-center mb-4">
            Analysis Results
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Synthetic Confidence */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                {riskData.synthetic_confidence}%
              </div>
              <div className="text-sm text-gray-400">Synthetic</div>
            </div>

            {/* Risk Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                {riskData.risk_score}
              </div>
              <div className="text-sm text-gray-400">Risk Score</div>
            </div>

            {/* Model Confidence */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400 mb-1">
                {riskData.model_confidence}%
              </div>
              <div className="text-sm text-gray-400">Confidence</div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 mt-1`}>
              <div className={colors.text}>{smallIcon}</div>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">Recommendation:</p>
              <p className="text-gray-300">{riskData.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={onDismiss}
            className="flex-1"
          >
            Continue Call
          </Button>
          {riskData.risk_level === 'HIGH' && (
            <Button
              variant="danger"
              size="lg"
              onClick={onEndCall}
              className="flex-1"
            >
              End Call Now
            </Button>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm">
          Press ESC to dismiss
        </p>
      </div>
    </div>
  );
}
