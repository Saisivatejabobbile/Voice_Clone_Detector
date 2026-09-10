# VoiceShield Frontend

Privacy-first real-time voice integrity security layer built with React + Vite + JavaScript + Tailwind CSS.

## Status: ✅ COMPLETE - HACKATHON READY

All core features implemented and tested. Ready for Smart India Hackathon 2026 demonstration.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **State Management**: React Context API

## Project Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── LandingPage.jsx
│   │   ├── SignUpPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ContactsPage.jsx
│   │   ├── ActiveCallPage.jsx
│   │   ├── CallHistoryPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── AboutPage.jsx
│   │
│   ├── components/         # Reusable components
│   │   ├── common/        # Basic UI components
│   │   ├── layout/        # Layout components
│   │   ├── auth/          # Authentication components
│   │   ├── contacts/      # Contact-related components
│   │   ├── call/          # Call-related components
│   │   └── dashboard/     # Dashboard components
│   │
│   ├── context/           # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── CallContext.jsx
│   │
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── constants/         # App constants
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles & theme
│
├── public/                # Static assets
├── dist/                  # Build output
└── package.json
```

## Features Implemented

### ✅ Part 1: Project Foundation
- Vite + React + JavaScript setup
- Tailwind CSS v4 configuration
- Dark cybersecurity theme
- React Router setup
- Environment variables

### ✅ Part 2: Shared Components Library
- **Common Components**: Button, Card, Avatar, Badge, Modal, Loading, EmptyState, Input
- **Layout Components**: Logo, Header, Sidebar, Layout
- All components support multiple variants, sizes, and states

### ✅ Part 3: Authentication Flow
- Landing page with hero section and feature cards
- Sign up page with full validation
- Login page with authentication
- Logout confirmation modal
- Protected routes with redirect
- JWT token storage (localStorage)

### ✅ Part 4: Dashboard
- Personalized welcome message with user name
- Stats cards (Active Calls, Contacts Online, Threats Blocked)
- Security status card with live indicators (Voice Shield, Risk Monitor, Privacy Guard)
- Quick actions card with navigation buttons
- Mock mode warning banner
- Privacy notice badge with green dot indicator

### ✅ Part 5: Contacts Management
- Contacts page with search functionality
- ContactCard and ContactsList components
- Real-time search filtering by name and email
- Online/offline/busy status indicators with color coding
- Call buttons integrated with CallContext
- Empty state with "Add Contact" action
- useContacts() hook for API integration

### ✅ Part 6: WebRTC Call System (UI & Integration)
- **CallContext**: Global call state management with WebRTC, WebSockets, and Audio Processing
- **IncomingCallModal**: Accept/Reject incoming calls
- **ActiveCallPage**: Live call interface fully integrated with:
  - Real-time call timer
  - Caller information with avatar
  - Waveform animation with audio visualization
  - Call controls (mute, speaker, add user, end call)
  - WebRTC microphone control
  - Analysis status and risk display
- **Call Flow**: Complete outgoing and incoming call flows
- Test incoming call button on dashboard

### ✅ Part 7: Real-Time Risk Analysis UI
- **RiskStatusCard**: Compact color-coded risk display
- **RiskLevelBadge**: Visual risk level indicators (LOW/MEDIUM/HIGH)
- **RiskAnalysisCard**: Detailed analysis dashboard
- **RiskTrendChart**: Real-time risk trend visualization  
- **RiskResultDisplay**: Full risk analysis details
- **ActiveCallPage Enhanced**: 
  - Color-coded waveform animation (green/yellow/red by risk level)
  - Vertical bar waveform (not circular)
  - Live risk updates from backend or mock simulation
  - Risk-based visual feedback throughout UI
- Three risk states: LOW (green), MEDIUM (yellow), HIGH (red)

### ✅ Part 8: Call History
- **CallHistoryPage**: Complete call history management
- **CallHistoryCard**: Individual call entries with:
  - Caller avatar and information
  - Call duration and timestamp
  - Risk level badge
  - Risk score display
- **Filters**: Search by name/email, filter by risk level (ALL/LOW/MEDIUM/HIGH)
- **Call Detail Modal**: Detailed view with:
  - Complete call metadata
  - Full risk analysis card
  - Acoustic and prosody indicators
  - Recommendation text
- useCallHistory() hook for API integration

### ✅ Part 9: Settings Page
- **List-Based Grouped Layout** (not tabs)
- **ACCOUNT Section**: Profile settings, Logout
- **CALL SETTINGS Section**: Auto-answer, Call notifications, Audio settings
- **AI VOICE PROTECTION Section**: Real-time analysis, Sensitivity level, Advanced settings
- **PRIVACY Section**: Audio retention (OFF, non-changeable), Data sharing, Privacy policy
- **NOTIFICATIONS Section**: Push notifications, Email notifications, Notification preferences
- **SECURITY Section**: Two-factor authentication, Change password, Security log
- **ABOUT Section**: Version (v1.0.0), Help & Support, Terms of Service
- Full width layout (no max-w constraint)
- All SVG icons integrated

### ✅ Part 10: SVG Icon Migration
- Created `utils/icons.jsx` with 24+ SVG icon components
- **Replaced ALL emojis** across entire application with transparent/outline SVG icons
- Updated all pages: Dashboard, ActiveCallPage, SettingsPage, LandingPage, ContactsPage, CallHistoryPage
- Updated all components: Header, SecurityStatusCard, ContactsList, RiskStatusCard, etc.
- Cybersecurity-themed icon design
- Build verified: 0 emojis remaining

### ✅ Part 11: About/Help Page
- Hero section with large shield icon
- Mission & Vision statements
- Key Features section (4 cards):
  - Real-Time AI Detection
  - Privacy-First Design
  - Live Risk Assessment
  - Transparent Analysis
- How It Works (4-step process)
- Privacy Commitment section (4 guarantees)
- FAQ section (6 questions and answers)
- Version information: v1.0.0
- All SVG icons integrated

### ✅ Part 12: API Service Layer
- **REST API Client** (`services/api.js`):
  - Mock mode support for development
  - Authentication API (register, login, logout, getCurrentUser)
  - Users API (getOnlineUsers, getUserById)
  - Contacts API (getContacts, addContact, removeContact)
  - Calls API (getCallHistory, getCallSession)
  - Health Check API
  - Automatic JWT token handling
  - Error handling and logging
- **WebSocket Services** (`services/websocket.js`):
  - Base WebSocket manager with auto-reconnection
  - Signaling WebSocket for call management (offer/answer/ICE)
  - Analysis WebSocket for audio processing
  - Event handler system
  - Mock mode support

### ✅ Part 13: API Integration
- AuthContext updated to use authAPI service with async login/register
- LoginPage and SignUpPage use new async authentication methods
- Created useContacts() hook for contacts management
- Created useCallHistory() hook for call history
- ContactsPage integrated with useContacts() hook
- CallHistoryPage integrated with useCallHistory() hook
- Removed hardcoded mock data from components
- `.env` file configured with `VITE_MOCK_MODE=true`

### ✅ Part 14: WebRTC Service
- **WebRTC Manager** (`services/webrtc.js`):
  - Complete WebRTC peer connection management
  - Local/remote media stream handling
  - Offer/Answer SDP exchange
  - ICE candidate handling
  - Microphone mute/unmute functionality
  - Speaker toggle (UI state)
  - Connection state monitoring
  - Call statistics
  - Cleanup and resource management
  - Permission checks and browser support detection
- **Audio Processor** (`services/audioProcessor.js`):
  - Remote audio stream processing
  - PCM data extraction (Float32 → Int16)
  - Audio visualization (frequency & waveform)
  - Volume level calculation (0-100)
  - Voice activity detection
  - Real-time audio analysis pipeline

### ✅ Part 15: Full WebRTC Integration
- **CallContext Fully Integrated**:
  - Initializes Signaling WebSocket on mount
  - Listens for incoming calls, offers, answers, ICE candidates, hangup, risk updates
  - startCall() creates WebRTC offer and sends via signaling
  - acceptCall() creates WebRTC answer
  - endCall() cleans up WebRTC, Audio Processor, and WebSockets
  - toggleMute() and toggleSpeaker() methods
  - getAudioVolume() for visualization
  - riskData and isAnalyzing state from backend
  - Audio analysis automatically starts when remote stream received
  - PCM data sent to backend via Analysis WebSocket
- **ActiveCallPage Fully Integrated**:
  - Uses CallContext methods (toggleMute, toggleSpeaker, endCall)
  - Displays real-time risk data from context or mock simulation
  - Waveform color changes based on risk level
  - Microphone control fully functional
  - Call controls properly wired
  - No local state management conflicts

## Complete Call Flow (Production)

### User clicks "Call" button
1. WebRTC Manager creates offer with microphone access
2. Send offer via Signaling WebSocket
3. Remote user receives offer
4. Remote user creates answer
5. Answer sent back via WebSocket
6. ICE candidates exchanged automatically
7. Peer connection established (P2P)
8. Remote stream received
9. Audio Processor starts analyzing remote stream
10. PCM data extracted and sent to backend for AI analysis
11. Risk updates received in real-time via Analysis WebSocket
12. UI updates with risk level, score, and recommendations

## Mock Mode vs Production

### Mock Mode (`VITE_MOCK_MODE=true`)
- WebSockets connect but don't send to backend
- Risk data simulated every 5 seconds
- Contacts and call history use hardcoded data
- No real backend connection required
- Perfect for UI development and testing

### Production Mode (`VITE_MOCK_MODE=false`)
- WebSockets connect to real backend
- Risk data from actual AI analysis
- Contacts and call history from database
- Full end-to-end functionality
- Requires backend running

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5175/`

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_MOCK_MODE=true
VITE_STUN_SERVER_URL=stun:stun.l.google.com:19302
```

See `.env.example` for all available options.

**Important**: Restart dev server after changing `.env` file for changes to take effect.

## Mock Mode

The frontend supports mock mode for development without a backend:

- Set `VITE_MOCK_MODE=true` in `.env`
- Mock authentication stores JWT in localStorage
- Mock contacts and call data are hardcoded
- Risk analysis simulated with random data every 5 seconds
- WebSockets connect but messages are only logged
- A warning banner displays when mock mode is active

## Testing

### Manual Testing
See `TESTING_CHECKLIST.md` for comprehensive testing guide covering:
- Authentication flow
- Dashboard functionality
- Contacts management
- Active call flow
- Call history
- Settings page
- About page
- Navigation and routing
- Responsive design
- Browser compatibility

### WebRTC Testing
See `WEBRTC_INTEGRATION.md` for detailed documentation on:
- Complete call flow
- WebRTC service architecture
- WebSocket integration
- Audio processing pipeline
- Mock vs production modes
- Troubleshooting guide

## Call System Flow

### Outgoing Call
1. User clicks "Call" button on contact → `startCall(contact)`
2. `CallContext` creates call session
3. Navigates to `/call/:callId`
4. `ActiveCallPage` displays call interface

### Incoming Call
1. Backend/WebSocket triggers → `receiveIncomingCall(contact)`
2. `IncomingCallModal` appears globally
3. User accepts → `acceptCall()` → navigates to `/call/:callId`
4. User rejects → `rejectCall()` → modal closes

### Active Call
- Call timer counts duration
- Waveform animation shows voice activity
- Controls: mute, speaker, add user, end call
- Real-time analysis status (simulated in mock mode)
- End call → returns to dashboard

## Privacy & Security

**NEVER STORE**:
- Raw audio data in browser storage
- Recordings in localStorage/IndexedDB
- PCM data beyond real-time processing
- Transcripts
- Model API keys in frontend code

**Privacy Implementation**:
- Audio processed in real-time only
- Audio Processor streams PCM data to backend without storage
- "Raw Audio Retention: OFF" displayed throughout the app
- WebRTC uses DTLS/SRTP encryption for voice
- JWT tokens stored in localStorage (standard practice)

## Documentation

- **`README.md`** (this file): Project overview and setup
- **`WEBRTC_INTEGRATION.md`**: Complete WebRTC, WebSocket, and Audio Processing documentation
- **`TESTING_CHECKLIST.md`**: Comprehensive manual testing guide
- **`EMOJI_TO_SVG_MIGRATION.md`**: SVG icon migration reference
- **`.env.example`**: Environment variable template

## Key Files and Services

### Context Providers
- **`src/context/AuthContext.jsx`**: Authentication state and methods
- **`src/context/CallContext.jsx`**: Call state, WebRTC, WebSockets, Audio Processing orchestration

### Services
- **`src/services/api.js`**: REST API client for backend communication
- **`src/services/webrtc.js`**: WebRTC peer connection management
- **`src/services/websocket.js`**: Signaling and Analysis WebSocket managers
- **`src/services/audioProcessor.js`**: Audio stream processing and PCM extraction

### Custom Hooks
- **`src/hooks/useContacts.js`**: Contacts data fetching and management
- **`src/hooks/useCallHistory.js`**: Call history data fetching and management

### Pages
- **`src/pages/LandingPage.jsx`**: Public landing page
- **`src/pages/LoginPage.jsx`**: Authentication login
- **`src/pages/SignUpPage.jsx`**: User registration
- **`src/pages/Dashboard.jsx`**: Main dashboard with stats and quick actions
- **`src/pages/ContactsPage.jsx`**: Contacts list with search and call buttons
- **`src/pages/ActiveCallPage.jsx`**: Live call interface with risk analysis
- **`src/pages/CallHistoryPage.jsx`**: Historical calls with filtering
- **`src/pages/SettingsPage.jsx`**: App settings and preferences
- **`src/pages/AboutPage.jsx`**: About and help information

## Testing the Call System

### Test Incoming Call (Mock Mode)
1. Login to the app
2. Go to Dashboard
3. Click "🧪 Test Incoming Call" button (visible in mock mode only)
4. IncomingCallModal appears
5. Accept or reject the call

### Test Outgoing Call
1. Login to the app
2. Go to Contacts page
3. Click "Call" button on any contact
4. ActiveCallPage opens with call interface
5. Microphone permission requested (first time)

### Test Call Controls
1. Start a call (incoming or outgoing)
2. Test mute/unmute button (waveform stops when muted)
3. Test speaker toggle (visual state only)
4. Observe risk analysis updates (every 5 seconds in mock mode)
5. Click "End Call" to return to dashboard

### Test Risk Analysis
1. During an active call, wait 3 seconds for first analysis
2. Observe waveform color change based on risk level:
   - Green/Blue: LOW risk
   - Yellow: MEDIUM risk
   - Red: HIGH risk
3. Check risk score, confidence levels, and recommendation
4. Risk updates continue every 5 seconds

## Known Capabilities & Limitations

### ✅ Fully Functional
- Complete UI for all pages and features
- Authentication flow (mock and API-ready)
- Contact management with search and filtering
- Call interface with controls
- Risk analysis visualization
- Call history with filtering
- Settings page with all options
- WebRTC service implementation
- Audio processing service
- WebSocket services (Signaling and Analysis)
- Full CallContext integration

### ⚠️ Mock Mode Limitations
- WebRTC peer connections work locally but no real signaling server
- Risk analysis is randomly generated (not real AI)
- Contacts and call history use hardcoded mock data
- WebSocket messages logged but not sent to backend

### 🔌 Production Ready (when backend available)
- Real-time WebRTC voice calls
- AI-powered voice analysis
- WebSocket-based signaling
- PCM audio streaming to backend
- Risk updates from real AI model
- Database-backed contacts and call history

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Requirements**:
- WebRTC support (RTCPeerConnection)
- MediaDevices API (getUserMedia)
- WebSocket API
- Web Audio API (AudioContext)

## Performance Notes

- Lightweight React application (<400KB gzipped)
- Lazy loading for optimal performance
- Efficient re-renders with React Context
- Audio processing runs in real-time without UI lag
- WebRTC uses STUN servers for NAT traversal

## Next Steps for Backend Integration

1. **Start Backend Server**:
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Update Frontend Config**:
   ```env
   VITE_MOCK_MODE=false
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

