import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { CallHistoryList } from '../components/history';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { RiskStatusCard } from '../components/analysis';
import { formatDate, formatTime, formatDuration } from '../utils/format';
import Avatar from '../components/common/Avatar';
import { useCallHistory } from '../hooks/useCallHistory';

// Enterprise Forensic Call History & Audit Log Page
export default function CallHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  
  const { calls: mockCallHistory = [], loading: isLoading } = useCallHistory();

  const filteredCalls = useMemo(() => {
    let filtered = mockCallHistory;

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white tracking-tight">
              Forensic Call Audit Logs
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Inspect historical call sessions, synthetic speech scores, and model recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-3 py-1 bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg text-[#0B1F3A] dark:text-slate-200 shadow-2xs">
              {mockCallHistory.length} Sessions Logged
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 shadow-xs transition-colors">
          <Input
            type="text"
            placeholder="Search audit records by participant name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] px-1">
            <p>
              Displaying <span className="font-bold text-[#0B1F3A] dark:text-white">{filteredCalls.length}</span> matching record{filteredCalls.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#008BB8] dark:text-[#38BDF8] hover:underline font-semibold"
            >
              Reset search
            </button>
          </div>
        )}

        {/* Call History List */}
        <CallHistoryList
          calls={filteredCalls}
          isLoading={isLoading}
          onCallClick={handleCallClick}
        />

        {/* Detailed Forensic Modal */}
        {selectedCall && (
          <Modal
            isOpen={!!selectedCall}
            onClose={handleCloseModal}
            title="Forensic Session Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Caller Summary Banner */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl transition-colors">
                <Avatar name={selectedCall.contact_name || 'Caller'} size="xl" className="ring-2 ring-white dark:ring-[#1E3A5F] shadow-xs" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white truncate">
                    {selectedCall.contact_name || 'Unknown Participant'}
                  </h3>
                  <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] truncate">{selectedCall.contact_email || 'No email associated'}</p>
                </div>
              </div>

              {/* Metadata Table in IBM Plex Mono */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#0B1524] border border-[#E2E8F0] dark:border-[#1E3A5F] p-4 rounded-xl text-xs transition-colors">
                <div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase text-[10px] tracking-wider mb-1">Session Date</p>
                  <p className="font-mono font-medium text-[#0B1F3A] dark:text-slate-200">{formatDate(selectedCall.started_at)}</p>
                </div>
                <div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase text-[10px] tracking-wider mb-1">Session Time</p>
                  <p className="font-mono font-medium text-[#0B1F3A] dark:text-slate-200">{formatTime(selectedCall.started_at)}</p>
                </div>
                <div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase text-[10px] tracking-wider mb-1">Duration</p>
                  <p className="font-mono font-bold text-[#0B1F3A] dark:text-[#00C2FF]">
                    {formatDuration(selectedCall.duration_seconds || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase text-[10px] tracking-wider mb-1">Termination</p>
                  <p className="font-semibold text-[#0B1F3A] dark:text-slate-200 capitalize">{selectedCall.status}</p>
                </div>
              </div>

              {/* Risk Analysis Card - Strictly on receiver side (incoming calls) */}
              {selectedCall.direction !== 'outgoing' && selectedCall.risk_level && (
                <div>
                  <h4 className="text-xs font-bold text-[#0B1F3A] dark:text-white uppercase tracking-wider mb-2.5">
                    Impersonation & Voice Integrity Analysis
                  </h4>
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

              {/* Outgoing Call Note for Caller */}
              {selectedCall.direction === 'outgoing' && (
                <div className="p-4 bg-slate-50 dark:bg-[#12233C] border border-slate-200 dark:border-[#1E3A5F] rounded-xl text-center">
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Outgoing Call Session • AI voice clone inspection is performed exclusively on the receiver's terminal.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#12233C] hover:bg-slate-200 dark:hover:bg-[#1A3355] text-[#0B1F3A] dark:text-[#F1F5F9] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                >
                  Close Audit Record
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}