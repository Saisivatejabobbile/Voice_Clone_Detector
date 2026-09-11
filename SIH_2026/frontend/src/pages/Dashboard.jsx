import { useAuth } from '../context/AuthContext';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall.jsx';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import SecurityStatusCard from '../components/dashboard/SecurityStatusCard';
import { IS_MOCK_MODE } from '../constants';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { PhoneIcon, UsersIcon, ChartIcon, LockIcon, MaskIcon, ShieldIcon } from '../utils/icons';

// Enterprise VoiceShield Dashboard
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // WebRTC Integration with SimplePeer
  const {
    callState,
    incomingCall,
    isConnected,
    acceptCall,
    rejectCall,
    formatDuration,
    simulateIncomingCall,
  } = useSharedSimplePeerCall();
  
  const firstName = user?.full_name?.split(' ')[0] || 'Operator';
  
  const stats = {
    activeCalls: callState === 'connected' ? 1 : 0,
    contactsOnline: isConnected ? 1 : 0,
    threatsBlocked: 0,
  };

  const handleTestIncomingCall = () => {
    simulateIncomingCall();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Heading & Security Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white tracking-tight">
              Security Operations Center
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Welcome back, <span className="font-semibold text-[#0B1F3A] dark:text-[#00C2FF]">{firstName}</span>. Real-time voice integrity monitoring is actively armed.
            </p>
          </div>

          {/* WebRTC Live Telemetry Pill */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 shadow-2xs ${
              isConnected 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
              <span>{isConnected ? 'WebRTC Signal Gateway Connected' : 'Connecting to Gateway...'}</span>
            </div>
          </div>
        </div>

        {/* Active Call In-Progress Callout */}
        {callState === 'calling' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Outgoing Call Initialized...</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Waiting for remote participant response and signaling verification</p>
              </div>
            </div>
          </div>
        )}

        {callState === 'connected' && (
          <div className="p-4 bg-[#0B1F3A] dark:bg-[#0F1D32] border border-transparent dark:border-[#1E3A5F] text-white rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <div>
                <p className="text-sm font-bold">Secure Call In Session</p>
                <p className="text-xs text-slate-300">Live AI AudioWorklet stream analyzing incoming speech packets</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-bold text-[#00C2FF]">{formatDuration()}</span>
              <button
                onClick={() => navigate(`/call/${user?.id || 'session'}`)}
                className="px-3 py-1 text-xs font-bold bg-[#00C2FF] text-[#0B1F3A] rounded-lg hover:bg-[#00AEE6] transition-colors"
              >
                Open Console
              </button>
            </div>
          </div>
        )}

        {IS_MOCK_MODE && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3">
            <MaskIcon className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">Simulation Mode Active</p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You are currently running in synthetic demo mode. Connect to the backend to enable live model weights.
              </p>
            </div>
          </div>
        )}

        {/* Security Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          <StatsCard
            icon={<PhoneIcon className="w-5 h-5" />}
            label="Active Voice Sessions"
            value={stats.activeCalls}
            color="primary"
          />
          <StatsCard
            icon={<UsersIcon className="w-5 h-5" />}
            label="Verified Personnel Online"
            value={stats.contactsOnline}
            color="success"
          />
          <StatsCard
            icon={<ShieldIcon className="w-5 h-5" />}
            label="Impersonation Threats Blocked"
            value={stats.threatsBlocked}
            color="danger"
          />
        </div>

        {/* Operational Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SecurityStatusCard status="protected" />
          
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-6 shadow-sm transition-colors">
            <h2 className="text-base font-bold text-[#0B1F3A] dark:text-white mb-1">Operational Actions</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">Quickly simulate incoming voice streams or inspect verified directories.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleTestIncomingCall}
                className="w-full p-3.5 bg-slate-50 dark:bg-[#0B1524] hover:bg-slate-100 dark:hover:bg-[#162C4E] border border-slate-200/80 dark:border-[#1E3A5F] rounded-xl text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0B1F3A]/5 dark:bg-[#00C2FF]/10 border border-[#0B1F3A]/10 dark:border-[#00C2FF]/20 rounded-lg flex items-center justify-center text-[#0B1F3A] dark:text-[#00C2FF] group-hover:bg-[#0B1F3A] dark:group-hover:bg-[#00C2FF] group-hover:text-white dark:group-hover:text-[#0B1F3A] transition-colors">
                    <PhoneIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">Test Inbound Call Simulation</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Trigger synthetic call dialog and verify ringtone engine</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#008BB8] dark:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform">Run →</span>
              </button>
              
              <button 
                onClick={() => navigate(ROUTES.CONTACTS)}
                className="w-full p-3.5 bg-slate-50 dark:bg-[#0B1524] hover:bg-slate-100 dark:hover:bg-[#162C4E] border border-slate-200/80 dark:border-[#1E3A5F] rounded-xl text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg flex items-center justify-center text-[#065F46] dark:text-[#34D399] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">Verified Directory</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Manage authorized contacts & initiate encrypted voice calls</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0B1F3A] dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform">View →</span>
              </button>
              
              <button 
                onClick={() => navigate(ROUTES.CALL_HISTORY)}
                className="w-full p-3.5 bg-slate-50 dark:bg-[#0B1524] hover:bg-slate-100 dark:hover:bg-[#162C4E] border border-slate-200/80 dark:border-[#1E3A5F] rounded-xl text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#123C69]/10 border border-[#123C69]/20 rounded-lg flex items-center justify-center text-[#123C69] dark:text-[#38BDF8] group-hover:bg-[#123C69] group-hover:text-white transition-colors">
                    <ChartIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">Forensic Call History</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Review past impersonation scores & acoustic analytics</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0B1F3A] dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform">Audit →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enterprise Privacy Banner */}
        <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center justify-center text-[#10B981] flex-shrink-0">
                <LockIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">
                  Zero Audio Retention Protocol Enforced
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  AudioWorklet samples transient 16kHz PCM audio in ephemeral memory only. Never logged, stored, or exported.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Compliant Active
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
