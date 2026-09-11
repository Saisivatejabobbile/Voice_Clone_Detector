import { RISK_MESSAGES } from '../../constants';
import RiskLevelBadge from './RiskLevelBadge';
import Badge from '../common/Badge';
import { SearchIcon, BrainIcon } from '../../utils/icons';

// Enterprise Real-Time Risk Analysis Card
export default function RiskAnalysisCard({ riskData, isAnalyzing = false }) {
  if (!riskData && !isAnalyzing) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#64748B] dark:text-[#94A3B8] shadow-sm">
            <SearchIcon className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1">Awaiting Telemetry Stream</h4>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Analysis will initiate automatically upon speech detection.</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing && !riskData) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-[#00C2FF]/10 border border-[#00C2FF]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#00779E] dark:text-[#00C2FF] animate-pulse">
            <BrainIcon className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1">Analyzing Live Signal...</h4>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Sampling acoustic & prosodic characteristics in real-time.</p>
        </div>
      </div>
    );
  }

  const message = RISK_MESSAGES[riskData.risk_level] || RISK_MESSAGES.LOW;

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-[#F1F5F9]">
            Neural Voice Analysis
          </h3>
        </div>
        <Badge variant="success" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Real-Time
        </Badge>
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-center py-2">
        <RiskLevelBadge riskLevel={riskData.risk_level} size="lg" />
      </div>

      {/* Risk Message */}
      <div className="text-center space-y-1">
        <h4 className="text-lg font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">{message.title}</h4>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto leading-relaxed">{message.message || message.description}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Synthetic Probability */}
        <div className="bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Synthetic Prob.</span>
            <span className="font-mono font-bold text-base text-[#EF4444]">
              {riskData.synthetic_confidence ?? riskData.risk_score ?? 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#EF4444] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(riskData.synthetic_confidence ?? riskData.risk_score ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Model Confidence */}
        <div className="bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Confidence</span>
            <span className="font-mono font-bold text-base text-[#123C69] dark:text-[#00C2FF]">
              {riskData.model_confidence ?? 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#123C69] dark:bg-[#00C2FF] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(riskData.model_confidence ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl p-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-[#F1F5F9]">Impersonation Score</span>
          <span className="font-mono font-bold text-2xl text-[#0B1F3A] dark:text-[#F1F5F9]">
            {riskData.risk_score}<span className="text-sm text-[#64748B] dark:text-[#94A3B8]">/100</span>
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              riskData.risk_score >= 81
                ? 'bg-[#EF4444]'
                : riskData.risk_score >= 61
                ? 'bg-[#EF4444]/90'
                : riskData.risk_score >= 31
                ? 'bg-[#F59E0B]'
                : 'bg-[#10B981]'
            }`}
            style={{ width: `${Math.min(riskData.risk_score, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {riskData.recommendation && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
            Recommendation:
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">{riskData.recommendation}</p>
        </div>
      )}

      {/* Optional Indicators */}
      {(riskData.acoustic_indicators || riskData.prosody_indicators) && (
        <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] pt-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-[#F1F5F9]">Signal Metrics</p>
          
          {riskData.acoustic_indicators && (
            <div className="text-xs space-y-1">
              <p className="text-[#64748B] dark:text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Acoustic Indicators</p>
              {Object.entries(riskData.acoustic_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-[#94A3B8] capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-semibold text-[#0B1F3A] dark:text-[#F1F5F9]">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {riskData.prosody_indicators && (
            <div className="text-xs space-y-1">
              <p className="text-[#64748B] dark:text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Prosodic Indicators</p>
              {Object.entries(riskData.prosody_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-[#94A3B8] capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-semibold text-[#0B1F3A] dark:text-[#F1F5F9]">
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
