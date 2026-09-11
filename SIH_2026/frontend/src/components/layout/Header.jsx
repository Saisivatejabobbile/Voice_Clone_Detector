import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Avatar from '../common/Avatar';
import LogoutConfirmation from '../auth/LogoutConfirmation';
import { ROUTES, IS_MOCK_MODE } from '../../constants';
import { MaskIcon, SettingsIcon, InfoIcon, LogoutIcon } from '../../utils/icons';
import ThemeToggle from '../common/ThemeToggle';

// Header/Navbar Component - Modern Enterprise Cybersecurity Navigation
export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setShowLogoutModal(true);
  };
  
  return (
    <header className="bg-[#0B1F3A] border-b border-[#123C69] sticky top-0 z-40 shadow-sm text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with inverted text colors for dark header */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Logo className="[&_span.text-\[\#0B1F3A\]]:text-white [&_span.text-\[\#123C69\]]:text-[#00C2FF]" />
            </div>
            
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#123C69]/70 border border-[#00C2FF]/30 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
              <span className="font-semibold tracking-wide text-white">SYSTEM ACTIVE</span>
              <span className="text-[#00C2FF] font-mono text-[11px] ml-1">AI ENGINE ONLINE</span>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mock Mode Indicator */}
            {IS_MOCK_MODE && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-[#F59E0B]/20 text-[#FCD34D] rounded-full border border-[#F59E0B]/40 flex items-center gap-1.5">
                <MaskIcon className="w-3.5 h-3.5" />
                SIMULATION MODE
              </span>
            )}
            
            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-[#123C69] rounded-lg px-3 py-1.5 transition-colors border border-transparent hover:border-[#123C69]/80"
                >
                  <Avatar name={user.full_name || user.email} size="sm" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {user.full_name || 'Security Operator'}
                    </p>
                    <p className="text-xs text-slate-300 font-mono leading-tight">{user.email}</p>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl shadow-xl py-1 z-20 text-[#0F172A] dark:text-[#F1F5F9]">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1E3A5F]">
                        <p className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-[#0B1F3A] dark:text-white truncate">{user.full_name || user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          navigate(ROUTES.SETTINGS);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#0F172A] dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-[#162C4E] transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <SettingsIcon className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                        Security Settings
                      </button>
                      <button
                        onClick={() => {
                          navigate(ROUTES.ABOUT);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#0F172A] dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-[#162C4E] transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <InfoIcon className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                        Architecture & Help
                      </button>
                      
                      <hr className="my-1 border-slate-100 dark:border-[#1E3A5F]" />
                      
                      <button
                        onClick={handleLogoutClick}
                        className="w-full px-4 py-2 text-left text-sm text-[#EF4444] dark:text-red-400 hover:bg-rose-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2.5 font-semibold"
                      >
                        <LogoutIcon className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
                        End Session
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmation 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
      />
    </header>
  );
}
