# 🏗️ VoiceShield - Complete System Architecture

## 📊 System Overview

VoiceShield is a real-time voice call authentication system that detects AI-generated (synthetic) voices during WebRTC calls.

**Tech Stack:**
- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** FastAPI (Python) + SQLite
- **Real-time:** WebSockets (Signaling + Analysis)
- **Voice Calling:** WebRTC (SimplePeer)
- **Audio Processing:** AudioWorklet API
- **AI Analysis:** External AI Model API

---

## 🔐 1. AUTHENTICATION FLOW

### Login/Register Flow

```
┌─────────────┐      HTTP POST          ┌─────────────┐
│   Browser   │ ──────────────────────▶ │   Backend   │
│  (React)    │  /api/auth/register     │   FastAPI   │
└─────────────┘  /api/auth/login        └─────────────┘
      │                                         │
      │                                         ▼
      │                                  ┌──────────────┐
      │                                  │  JWT Token   │
      │                                  │  Generation  │
      │                                  └──────────────┘
      │                                         │
      │         JWT Token (Bearer)              │
      │ ◀───────────────────────────────────────┘
      │
      ▼
┌─────────────┐
│ localStorage│
│ access_token│
└─────────────┘
```

**Step-by-Step:**

1. **User enters credentials** on LoginPage.jsx
2. **Frontend sends** POST to `/api/auth/login` or `/api/auth/register`
3. **Backend validates** credentials in `auth.py` router
4. **Password hashing** using bcrypt in `security.py`
5. **JWT token created** with user ID and expiration
6. **Token stored** in localStorage
7. **All future requests** include `Authorization: Bearer {token}` header

**Key Files:**
- Frontend: `src/pages/LoginPage.jsx`, `src/services/api.js`
- Backend: `app/routers/auth.py`, `app/auth/security.py`, `app/auth/dependencies.py`
- Database: `users` table in SQLite

---

## 👥 2. USER DASHBOARD FLOW

### After Login

```
┌─────────────┐                           ┌─────────────┐
│  Dashboard  │  GET /api/users/online    │   Backend   │
│    Page     │ ─────────────────────────▶│   FastAPI   │
└─────────────┘                           └─────────────┘
      │                                          │
      │                                          ▼
      │                                   ┌──────────────┐
      │                                   │  Query Users │
      │                                   │  is_online=1 │
      │         User List (JSON)          └──────────────┘
      │ ◀─────────────────────────────────────┘
      │
      ▼
┌─────────────┐
│ Contact List│
│   Display   │
└─────────────┘
```

**Step-by-Step:**

1. **Dashboard loads** - Dashboard.jsx
2. **Fetch online users** - GET `/api/users/online`
3. **Backend queries** database for `is_online = true` users
4. **Returns user list** with ID, name, email, avatar
5. **Frontend displays** as contact cards with "Call" button

**Key Files:**
- Frontend: `src/pages/Dashboard.jsx`, `src/services/api.js`
- Backend: `app/routers/users.py`
- Database: `users` table

---

## 📞 3. WEBRTC CALL SETUP FLOW

### Call Initiation (Caller Side)

