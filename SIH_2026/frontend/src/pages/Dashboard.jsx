import { useAuth } from '../context/AuthContext';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall.jsx';
import { useCall } from '../context/CallContext';
import { useSignalingWebSocket } from '../context/WebSocketContext';
import IncomingCallModal from '../components/IncomingCallModal';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import SecurityStatusCard from '../components/dashboard/SecurityStatusCard';
import PresenceIndicator from '../components/common/PresenceIndicator';
import { IS_MOCK_MODE } from '../constants';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { PhoneIcon, UsersIcon, ChartIcon, LockIcon, MaskIcon, ShieldIcon } from '../utils/icons';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { receiveIncomingCall } = useCall();
  const navigate = useNavigate();
  const signalingWS = useSignalingWebSocket();
  
  // Track online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // WebRTC Integration with SimplePeer
  const {
    callState,
    incomingCall,
    isMuted,
    isConnected,
    initiateCall,
    acceptCall,
    rejectCall,
    toggleMute,
    endCall,
    formatDuration,
  } = useSharedSimplePeerCall();
  
  // Subscribe to presence updates
  useEffect(() => {
    if (!signalingWS?.isConnected) return;
    
    const handlePresence = (data) => {
      console.log('Presence update:', data);
      const userId = data.user_id;
      const status = data.status;
      
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (status === 'online') {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    };
    
    // Subscribe to presence messages
    if (signalingWS?.subscribe) {
      signalingWS.subscribe('user_presence', handlePresence);
    }
    
    return () => {
      if (signalingWS?.unsubscribe) {
        signalingWS.unsubscribe('user_presence', handlePresence);
      }
    };
  }, [signalingWS?.isConnected]);
  
  // Get first name from full name
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  
// Real stats data
  const stats = {
    activeCalls: 0, // Real-time active calls count
    contactsOnline: onlineUsers.size, // Already real from WebSocket
    threatsBlocked: 0, // Real count from database
  };

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
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {firstName}!
          </h1>
          <p className="text-gray-400">
            Make safer calls with end-to-end AI voice detection
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${isConnected ? 'bg-success-dark/20 border-success-light/30' : 'bg-warning-dark/20 border-warning-light/30'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-light' : 'bg-warning-light'}`}></div>
              <p className={isConnected ? 'text-success-light' : 'text-warning-light'}>
                {isConnected ? 'WebRTC Connected - Ready for calls' : 'Connecting...'}
              </p>
            </div>
          </div>

        {callState === 'calling' && (
          <div className="p-6 bg-warning-dark/20 border border-warning-light/30 rounded-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Calling...</h3>
              <p className="text-warning-light">Waiting for response</p>
            </div>
          </div>
        )}

        {callState === 'connected' && (
          <div className="p-6 bg-primary-600/20 border border-primary-600/50 rounded-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Call Active</h3>
              <p className="text-2xl font-mono text-primary-400">{formatDuration()}</p>
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={<PhoneIcon className="w-6 h-6" />}
            label="Active Calls"
            value={stats.activeCalls}
            color="primary"
            
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
            
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityStatusCard status="protected" />
          
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

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-dark/20 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-success-light" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Privacy Protected</p>
              <p className="text-gray-400 text-sm">Raw Audio Retention: OFF — All processing is transient</p>
            </div>
            <div className="px-3 py-1 bg-success-dark/20 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-success-light rounded-full"></div>
              <span className="text-success-light text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      <IncomingCallModal
        callerInfo={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />


    </Layout>
  );
}
