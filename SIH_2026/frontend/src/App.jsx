import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './constants';

// Pages
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ContactsPage from './pages/ContactsPage';
import CallHistoryPage from './pages/CallHistoryPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import ComponentShowcase from './pages/ComponentShowcase';
import ActiveCallPage from './pages/ActiveCallPage';
import AudioAnalysisPage from './pages/AudioAnalysisPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Call Components
import IncomingCallModal from './components/call/IncomingCallModal';
import GlobalActiveCallOverlay from './components/call/GlobalActiveCallOverlay';
import { SimplePeerCallProvider, useSharedSimplePeerCall } from './hooks/useSharedSimplePeerCall.jsx';

// Global Incoming Call Modal Wrapper - Renders on all pages
function GlobalCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useSharedSimplePeerCall();
  
  return (
    <IncomingCallModal
      caller={incomingCall}
      onAccept={acceptCall}
      onReject={rejectCall}
      isOpen={!!incomingCall}
    />
  );
}

// Main App Component wrapped in Router
function AppContent() {
  return (
    <SimplePeerCallProvider>
      <GlobalCallModal />
      <GlobalActiveCallOverlay /> 

      <Routes>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CONTACTS}
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CALL_HISTORY}
            element={
              <ProtectedRoute>
                <CallHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ABOUT}
            element={
              <ProtectedRoute>
                <AboutPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/showcase"
            element={
              <ProtectedRoute>
                <ComponentShowcase />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/call/:callId"
            element={
              <ProtectedRoute>
                <ActiveCallPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.AUDIO_TEST}
            element={
              <ProtectedRoute>
                <AudioAnalysisPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
    </SimplePeerCallProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;