```
Step 1: Call Initiation
┌─────────────┐                           ┌─────────────┐
│   Caller    │  Click "Call" button      │   Backend   │
│  (User A)   │                           │  WebSocket  │
└─────────────┘                           └─────────────┘
      │
      │ 1. Connect WebSocket
      │    ws://localhost:8000/ws/signaling?token=JWT
      ├───────────────────────────────────────▶
      │
      │ 2. Send call_initiate
      │    { type: "call_initiate",
      │      call_id: "call_123",
      │      callee_id: 2 }
      ├───────────────────────────────────────▶
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │ Create Call  │
      │                                   │   Session    │
      │                                   │ (in-memory)  │
      │                                   └──────────────┘


Step 2: Callee Notification
┌─────────────┐                           ┌─────────────┐
│   Callee    │  WebSocket message        │   Backend   │
│  (User B)   │ ◀─────────────────────────│  WebSocket  │
└─────────────┘  { type: "incoming_call",  └─────────────┘
      │            call_id: "call_123",
      │            caller_name: "User A" }
      │
      ▼
┌─────────────┐
│  Incoming   │
│Call Modal   │
└─────────────┘


Step 3: Callee Accepts Call
┌─────────────┐                           ┌─────────────┐
│   Callee    │  Accept button clicked    │   Backend   │
│  (User B)   │                           │  WebSocket  │
└─────────────┘                           └─────────────┘
      │
      │ 3. Send call_accept
      │    { type: "call_accept",
      │      call_id: "call_123" }
      ├───────────────────────────────────────▶
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │Update Session│
      │                                   │state=ACCEPTED│
      │                                   └──────────────┘
      │                                         │
      │         call_accepted message           │
      │ ◀───────────────────────────────────────┘
      │    (forwarded to Caller)
      │
      ▼
┌─────────────┐
│ Navigate to │
│ActiveCallPage│
└─────────────┘


Step 4: WebRTC Peer Connection
┌─────────────┐                           ┌─────────────┐
│   Caller    │  SimplePeer (initiator)   │   Callee    │
│  (User A)   │                           │  (User B)   │
└─────────────┘                           └─────────────┘
      │                                         │
      │ 4. Create Offer (SDP)                   │
      │    getUserMedia() → audio               │
      ├─────────────────────────────────────────▶
      │         Via Backend WebSocket           │
      │    { type: "sdp_offer", sdp: "..." }    │
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │Create Answer │
      │                                   │     (SDP)    │
      │                                   └──────────────┘
      │                                         │
      │         sdp_answer                      │
      │ ◀─────────────────────────────────────────┤
      │                                         │
      │ 5. Exchange ICE Candidates               │
      │    (NAT traversal)                      │
      │ ◀──────────────────────────────────────▶│
      │                                         │
      ▼                                         ▼
┌─────────────┐                           ┌─────────────┐
│  P2P Audio  │ ════════════════════════▶ │  P2P Audio  │
│   Stream    │     Direct WebRTC         │   Stream    │
└─────────────┘                           └─────────────┘
```

**Step-by-Step:**

1. **User A clicks "Call"** on Dashboard
2. **Frontend calls** `initiateCall(contactId)` in useSimplePeerCall.js
3. **WebSocket sends** `call_initiate` message to backend
4. **Backend creates** CallSession (in-memory) in session_manager.py
5. **Backend forwards** `incoming_call` to User B via WebSocket
6. **User B sees** incoming call modal, clicks "Accept"
7. **Frontend sends** `call_accept` message
8. **Backend forwards** `call_accepted` to User A
9. **Both users create** SimplePeer instances
10. **Caller creates** WebRTC offer (SDP)
11. **Backend routes** SDP offer to Callee
12. **Callee creates** WebRTC answer (SDP)
13. **Backend routes** SDP answer to Caller
14. **Both exchange** ICE candidates for NAT traversal
15. **Direct P2P connection** established for audio

**Key Files:**
- Frontend: `src/hooks/useSimplePeerCall.js`, `src/pages/ActiveCallPage.jsx`
- Backend: `app/websockets/signaling.py`, `app/services/call_session_manager.py`
- Models: `app/models/call_session.py`

---

## 🎤 4. REAL-TIME AUDIO ANALYSIS FLOW

### Audio Processing Pipeline (RECEIVER SIDE ONLY)