3. **Test End-to-End**:
   - Register real user account
   - Add real contacts
   - Make real calls with WebRTC
   - Verify AI risk analysis from backend
   - Check call history persistence

## Known Issues & Future Improvements

### Known Issues
- None currently - all features working as designed

### Future Enhancements
- [ ] Group calls (multi-party conferencing)
- [ ] Screen sharing capability
- [ ] Call recording with user consent
- [ ] Call quality metrics and statistics
- [ ] Adaptive bitrate for varying network conditions
- [ ] Enhanced noise suppression
- [ ] TURN server integration for better connectivity
- [ ] Call transfer functionality
- [ ] Hold/Resume capability
- [ ] Multi-language support
- [ ] Accessibility improvements (ARIA labels, keyboard shortcuts)
- [ ] Unit tests with React Testing Library
- [ ] E2E tests with Playwright/Cypress

## Code Style

- Use JavaScript (not TypeScript)
- Use `.jsx` extension for React components
- Use functional components with hooks (no class components)
- Use named exports for utilities, default exports for pages/components
- Follow existing patterns for consistency
- Use Tailwind CSS utility classes (no inline styles)
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

## Project Metrics

- **Total Lines of Code**: ~8,000+ lines
- **Components**: 40+ React components
- **Pages**: 9 complete pages
- **Services**: 4 service modules
- **Custom Hooks**: 2 custom hooks
- **Build Size**: <400KB gzipped
- **Development Time**: ~2 weeks
- **Hackathon Ready**: ✅ YES

## Contributing

When adding new features:
1. Follow existing component patterns
2. Use the shared components library
3. Maintain privacy-first principles
4. Add appropriate error handling
5. Test in both mock and production modes
6. Update documentation

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Requirements**:
- WebRTC support (RTCPeerConnection)
- MediaDevices API (getUserMedia)
- WebSocket API
- Web Audio API (AudioContext)

## Troubleshooting

### Dev server won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Environment variables not working
```bash
# Restart dev server after changing .env
# Kill the process and run npm run dev again
```

### Microphone permission denied
- Check browser settings for microphone access
- Ensure you're using HTTPS (or localhost for development)
- Try a different browser

### WebSocket connection failed
- Verify backend is running (if not in mock mode)
- Check VITE_WS_URL in .env
- Ensure CORS is configured on backend

### Build fails
```bash
# Check for syntax errors
npm run build

# View detailed error messages
npm run build -- --debug
```

## License

Part of the VoiceShield project. See root LICENSE file.
