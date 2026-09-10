import CallHistoryCard from './CallHistoryCard';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { PhoneIcon } from '../../utils/icons';

// Call History List Component
export default function CallHistoryList({ calls, isLoading, onCallClick }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!calls || calls.length === 0) {
    return (
      <EmptyState
        icon={<PhoneIcon className="w-16 h-16 text-gray-600" />}
        title="No call history"
        message="Your call history will appear here once you make your first call"
      />
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <CallHistoryCard
          key={call.id}
          call={call}
          onClick={onCallClick}
        />
      ))}
    </div>
  );
}