```
Step 1: Audio Capture
┌─────────────┐
│   Caller    │ Speaking...
│  (User A)   │
└─────────────┘
      │
      │ WebRTC P2P Audio Stream
      ▼
┌─────────────┐
│  Receiver   │
│  (User B)   │
└─────────────┘


Step 2: Audio Processing (Receiver Browser)
┌──────────────────────────────────────────────────────┐
│             Receiver Browser (User B)                │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │      RemoteStream (Caller's Audio)           │   │
│  │         getUserMedia() → MediaStream         │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     AudioContext + MediaStreamSource         │   │
│  │        (Connect to AudioWorklet)             │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     AudioWorklet Processor                   │   │
│  │     (audioProcessor.js)                      │   │
│  │                                              │   │
│  │  - Buffer: 4096 samples                      │   │
│  │  - Downsample: 48kHz → 16kHz                 │   │
│  │  - Convert: Float32 → Int16 PCM              │   │
│  │  - VAD: Voice Activity Detection             │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      │ PCM Chunk (every ~0.256s)     │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     useAudioProcessor Hook                   │   │
│  │     (useAudioProcessor.js)                   │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      │ sendAudioChunk()              │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     Analysis WebSocket Client                │   │
│  │  ws://localhost:8000/ws/analysis             │   │
│  └───────────────────┬──────────────────────────┘   │
└──────────────────────┼──────────────────────────────┘
                       │
                       │ { type: "audio_chunk",
                       │   call_id: "call_123",
                       │   audio_data: [Int16Array],
                       │   sample_rate: 16000 }
                       ▼


Step 3: Backend AI Analysis
┌──────────────────────────────────────────────────────┐
│              Backend (FastAPI)                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │     Analysis WebSocket Handler               │   │
│  │     (app/websockets/analysis.py)             │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     Audio Buffer Service                     │   │
│  │     (app/services/audio_buffer.py)           │   │
│  │                                              │   │
│  │  - Accumulate PCM chunks                     │   │
│  │  - Window: 3 seconds                         │   │
│  │  - Encode to WAV format                      │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      │ WAV file (in-memory)          │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     AI Model Client                          │   │
│  │     (app/services/ai_model_client.py)        │   │
│  │                                              │   │
│  │  - Send WAV to external AI API               │   │
│  │  - POST /api/analyze                         │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      │ HTTP POST                     │
│                      ▼                              │
└──────────────────────┼──────────────────────────────┘
                       │
                       ▼
           ┌─────────────────────┐
           │  External AI Model  │
           │  (Railway.app)      │
           │                     │
           │  Voice Detection    │
           │  Deep Learning      │
           └──────────┬──────────┘
                      │
                      │ { risk_score: 15.5,
                      │   confidence: 95.8,
                      │   synthetic: false }
                      ▼


Step 4: Risk Calculation & Broadcasting
┌─────────────────────────────────────────────────────┐
│              Backend (FastAPI)                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │     Risk Engine                              │   │
│  │     (app/services/risk_engine.py)            │   │
│  │                                              │   │
│  │  - Map score to level:                       │   │
│  │    < 30: LOW                                 │   │
│  │    30-70: MEDIUM                             │   │
│  │    > 70: HIGH                                │   │
│  │  - Generate recommendation                   │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │     Analysis WebSocket Handler               │   │
│  │     Send risk_update message                 │   │
│  └───────────────────┬──────────────────────────┘   │
└──────────────────────┼──────────────────────────────┘
                       │
                       │ { type: "risk_update",
                       │   call_id: "call_123",
                       │   risk_level: "LOW",
                       │   risk_score: 15.5,
                       │   recommendation: "..." }
                       ▼


Step 5: Risk Dashboard Display (Receiver Only)
┌──────────────────────────────────────────────────────┐
│          Receiver Browser (User B)                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │     RiskDashboard Component                  │   │
│  │     (components/call/RiskDashboard.jsx)      │   │
│  │                                              │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │                                        │  │   │
│  │  │         🟢 LOW RISK                    │  │   │
│  │  │                                        │  │   │
│  │  │  Risk Score: 15/100                    │  │   │
│  │  │  Confidence: 95%                       │  │   │
│  │  │                                        │  │   │
│  │  │  💡 This voice appears to be human.   │  │   │
│  │  │     No suspicious patterns detected.   │  │   │
│  │  │                                        │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘


IMPORTANT: Caller (User A) does NOT see RiskDashboard!
          Only Receiver (User B) analyzes and sees results.
```

**Step-by-Step:**

1. **Caller speaks** → audio goes through WebRTC P2P
2. **Receiver's browser** receives remote audio stream
3. **AudioWorklet** processes audio in real-time:
   - Buffers 4096 samples (~0.256s)
   - Downsamples from browser rate to 16kHz
   - Converts Float32 to Int16 PCM
   - Detects voice activity (VAD)
