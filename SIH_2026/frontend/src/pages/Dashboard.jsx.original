import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import SecurityStatusCard from '../components/dashboard/SecurityStatusCard';
import { IS_MOCK_MODE } from '../constants';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { PhoneIcon, UsersIcon, ChartIcon, LockIcon, MaskIcon, ShieldIcon } from '../utils/icons';

export default function Dashboard() {
  const { user } = useAuth();
  const { receiveIncomingCall } = useCall();
  const navigate = useNavigate();
  
  // Get first name from full name
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  
  // Mock stats data (will be replaced with real data from API)
  const stats = {
    activeCalls: 12,
    contactsOnline: 5,
    threatsBlocked: 0,
  };

  // Test incoming call simulation
  const handleTestIncomingCall = () => {
    const mockCaller = {
      id: 'test-caller',
      full_name: 'Test Caller',
      email: 'test@example.com',
      status: 'online',
    };
    receiveIncomingCall(mockCaller);
  };

  const handleViewContacts = () => {
    navigate(ROUTES.CONTACTS);
  };

  const handleViewHistory = () => {
    navigate(ROUTES.CALL_HISTORY);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {firstName}!
          </h1>
          <p className="text-gray-400">
            Make safer calls with end-to-end AI voice detection
          </p>
        </div>

        {/* Mock Mode Warning */}
        {IS_MOCK_MODE && (
          <div className="p-4 bg-warning-dark/20 border border-warning-light/30 rounded-lg">
            <div className="flex items-center gap-3">
              <MaskIcon className="w-6 h-6 text-warning-light" />
              <div>
                <p className="text-warning-light font-semibold">Demo Mode Active</p>
                <p className="text-sm text-warning-light/80">
                  You're viewing simulated data. Connect to the backend for real-time analysis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={<PhoneIcon className="w-6 h-6" />}
            label="Active Calls"
            value={stats.activeCalls}
            color="primary"
            trend={{
              positive: true,
              value: '12%',
              label: 'vs last week',
            }}
          />
          
          <StatsCard
            icon={<UsersIcon className="w-6 h-6" />}
            label="Contacts Online"
            value={stats.contactsOnline}
            color="success"
          />
          
          <StatsCard
            icon={<ShieldIcon className="w-6 h-6" />}
            label="Threats Blocked"
            value={stats.threatsBlocked}
            color="danger"
            trend={{
              positive: true,
              value: '0',
              label: 'this month',
            }}
          />
        </div>

        {/* Security Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityStatusCard status="protected" />
          
          {/* Quick Actions Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={handleTestIncomingCall}
                className="w-full p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center group-hover:bg-primary-600/30 transition-colors">
                    <PhoneIcon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Test Incoming Call</p>
                    <p className="text-gray-400 text-sm">Simulate an incoming call (demo)</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleViewContacts}
                className="w-full p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-dark/20 rounded-lg flex items-center justify-center group-hover:bg-success-dark/30 transition-colors">
                    <UsersIcon className="w-5 h-5 text-success-light" />
                  </div>
                  <div>
                    <p className="text-white font-medium">View Contacts</p>
                    <p className="text-gray-400 text-sm">Manage your contacts</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleViewHistory}
                className="w-full p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-dark/20 rounded-lg flex items-center justify-center group-hover:bg-warning-dark/30 transition-colors">
                    <ChartIcon className="w-5 h-5 text-warning-light" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Call History</p>
                    <p className="text-gray-400 text-sm">Review past calls</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-dark/20 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-success-light" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Privacy Protected</p>
              <p className="text-gray-400 text-sm">Raw Audio Retention: OFF • All processing is transient</p>
            </div>
            <div className="px-3 py-1 bg-success-dark/20 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-success-light rounded-full"></div>
              <span className="text-success-light text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
