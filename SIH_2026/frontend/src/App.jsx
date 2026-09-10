import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import { WebSocketProvider } from './context/WebSocketContext';
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

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Call Components
import IncomingCallModal from './components/call/IncomingCallModal';
import GlobalActiveCallOverlay from './components/call/GlobalActiveCallOverlay';
import { SimplePeerCallProvider } from './hooks/useSharedSimplePeerCall.jsx';

// Global Incoming Call Modal Wrapper
function GlobalCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  
  return (
    <IncomingCallModal
      caller={incomingCall?.contact}
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
      <CallProvider>
        <WebSocketProvider>
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

          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
        </WebSocketProvider>
      </CallProvider>
    </SimplePeerCallProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;