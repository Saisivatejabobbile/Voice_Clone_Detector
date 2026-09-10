import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { RiskLevelBadge } from '../analysis';
import { formatDate, formatTime, formatDuration } from '../../utils/format';

// Call History Card Component
export default function CallHistoryCard({ call, onClick }) {
  // Determine badge variant based on status
  const statusVariants = {
    completed: 'success',
    rejected: 'danger',
    failed: 'danger',
    ended: 'secondary',
  };

  const statusLabels = {
    completed: 'Completed',
    rejected: 'Rejected',
    failed: 'Failed',
    ended: 'Ended',
  };

  const variant = statusVariants[call.status] || 'secondary';
  const label = statusLabels[call.status] || call.status;

  return (
    <div
      onClick={() => onClick?.(call)}
      className="card p-4 hover:border-primary-600 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          name={call.contact_name || 'Unknown'}
          size="lg"
          className="flex-shrink-0"
        />

        {/* Call Details */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">
                {call.contact_name || 'Unknown Caller'}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {call.contact_email || 'No email'}
              </p>
            </div>

            {/* Risk Level Badge (if available) */}
            {call.risk_level && (
              <div className="ml-2 flex-shrink-0">
                <RiskLevelBadge riskLevel={call.risk_level} size="sm" />
              </div>
            )}
          </div>

          {/* Call Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDuration(call.duration_seconds || 0)}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(call.started_at)}</span>
            </div>

            <div>{formatTime(call.started_at)}</div>
          </div>

          {/* Status Badge and Risk Score */}
          <div className="flex items-center gap-2">
            <Badge variant={variant} size="sm">
              {label}
            </Badge>
            
            {call.risk_score !== undefined && (
              <span className="text-xs text-gray-500">
                Risk Score: <span className="text-gray-300 font-medium">{call.risk_score}%</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