4. **useAudioProcessor** hook sends PCM chunks to Analysis WebSocket
5. **Backend accumulates** chunks into 3-second windows
6. **Backend encodes** to WAV format in memory
7. **Backend sends** WAV to external AI model via HTTP POST
8. **AI Model** analyzes voice and returns risk score
9. **Risk Engine** maps score to LOW/MEDIUM/HIGH
10. **Backend broadcasts** risk update via WebSocket
11. **RiskDashboard** displays results to RECEIVER ONLY

**Key Files:**
- Frontend: 
  - `public/audioProcessor.js` (AudioWorklet)
  - `src/hooks/useAudioProcessor.js`
  - `src/components/call/RiskDashboard.jsx`
  - `src/pages/ActiveCallPage.jsx`
- Backend:
  - `app/websockets/analysis.py`
  - `app/services/audio_buffer.py`
  - `app/services/audio_pipeline.py`
  - `app/services/ai_model_client.py`
  - `app/services/risk_engine.py`

---

## 🔚 5. CALL END & HISTORY FLOW

### Call Termination

```
Step 1: Hangup
┌─────────────┐                           ┌─────────────┐
│  Either     │  Click "End Call"         │   Backend   │
│   User      │                           │  WebSocket  │
└─────────────┘                           └─────────────┘
      │
      │ { type: "hangup",
      │   call_id: "call_123" }
      ├───────────────────────────────────────▶
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │Update Session│
      │                                   │ state=ENDED  │
      │                                   │              │
      │                                   │Calculate     │
      │                                   │duration      │
      │                                   └──────────────┘
      │                                         │
      │         hangup message                  │
      │ ◀───────────────────────────────────────┤
      │    (to other participant)               │
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │Save to DB    │
      │                                   │CallHistory   │
      │                                   │              │
      │                                   │- started_at  │
      │                                   │- ended_at    │
      │                                   │- duration    │
      │                                   │- risk_level  │
      │                                   │- risk_score  │
      │                                   └──────────────┘


Step 2: Cleanup
┌─────────────┐
│   Browser   │
│   Cleanup   │
└─────────────┘
      │
      ├─▶ Close AudioWorklet
      ├─▶ Stop MediaStream tracks
      ├─▶ Close SimplePeer connection
      ├─▶ Disconnect Analysis WebSocket
      ├─▶ Navigate to Dashboard
      │
      ▼
┌─────────────┐
│  Dashboard  │
│  with new   │
│call in history│
└─────────────┘


Step 3: View Call History
┌─────────────┐                           ┌─────────────┐
│   User      │  Navigate to History      │   Backend   │
│             │                           │             │
└─────────────┘                           └─────────────┘
      │
      │ GET /api/calls/history
      ├───────────────────────────────────────▶
      │                                         │
      │                                         ▼
      │                                   ┌──────────────┐
      │                                   │Query CallHist│
      │                                   │WHERE caller  │
      │                                   │  OR callee   │
      │                                   │= current_user│
      │                                   └──────────────┘
      │                                         │
      │  [ { id, contact_name, started_at,      │
      │      duration, risk_level, risk_score } ]│
      │ ◀───────────────────────────────────────┘
      │
      ▼
┌─────────────┐
│Call History │
│   Page      │
│             │
│ ┌─────────┐ │
│ │Contact A│ │
│ │15 min   │ │
│ │LOW RISK │ │
│ └─────────┘ │
│ ┌─────────┐ │
│ │Contact B│ │
│ │  5 min  │ │
│ │MED RISK │ │
│ └─────────┘ │
└─────────────┘
```

**Step-by-Step:**

1. **User clicks** "End Call" button
2. **Frontend calls** `endCall()` in useSimplePeerCall.js
3. **Clean up resources**:
   - Stop all media tracks
   - Close AudioWorklet
   - Destroy SimplePeer connection
   - Disconnect WebSockets
