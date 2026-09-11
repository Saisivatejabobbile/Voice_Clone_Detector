import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ROUTES } from '../constants';
import { settingsAPI, authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { 
  UserIcon, 
  LockIcon, 
  ShieldIcon, 
  AlertIcon, 
  ChartIcon, 
  HistoryIcon, 
  InfoIcon,
  MoonIcon
} from '../utils/icons';

// Setting Row Component
function SettingRow({ icon: Icon, title, description, value, onChange, type = 'toggle', onClick }) {
  if (type === 'link') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-[#12233C] transition-colors rounded-xl group text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-lg flex items-center justify-center group-hover:bg-[#0B1F3A] dark:group-hover:bg-[#00C2FF] group-hover:text-white dark:group-hover:text-[#070E1A] transition-colors text-[#0B1F3A] dark:text-[#00C2FF]">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">{title}</p>
            {description && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{description}</p>}
          </div>
        </div>
        <svg className="w-4 h-4 text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#0B1F3A] dark:group-hover:text-[#00C2FF] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  if (type === 'info') {
    return (
      <div className="flex items-start justify-between gap-3 p-3.5 bg-slate-50/75 dark:bg-[#0B1524]/60 border border-slate-200/60 dark:border-[#1E3A5F]/80 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-[#1E3A5F] rounded-lg flex items-center justify-center flex-shrink-0 text-[#0B1F3A] dark:text-[#00C2FF]">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">{title}</p>
            {description && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{description}</p>}
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
          value === 'OFF' 
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
        }`}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-[#12233C] transition-colors rounded-xl">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-lg flex items-center justify-center text-[#0B1F3A] dark:text-[#00C2FF]">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">{title}</p>
          {description && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{description}</p>}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1F3A] dark:peer-checked:bg-[#00C2FF]"></div>
      </label>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title }) {
  return (
    <h2 className="text-xs font-bold text-[#123C69] dark:text-[#38BDF8] uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
      {title}
    </h2>
  );
}

// Enterprise Settings & Policy Management Page
export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
      setProfileSuccess('Operator profile updated successfully.');
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess('');
      }, 1200);
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

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    try {
      await settingsAPI.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1200);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-sm font-mono text-[#64748B] dark:text-[#94A3B8]">
          Loading operator security policies...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
            Security Policies & Preferences
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Configure real-time voice inspection thresholds, operator profile, and privacy retention rules.
          </p>
        </div>

        <div className="space-y-6">
          {/* THEME & APPEARANCE */}
          <div>
            <SectionHeader title="Interface & Appearance" />
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 shadow-xs space-y-1">
              <SettingRow
                icon={MoonIcon}
                title="Dark Theme"
                description="High-contrast cybersecurity dark theme with cyan telemetry accents"
                value={isDark}
                onChange={toggleTheme}
              />
            </div>
          </div>

          {/* OPERATOR IDENTITY */}
          <div>
            <SectionHeader title="Operator Identity" />
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 shadow-xs space-y-1">
              <SettingRow
                icon={UserIcon}
                title="Profile Information"
                description={currentUser?.email || 'Authorized Operator'}
                type="link"
                onClick={() => setShowProfileModal(true)}
              />
              <SettingRow
                icon={LockIcon}
                title="Update Password"
                description="Rotate operator authentication credentials"
                type="link"
                onClick={() => setShowPasswordModal(true)}
              />
            </div>
          </div>

          {/* AI VOICE PROTECTION ENGINE */}
          <div>
            <SectionHeader title="AI Voice Protection Engine" />
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 shadow-xs space-y-1">
              <SettingRow
                icon={ShieldIcon}
                title="Real-Time Voice Detection"
                description="Live transient audio sampling during active calls"
                value={realtimeDetection}
                onChange={setRealtimeDetection}
              />
              <SettingRow
                icon={AlertIcon}
                title="High-Risk Impersonation Alerts"
                description="Immediate prominent alert banner upon synthetic speech detection"
                value={highRiskAlerts}
                onChange={setHighRiskAlerts}
              />
              <SettingRow
                icon={ChartIcon}
                title="Display Numeric Risk Score"
                description="Render IBM Plex Mono score widget during active call sessions"
                value={showRiskScore}
                onChange={setShowRiskScore}
              />
              <SettingRow
                icon={HistoryIcon}
                title="Render Risk History Stream"
                description="Display timeline trend graph in call telemetry console"
                value={showRiskHistory}
                onChange={setShowRiskHistory}
              />
            </div>
          </div>

          {/* COMPLIANCE & PRIVACY */}
          <div>
            <SectionHeader title="Compliance & Privacy Standards" />
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 shadow-xs space-y-2">
              <SettingRow
                icon={LockIcon}
                title="Raw Audio Retention"
                description="Strict zero-retention policy. Speech buffers are wiped after inference."
                value="OFF"
                type="info"
              />
              <SettingRow
                icon={HistoryIcon}
                title="Persist Call Metadata"
                description="Records session timestamps and final risk score only, never audio."
                value={saveCallHistory}
                onChange={setSaveCallHistory}
              />
              <SettingRow
                icon={LockIcon}
                title="Speech-to-Text Transcription"
                description="No call audio is transcribed to text or stored on servers."
                value="OFF"
                type="info"
              />
            </div>
          </div>

          {/* PLATFORM & HELP */}
          <div>
            <SectionHeader title="System Information" />
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-2 shadow-xs space-y-1">
              <SettingRow
                icon={InfoIcon}
                title="About VoiceShield Platform"
                description="Version v2.4.0 • Enterprise Edition"
                type="link"
                onClick={() => navigate(ROUTES.ABOUT)}
              />
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Update Operator Profile"
        >
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Operator name"
            />
            <Input
              label="Contact Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            
            {profileError && (
              <p className="text-xs font-semibold text-[#EF4444]">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-xs font-semibold text-[#10B981]">{profileSuccess}</p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowProfileModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={profileLoading}
              >
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Update Operator Password"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              helper="Minimum 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            {passwordError && (
              <p className="text-xs font-semibold text-[#EF4444]">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs font-semibold text-[#10B981]">{passwordSuccess}</p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
