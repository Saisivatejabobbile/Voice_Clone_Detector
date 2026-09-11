import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { RiskLevelBadge } from '../analysis';
import { formatDate, formatTime, formatDuration } from '../../utils/format';

// Enterprise Call History Card Component
export default function CallHistoryCard({ call, onClick }) {
  const statusVariants = {
    completed: 'success',
    rejected: 'danger',
    failed: 'danger',
    ended: 'secondary',
  };

  const statusLabels = {
    completed: 'Completed',
    rejected: 'Declined',
    failed: 'Failed',
    ended: 'Terminated',
  };

  const variant = statusVariants[call.status] || 'secondary';
  const label = statusLabels[call.status] || call.status;

  return (
    <div
      onClick={() => onClick?.(call)}
      className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 sm:p-5 hover:border-[#00C2FF]/60 dark:hover:border-[#00C2FF]/60 hover:shadow-sm cursor-pointer transition-all text-[#0F172A] dark:text-[#F1F5F9]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          name={call.contact_name || 'Caller'}
          size="lg"
          className="flex-shrink-0 ring-2 ring-[#0B1F3A]/5 dark:ring-white/10"
        />

        {/* Call Details */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] truncate">
                {call.contact_name || 'Unknown Participant'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate font-mono">
                {call.contact_email || 'No email record'}
              </p>
            </div>

            {/* Risk Level Badge */}
            {call.risk_level && (
              <div className="ml-2 flex-shrink-0">
                <RiskLevelBadge riskLevel={call.risk_level} size="sm" />
              </div>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] dark:text-[#94A3B8] mb-2.5">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono">{formatDuration(call.duration_seconds || 0)}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(call.started_at)}</span>
            </div>

            <span className="font-mono text-[11px] text-[#94A3B8] dark:text-[#64748B]">
              {formatTime(call.started_at)}
            </span>
          </div>

          {/* Status Badge & Risk Metric */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
            <Badge variant={variant} size="sm">
              {label}
            </Badge>
            
            {call.risk_score !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider text-[10px] font-bold">Impersonation Score:</span>
                <span className={`font-mono font-bold ${
                  call.risk_score >= 70 ? 'text-[#EF4444]' :
                  call.risk_score >= 35 ? 'text-[#F59E0B]' :
                  'text-[#10B981]'
                }`}>
                  {call.risk_score}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