4. **Send hangup** message to backend
5. **Backend updates** CallSession to ENDED state
6. **Backend calculates** call duration
7. **Backend saves** to CallHistory table:
   - Call participants (caller_id, callee_id)
   - Timestamps (started_at, ended_at)
   - Duration in seconds
   - Final risk level and score
8. **Backend forwards** hangup to other user
9. **Frontend navigates** back to Dashboard
10. **User can view** call history anytime

**Key Files:**
- Frontend:
  - `src/hooks/useSimplePeerCall.js` (endCall function)
  - `src/pages/CallHistoryPage.jsx`
- Backend:
  - `app/websockets/signaling.py` (_handle_hangup_routing)
  - `app/services/call_history.py`
  - `app/routers/calls.py`
- Database:
  - `call_history` table

---

## 🗄️ 6. DATABASE SCHEMA

### Tables Overview

```
┌─────────────────────────────────────────────────────────┐
│                      USERS TABLE                        │
├──────────────┬───────────────────┬──────────────────────┤
│ Column       │ Type              │ Description          │
├──────────────┼───────────────────┼──────────────────────┤
│ id           │ INTEGER PK        │ User ID              │
│ email        │ VARCHAR UNIQUE    │ Login email          │
│ full_name    │ VARCHAR           │ Display name         │
│ hashed_pwd   │ VARCHAR           │ Bcrypt hash          │
│ phone        │ VARCHAR           │ Phone number         │
│ is_online    │ BOOLEAN           │ Online status        │
│ last_seen    │ DATETIME          │ Last activity        │
│ created_at   │ DATETIME          │ Registration date    │
│ updated_at   │ DATETIME          │ Last update          │
└──────────────┴───────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  CALL_HISTORY TABLE                     │
├──────────────┬───────────────────┬──────────────────────┤
│ Column       │ Type              │ Description          │
├──────────────┼───────────────────┼──────────────────────┤
│ id           │ VARCHAR PK        │ Call ID (UUID)       │
│ caller_id    │ INTEGER FK        │ User who called      │
│ callee_id    │ INTEGER FK        │ User who received    │
│ started_at   │ DATETIME+TZ       │ Call start (UTC)     │
│ ended_at     │ DATETIME+TZ       │ Call end (UTC)       │
│ duration_sec │ INTEGER           │ Duration (seconds)   │
│ status       │ VARCHAR           │ completed/rejected   │
│ risk_level   │ VARCHAR           │ LOW/MEDIUM/HIGH      │
│ risk_score   │ INTEGER           │ 0-100 score          │
│ created_at   │ DATETIME+TZ       │ Record creation      │
└──────────────┴───────────────────┴──────────────────────┘

Foreign Keys:
- call_history.caller_id → users.id
- call_history.callee_id → users.id

Indexes:
- users: email (unique), is_online, last_seen
- call_history: caller_id, callee_id, started_at, risk_level
```

---

## 🌐 7. API ENDPOINTS

### REST API Endpoints

```
Authentication:
POST   /api/auth/register        - Create new account
POST   /api/auth/login           - Login and get JWT token

Users:
GET    /api/users/me             - Get current user info
GET    /api/users/online         - Get online users list
GET    /api/users/{id}           - Get specific user
PUT    /api/users/profile        - Update profile
PUT    /api/users/password       - Change password

Call History:
GET    /api/calls/history        - Get call history list
GET    /api/calls/{call_id}      - Get specific call details
GET    /api/calls/stats/summary  - Get call statistics

Health:
GET    /health                   - Server health check
GET    /api/health               - Detailed health status
```

### WebSocket Endpoints

```
Signaling (Call Setup):
WS     /ws/signaling?token=JWT

Messages:
- call_initiate  → Start new call
- call_accept    → Accept incoming call
- call_reject    → Reject incoming call
- sdp_offer      → WebRTC offer
- sdp_answer     → WebRTC answer
- ice_candidate  → ICE candidate
- hangup         → End call


Analysis (Audio Processing):
WS     /ws/analysis?token=JWT&call_id=xxx

Messages:
- audio_chunk    → Send PCM audio data
- risk_update    ← Receive risk analysis
- analysis_status ← Get analysis state
```

