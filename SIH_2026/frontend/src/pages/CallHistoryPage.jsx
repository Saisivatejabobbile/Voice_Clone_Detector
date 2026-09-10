import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { CallHistoryList } from '../components/history';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { RiskStatusCard } from '../components/analysis';
import { formatDate, formatTime, formatDuration } from '../utils/format';
import Avatar from '../components/common/Avatar';
import { useCallHistory } from '../hooks/useCallHistory';

export default function CallHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  
  const { calls: mockCallHistory, loading: isLoading, error } = useCallHistory();

  console.log('[CallHistoryPage] mockCallHistory:', mockCallHistory, 'length:', mockCallHistory?.length);

  // Filter calls based on search query only
  const filteredCalls = useMemo(() => {
    let filtered = mockCallHistory;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (call) =>
          call.contact_name?.toLowerCase().includes(query) ||
          call.contact_email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [mockCallHistory, searchQuery]);

  const handleCallClick = (call) => {
    setSelectedCall(call);
  };

  const handleCloseModal = () => {
    setSelectedCall(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
            <p className="text-gray-400">
              View and analyze your past calls
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Found {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Call History List */}
        <CallHistoryList
          calls={filteredCalls}
          isLoading={isLoading}
          onCallClick={handleCallClick}
        />

        {/* Call Detail Modal */}
        {selectedCall && (
          <Modal
            isOpen={!!selectedCall}
            onClose={handleCloseModal}
            title="Call Details"
          >
            <div className="space-y-4">
              {/* Caller Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-dark-700">
                <Avatar name={selectedCall.contact_name || 'Unknown'} size="xl" />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedCall.contact_name || 'Unknown Caller'}
                  </h3>
                  <p className="text-gray-400">{selectedCall.contact_email}</p>
                </div>
              </div>

              {/* Call Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Date</p>
                  <p className="text-white font-medium">{formatDate(selectedCall.started_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Time</p>
                  <p className="text-white font-medium">{formatTime(selectedCall.started_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Duration</p>
                  <p className="text-white font-medium">
                    {formatDuration(selectedCall.duration_seconds)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p className="text-white font-medium capitalize">{selectedCall.status}</p>
                </div>
              </div>

              {/* Risk Analysis (if available) */}
              {selectedCall.risk_level && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Voice Analysis</h4>
                  <RiskStatusCard
                    riskData={{
                      risk_level: selectedCall.risk_level,
                      risk_score: selectedCall.risk_score,
                      synthetic_confidence: selectedCall.synthetic_confidence,
                      model_confidence: selectedCall.model_confidence,
                      recommendation: selectedCall.recommendation,
                    }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-dark-700">
                <Button variant="secondary" onClick={handleCloseModal} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}