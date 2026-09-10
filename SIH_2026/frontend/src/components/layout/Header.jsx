import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Avatar from '../common/Avatar';
import LogoutConfirmation from '../auth/LogoutConfirmation';
import { ROUTES, IS_MOCK_MODE } from '../../constants';
import { MaskIcon, SettingsIcon, InfoIcon, LogoutIcon } from '../../utils/icons';

// Header/Navbar Component
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
    <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />
          
          {/* Mock Mode Indicator */}
          {IS_MOCK_MODE && (
            <div className="hidden md:block">
              <span className="px-3 py-1 text-xs font-semibold bg-warning-dark/20 text-warning-light rounded-full border border-warning-light/30 flex items-center gap-2">
                <MaskIcon className="w-4 h-4" />
                DEMO MODE
              </span>
            </div>
          )}
          
          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-dark-800 rounded-lg px-3 py-2 transition-colors"
              >
                <Avatar name={user.full_name || user.email} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 z-20">
                    <button
                      onClick={() => {
                        navigate(ROUTES.SETTINGS);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-700 transition-colors flex items-center gap-2"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate(ROUTES.ABOUT);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-700 transition-colors flex items-center gap-2"
                    >
                      <InfoIcon className="w-4 h-4" />
                      About
                    </button>
                    <hr className="my-1 border-dark-700" />
                    <button
                      onClick={handleLogoutClick}
                      className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-dark-700 transition-colors flex items-center gap-2"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