---

## 📁 8. PROJECT STRUCTURE

```
SIH_2026/
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentication
│   │   │   ├── security.py    # JWT, password hashing
│   │   │   └── dependencies.py # Auth decorators
│   │   ├── models/            # Database models
│   │   │   ├── user.py
│   │   │   ├── call_history.py
│   │   │   └── call_session.py (in-memory)
│   │   ├── routers/           # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   └── calls.py
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── user.py
│   │   │   └── call.py
│   │   ├── services/          # Business logic
│   │   │   ├── ai_model_client.py
│   │   │   ├── audio_buffer.py
│   │   │   ├── audio_pipeline.py
│   │   │   ├── risk_engine.py
│   │   │   ├── call_session_manager.py
│   │   │   └── call_history.py
│   │   ├── websockets/        # WebSocket handlers
│   │   │   ├── signaling.py   # Call signaling
│   │   │   ├── analysis.py    # Audio analysis
│   │   │   └── connection_manager.py
│   │   ├── database.py        # SQLAlchemy setup
│   │   ├── config.py          # Configuration
│   │   └── main.py            # FastAPI app
│   ├── voiceshield.db         # SQLite database
│   └── run.py                 # Server entry point
│
└── frontend/
    ├── public/
    │   └── audioProcessor.js  # AudioWorklet processor
    ├── src/
    │   ├── components/
    │   │   └── call/
    │   │       └── RiskDashboard.jsx
    │   ├── hooks/
    │   │   ├── useSimplePeerCall.js  # WebRTC logic
    │   │   └── useAudioProcessor.js  # Audio processing
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ActiveCallPage.jsx
    │   │   ├── CallHistoryPage.jsx
    │   │   └── SettingsPage.jsx
    │   ├── services/
    │   │   ├── api.js         # REST API calls
    │   │   └── websocket.js   # WebSocket clients
    │   └── App.jsx            # React router
    └── package.json
```

---

## 🔄 9. DATA FLOW SUMMARY

### Complete Call Flow

```
1. LOGIN
   User → Frontend → Backend API → JWT Token → localStorage

2. DASHBOARD
   Frontend → GET /api/users/online → Backend → Database → User List

3. CALL INITIATION
   Frontend → WebSocket (Signaling) → Backend → Other User

4. WEBRTC SETUP
   Caller ← SDP Offer/Answer/ICE → Backend → Callee
   Direct P2P Audio Connection Established

5. AUDIO ANALYSIS (Receiver Only)
   Caller's Audio → Receiver's Browser → AudioWorklet → PCM Chunks
   → Analysis WebSocket → Backend → AI Model → Risk Score
   → Backend → Receiver's RiskDashboard

6. CALL END
   Either User → Hangup Message → Backend → CallHistory Database
   → Both Users Cleanup → Navigate to Dashboard

7. HISTORY VIEW
   User → GET /api/calls/history → Backend → Database
   → Call History List with Risk Levels
```

---

## 🔐 10. SECURITY FEATURES

1. **JWT Authentication** - All API requests require valid token
2. **Password Hashing** - Bcrypt with salt
3. **WebSocket Auth** - Token required in query params
4. **Session Management** - In-memory call sessions
5. **Access Control** - Users can only see their own calls
6. **Input Validation** - Pydantic schemas validate all inputs
7. **CORS** - Configured for frontend origin only

---

## 📊 11. PERFORMANCE CONSIDERATIONS

1. **Audio Processing** - AudioWorklet runs in separate thread
2. **WebSockets** - Persistent connections for real-time
3. **P2P Audio** - WebRTC direct connection (no server relay)
4. **Async/Await** - FastAPI async for concurrent requests
5. **Connection Pooling** - SQLAlchemy connection management
6. **Memory Cleanup** - Buffers cleared after each window

---

**Document Version:** 1.0
**Last Updated:** 2026-09-10
**Architecture Status:** ✅ PRODUCTION READY
