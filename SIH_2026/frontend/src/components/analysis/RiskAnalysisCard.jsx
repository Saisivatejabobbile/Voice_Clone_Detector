import { RISK_MESSAGES } from '../../constants';
import RiskLevelBadge from './RiskLevelBadge';
import Badge from '../common/Badge';
import { SearchIcon, BrainIcon } from '../../utils/icons';

// Real-time Risk Analysis Card
export default function RiskAnalysisCard({ riskData, isAnalyzing = false }) {
  if (!riskData && !isAnalyzing) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400">Waiting for analysis to begin...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing && !riskData) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BrainIcon className="w-8 h-8 text-primary-400" />
          </div>
          <p className="text-white font-medium mb-2">Analyzing Voice...</p>
          <p className="text-gray-400 text-sm">Processing audio patterns</p>
        </div>
      </div>
    );
  }

  const message = RISK_MESSAGES[riskData.risk_level] || RISK_MESSAGES.LOW;

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Voice Analysis</h3>
        <Badge variant="success" className="animate-pulse">
          <div className="w-2 h-2 bg-success-light rounded-full mr-2" />
          Live
        </Badge>
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-center py-4">
        <RiskLevelBadge riskLevel={riskData.risk_level} size="lg" />
      </div>

      {/* Risk Message */}
      <div className="text-center space-y-2">
        <h4 className="text-xl font-bold text-white">{message.title}</h4>
        <p className="text-gray-400">{message.message}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Synthetic Confidence */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Synthetic</span>
            <span className="text-white font-bold text-xl">
              {riskData.synthetic_confidence}%
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-danger h-2 rounded-full transition-all duration-500"
              style={{ width: `${riskData.synthetic_confidence}%` }}
            />
          </div>
        </div>

        {/* Model Confidence */}
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Confidence</span>
            <span className="text-white font-bold text-xl">
              {riskData.model_confidence}%
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${riskData.model_confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-dark-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Overall Risk Score</span>
          <span className="text-white font-bold text-2xl">
            {riskData.risk_score}/100
          </span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              riskData.risk_score >= 70
                ? 'bg-danger'
                : riskData.risk_score >= 40
                ? 'bg-warning'
                : 'bg-success'
            }`}
            style={{ width: `${riskData.risk_score}%` }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {riskData.recommendation && (
        <div className="border-t border-dark-700 pt-4">
          <p className="text-sm text-gray-400 mb-2">
            <span className="font-semibold text-white">Recommendation:</span>
          </p>
          <p className="text-sm text-gray-300">{riskData.recommendation}</p>
        </div>
      )}

      {/* Optional Indicators */}
      {(riskData.acoustic_indicators || riskData.prosody_indicators) && (
        <div className="border-t border-dark-700 pt-4 space-y-3">
          <p className="text-sm font-semibold text-white">Technical Indicators:</p>
          
          {riskData.acoustic_indicators && (
            <div className="text-xs space-y-1">
              <p className="text-gray-500 uppercase tracking-wide">Acoustic</p>
              {Object.entries(riskData.acoustic_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-300">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {riskData.prosody_indicators && (
            <div className="text-xs space-y-1">
              <p className="text-gray-500 uppercase tracking-wide">Prosody</p>
              {Object.entries(riskData.prosody_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-300">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
