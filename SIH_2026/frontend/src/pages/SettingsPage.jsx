import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ROUTES } from '../constants';
import { settingsAPI, authAPI } from '../services/api';
import { 
  UserIcon, 
  LockIcon, 
  PhoneIcon, 
  BellIcon, 
  MicIcon,
  ShieldIcon,
  AlertIcon,
  ChartIcon,
  HistoryIcon,
  InfoIcon,
  SettingsIcon,
  XIcon
} from '../utils/icons';

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-900 border border-dark-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Setting Row Component with toggle or chevron
function SettingRow({ icon: Icon, title, description, value, onChange, type = 'toggle', onClick }) {
  if (type === 'link') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-800 transition-colors rounded-lg group"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center group-hover:bg-dark-700 transition-colors">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium">{title}</p>
            {description && <p className="text-gray-400 text-sm">{description}</p>}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  if (type === 'info') {
    return (
      <div className="flex items-start gap-3 p-4 bg-dark-800 rounded-lg">
        <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium mb-1">{title}</p>
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          value === 'OFF' 
            ? 'bg-danger-dark/20 text-danger-light' 
            : 'bg-success-dark/20 text-success-light'
        }`}>
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-dark-800 transition-colors rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-white font-medium">{title}</p>
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
      {title}
    </h2>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Settings states (stored in localStorage)



  const [realtimeDetection, setRealtimeDetection] = useState(() => 
    localStorage.getItem('realtimeDetection') !== 'false'
  );
  const [highRiskAlerts, setHighRiskAlerts] = useState(() => 
    localStorage.getItem('highRiskAlerts') !== 'false'
  );
  const [showRiskScore, setShowRiskScore] = useState(() => 
    localStorage.getItem('showRiskScore') !== 'false'
  );
  const [showRiskHistory, setShowRiskHistory] = useState(() => 
    localStorage.getItem('showRiskHistory') !== 'false'
  );
  const [saveCallHistory, setSaveCallHistory] = useState(() => 
    localStorage.getItem('saveCallHistory') !== 'false'
  );

  useEffect(() => {
    localStorage.setItem('realtimeDetection', realtimeDetection);
  }, [realtimeDetection]);

  useEffect(() => {
    localStorage.setItem('highRiskAlerts', highRiskAlerts);
  }, [highRiskAlerts]);

  useEffect(() => {
    localStorage.setItem('showRiskScore', showRiskScore);
  }, [showRiskScore]);

  useEffect(() => {
    localStorage.setItem('showRiskHistory', showRiskHistory);
  }, [showRiskHistory]);

  useEffect(() => {
    localStorage.setItem('saveCallHistory', saveCallHistory);
  }, [saveCallHistory]);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const updated = await settingsAPI.updateProfile(fullName, phone);
      setCurrentUser(updated);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess('');
      }, 1500);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    try {
      await settingsAPI.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handlePasswordClick = () => {
    setShowPasswordModal(true);
  };

  const handleAbout = () => {
    navigate(ROUTES.ABOUT);
  };

  const handlePrivacyPolicy = () => {
    alert('Privacy policy coming soon');
  };

  const handleHelp = () => {
    alert('Help & support coming soon');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage your account and application preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* ACCOUNT */}
          <div>
            <SectionHeader title="ACCOUNT" />
            <div className="card p-2 space-y-1">
              <SettingRow
                icon={UserIcon}
                title="Profile Information"
                description={currentUser?.email || 'Not available'}
                type="link"
                onClick={handleProfileClick}
              />
              <SettingRow
                icon={LockIcon}
                title="Change Password"
                type="link"
                onClick={handlePasswordClick}
              />
            </div>
          </div>



          {/* AI VOICE PROTECTION */}
          <div>
            <SectionHeader title="AI VOICE PROTECTION" />
            <div className="card p-2 space-y-1">
              <SettingRow
                icon={ShieldIcon}
                title="Real-Time Voice Detection"
                value={realtimeDetection}
                onChange={setRealtimeDetection}
              />
              <SettingRow
                icon={AlertIcon}
                title="High-Risk Alerts"
                value={highRiskAlerts}
                onChange={setHighRiskAlerts}
              />
              <SettingRow
                icon={ChartIcon}
                title="Show Risk Score"
                value={showRiskScore}
                onChange={setShowRiskScore}
              />
              <SettingRow
                icon={HistoryIcon}
                title="Show Risk History"
                value={showRiskHistory}
                onChange={setShowRiskHistory}
              />
            </div>
          </div>

          {/* PRIVACY */}
          <div>
            <SectionHeader title="PRIVACY" />
            <div className="card p-2 space-y-1">
              <SettingRow
                icon={LockIcon}
                title="Raw Audio Retention"
                description="Voice recordings are not stored."
                value="OFF"
                type="info"
              />
              <SettingRow
                icon={HistoryIcon}
                title="Save Call History"
                description="Saves call metadata only, not audio."
                value={saveCallHistory}
                onChange={setSaveCallHistory}
              />
              <SettingRow
                icon={LockIcon}
                title="Save Transcripts"
                description="No call transcripts are stored."
                value="OFF"
                type="info"
              />
            </div>
          </div>

          {/* ABOUT */}
          <div>
            <SectionHeader title="ABOUT" />
            <div className="card p-2 space-y-1">
              <SettingRow
                icon={InfoIcon}
                title="About VoiceShield"
                type="link"
                onClick={handleAbout}
              />
              <SettingRow
                icon={LockIcon}
                title="Privacy Policy"
                type="link"
                onClick={handlePrivacyPolicy}
              />
              <SettingRow
                icon={InfoIcon}
                title="Help & Support"
                type="link"
                onClick={handleHelp}
              />
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Edit Profile"
        >
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="+1 234 567 8900"
              />
            </div>
            {profileError && (
              <div className="text-danger-light text-sm">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="text-success-light text-sm">{profileSuccess}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Enter new password (min 8 characters)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Confirm new password"
                required
              />
            </div>
            {passwordError && (
              <div className="text-danger-light text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-success-light text-sm">{passwordSuccess}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
