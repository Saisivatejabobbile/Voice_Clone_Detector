# Design Document: WebRTC Voice Calling

## Overview

This document provides a comprehensive technical design for implementing real-time peer-to-peer voice calling in VoiceShield using WebRTC technology. The system enables authenticated users to make and receive voice calls with real-time AI-powered voice authenticity analysis.

### Design Goals

1. **Real-time Communication**: Low-latency peer-to-peer audio streaming using WebRTC
2. **Privacy-First**: Transient audio processing with zero persistent storage of raw audio
3. **Secure Architecture**: Backend-only AI API integration with secure credential management
4. **Modular Design**: Clear separation between WebRTC, Audio Processing, AI Analysis, and UI layers
5. **Scalable Signaling**: WebSocket-based signaling server supporting multiple concurrent calls
6. **Real-time Risk Analysis**: Live voice authenticity assessment with visual risk indicators

### Key Architectural Decisions

- **WebRTC for P2P**: Direct peer-to-peer audio transmission reduces latency and server load
- **AudioWorklet for Processing**: Non-blocking, low-latency audio processing in separate thread
- **Backend AI Proxy**: API keys and model access isolated to backend for security
- **WebSocket Signaling**: Bidirectional, low-latency message passing for call coordination
- **Transient Buffers**: Bounded in-memory audio buffers with automatic cleanup
- **State Machine Pattern**: Explicit call state management for reliability

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER A (CALLER)                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Browser                                                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │    │
│  │  │   UI Layer   │  │  CallManager │  │  WebSocket Client      │   │    │
│  │  │  (React)     │◄─┤  (WebRTC)    │◄─┤  (Signaling)           │   │    │
│  │  └──────────────┘  └──────┬───────┘  └────────────┬───────────┘   │    │
│  │                           │                        │               │    │
│  │                           │ Local Stream          │ Signaling     │    │
│  │                           ▼                        │ Messages      │    │
│  │                    ┌─────────────┐                │               │    │
│  │                    │ Microphone  │                │               │    │
│  │                    └─────────────┘                │               │    │
│  └────────────────────────────────────────────────────┼───────────────┘    │
└──────────────────────────────────────────────────────┼─────────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FASTAPI)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────────────────────┐      ┌─────────────────────┐                │  │
│  │  │ WebSocket          │      │  Call Session       │                │  │
│  │  │ Signaling Server   │◄────►│  Manager            │                │  │
│  │  └──────┬─────────────┘      └─────────────────────┘                │  │
│  │         │                                                            │  │
│  │         │ Presence &                                                 │  │
│  │         │ Signaling                                                  │  │
│  │         │                                                            │  │
│  │  ┌──────▼─────────────┐      ┌─────────────────────┐                │  │
│  │  │ Analysis WebSocket │      │  AI Model Proxy     │                │  │
│  │  │ Handler            │─────►│  (Secure API Key)   │────────┐       │  │
│  │  └────────────────────┘      └─────────────────────┘        │       │  │
│  │         ▲                              │                     │       │  │
│  │         │ PCM Chunks                   │ Audio Chunks       │       │  │
│  │         │                              ▼                     │       │  │
│  │  ┌──────┴─────────────┐      ┌─────────────────────┐        │       │  │
│  │  │ Audio Buffer       │      │  Risk Engine        │        │       │  │
│  │  │ (Bounded, Temp)    │      │  (Score + Level)    │        │       │  │
│  │  └────────────────────┘      └──────────┬──────────┘        │       │  │
│  │                                          │                   │       │  │
│  │                                          │ Risk Updates      │       │  │
│  │                                          ▼                   │       │  │
│  │                               ┌─────────────────────┐        │       │  │
│  │                               │  Database           │        │       │  │
│  │                               │  (Metadata Only)    │        │       │  │
│  │                               └─────────────────────┘        │       │  │
│  └──────────────────────────────────────────────────────────────┼───────┘  │
└──────────────────────────────────────────────────────────────────┼───────────┘
                                                                   │
                                                                   ▼
                                                        ┌──────────────────┐
                                                        │  External AI     │
                                                        │  Model API       │
                                                        └──────────────────┘
                                                        
                                                        
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER B (RECEIVER)                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Browser                                                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │    │
│  │  │ Risk         │  │ CallManager  │  │  WebSocket Client      │   │    │
│  │  │ Dashboard    │◄─┤  (WebRTC)    │◄─┤  (Analysis)            │   │    │
│  │  └──────────────┘  └──────┬───────┘  └────────────────────────┘   │    │
│  │                           │                                        │    │
│  │                           │ Remote Stream                          │    │
│  │                           ▼                                        │    │
│  │                    ┌─────────────────┐                            │    │
│  │                    │  AudioWorklet   │                            │    │
│  │                    │  Processor      │                            │    │
│  │                    │  • PCM Extract  │                            │    │
│  │                    │  • VAD          │                            │    │
│  │                    │  • Preprocess   │                            │    │
│  │                    └─────────────────┘                            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

                          ═════════════════════
                          WebRTC P2P Audio
                          (Direct Connection)
                          ═════════════════════
```

### Data Flow Overview

1. **Call Initiation**: Caller → Backend (WebSocket) → Callee
2. **WebRTC Negotiation**: Peer A ↔ Backend (Signaling) ↔ Peer B
3. **Audio Streaming**: Peer A ═══ (WebRTC P2P) ═══ Peer B
4. **Audio Analysis**: Receiver → AudioWorklet → Backend → AI API → Backend → Receiver Dashboard

---

## Components and Interfaces

### Frontend Components

#### 1. WebRTC Manager (`useWebRTC.js` Hook)

**Purpose**: Manages WebRTC peer connections, media streams, and call lifecycle.

**Interface**:

```javascript
// Hook API
const {
  // State
  callState,           // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  localStream,         // MediaStream | null
  remoteStream,        // MediaStream | null
  isMuted,             // boolean
  callDuration,        // number (seconds)
  
  // Actions
  initiateCall,        // (contactId: string) => Promise<void>
  acceptCall,          // () => Promise<void>
  rejectCall,          // () => Promise<void>
  endCall,             // () => Promise<void>
  toggleMute,          // () => void
  
  // Events
  onRemoteStream,      // (callback: (stream: MediaStream) => void) => void
  onCallEnded,         // (callback: () => void) => void
  onError,             // (callback: (error: Error) => void) => void
} = useWebRTC();
```

**Key Responsibilities**:
- Create and manage RTCPeerConnection instances
- Request and manage microphone access
- Handle SDP offer/answer exchange
- Process ICE candidates
- Monitor connection state
- Clean up resources on call end

**Configuration**:
```javascript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};
```

**State Machine**:
```
idle → calling → connected → ended
  ↓      ↓
  └──────┴────→ failed
  
idle → ringing → connected → ended
         ↓
      rejected
```

---

#### 2. Audio Processor (`AudioWorkletProcessor`)

**Purpose**: Extract and preprocess audio from remote MediaStream for AI analysis.

**File**: `public/audioProcessor.js` (loaded as AudioWorklet module)

**Interface**:

```javascript
// AudioWorkletProcessor Implementation
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;        // Process in 4KB chunks
    this.sampleRate = 16000;       // Target sample rate
    this.vadThreshold = 0.01;      // Voice activity threshold
  }
  
  process(inputs, outputs, parameters) {
    // Called for each audio quantum (128 samples)
    // Returns: boolean (keep processor alive)
  }
}

// Messages sent to main thread
{
  type: 'pcm_chunk',
  data: Int16Array,      // PCM samples
  timestamp: number,     // Performance.now()
  hasSpeech: boolean     // VAD result
}
```

**Processing Pipeline**:
1. Receive Float32Array from audio input
2. Convert to mono (if stereo)
3. Resample to 16kHz (if needed)
4. Apply Voice Activity Detection
5. Convert to Int16 PCM format
6. Send to main thread via postMessage

**VAD Algorithm**:
```javascript
// Simple energy-based VAD
hasVoiceActivity(samples) {
  const energy = samples.reduce((sum, s) => sum + s * s, 0) / samples.length;
  return Math.sqrt(energy) > this.vadThreshold;
}
```

---

#### 3. WebSocket Client (`useWebSocket.js` Hook)

**Purpose**: Manage WebSocket connections for signaling and analysis.

**Interface**:

```javascript
// Hook API
const {
  // State
  isConnected,          // boolean
  connectionState,      // 'connecting' | 'connected' | 'disconnected'
  
  // Actions
  sendMessage,          // (message: object) => void
  
  // Event Handlers
  onMessage,            // (callback: (message: object) => void) => void
  onStateChange,        // (callback: (state: string) => void) => void
} = useWebSocket(url, token);
```

**Message Types Handled**:
```javascript
// Signaling Messages
{
  type: 'call_initiate',
  callId: string,
  from: string,
  to: string,
  callerInfo: { name, avatar }
}

{
  type: 'sdp_offer',
  callId: string,
  sdp: RTCSessionDescription
}

{
  type: 'sdp_answer',
  callId: string,
  sdp: RTCSessionDescription
}

{
  type: 'ice_candidate',
  callId: string,
  candidate: RTCIceCandidate
}

{
  type: 'call_accept' | 'call_reject' | 'hangup',
  callId: string
}

// Analysis Messages
{
  type: 'audio_chunk',
  callId: string,
  pcm: number[],           // Int16 PCM data
  sampleRate: number,
  timestamp: number
}

{
  type: 'risk_update',
  callId: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  riskScore: number,
  confidence: number,
  recommendation: string,
  timestamp: string
}
```

---

#### 4. Risk Dashboard Component

**Purpose**: Display real-time voice authenticity risk indicators during calls.

**Component**: `<RiskDashboard />`

**Props**:
```javascript
interface RiskDashboardProps {
  callId: string;
  callerInfo: {
    name: string;
    avatar?: string;
    phoneNumber?: string;
  };
  isAnalyzing: boolean;
}
```

**Display Elements**:

1. **Risk Level Indicator** (PRIMARY)
   - Large color-coded badge
   - Colors: GREEN (LOW), YELLOW (MEDIUM), RED (HIGH)
   - Animated transitions
   
2. **Risk Score** (0-100)
   - Numeric display with progress bar
   - Updates in real-time
   
3. **Confidence Level**
   - Model confidence percentage
   - Indicates reliability of analysis
   
4. **Recommendation Text**
   - Context-aware user guidance
   - Example: "Voice appears natural. Continue call normally."
   
5. **Risk History Timeline**
   - Visual chart of risk level changes over time
   - Shows trend during call
   
6. **Acoustic Indicators** (Optional)
   - If provided by AI model
   - Displays specific audio characteristics
   
7. **Prosody Indicators** (Optional)
   - If provided by AI model
   - Speech pattern analysis results

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│  🎙️ Call with John Doe                             │
│                                                     │
│  ╔═══════════════════════════════════════════╗     │
│  ║        [🟢 LOW RISK]                      ║     │
│  ║                                           ║     │
│  ║  Risk Score: 15/100  ██░░░░░░░░           ║     │
│  ║  Confidence: 94%     ████████░░           ║     │
│  ║                                           ║     │
│  ║  ✅ Voice appears natural.                ║     │
│  ║     Continue call normally.               ║     │
│  ╚═══════════════════════════════════════════╝     │
│                                                     │
│  Risk Timeline:                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  │▁▁▁▁▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│          │
│  0s                              30s                │
│                                                     │
│  🔒 Privacy: Audio not stored                      │
└─────────────────────────────────────────────────────┘
```

---

### Backend Components

#### 1. WebSocket Signaling Server

**Module**: `backend/app/websockets/signaling.py`

**Purpose**: Route WebRTC signaling messages between peers and manage user presence.

**Endpoints**:
```python
@app.websocket("/ws/signaling")
async def websocket_signaling(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for WebRTC signaling.
    Requires JWT authentication via query parameter.
    """
    pass
```

**Connection Manager**:
```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_presence: Dict[str, bool] = {}
        
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register user connection and mark online."""
        
    async def disconnect(self, user_id: str):
        """Remove user connection and mark offline."""
        
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user."""
        
    async def broadcast_presence(self, user_id: str, status: str):
        """Broadcast user online/offline status to contacts."""
        
    def is_online(self, user_id: str) -> bool:
        """Check if user is currently connected."""
```

**Message Routing Logic**:
```python
async def handle_signaling_message(
    user_id: str,
    message: dict,
    connection_manager: ConnectionManager
):
    """
    Route signaling messages between peers.
    
    Supported message types:
    - call_initiate: Start new call
    - call_accept: Accept incoming call
    - call_reject: Reject incoming call
    - sdp_offer: WebRTC offer
    - sdp_answer: WebRTC answer
    - ice_candidate: ICE candidate
    - hangup: End call
    """
    message_type = message.get('type')
    target_user_id = message.get('to') or message.get('from')
    
    # Validate target is online
    if not connection_manager.is_online(target_user_id):
        await connection_manager.send_to_user(user_id, {
            'type': 'error',
            'message': 'User is offline'
        })
        return
    
    # Forward message to target
    await connection_manager.send_to_user(target_user_id, message)
```

**Call Session Tracking**:
```python
class CallSession:
    def __init__(self, call_id: str, caller_id: str, callee_id: str):
        self.call_id = call_id
        self.caller_id = caller_id
        self.callee_id = callee_id
        self.status = 'initiating'  # initiating, ringing, connected, ended
        self.started_at = None
        self.connected_at = None
        self.ended_at = None
        
    def to_dict(self) -> dict:
        """Serialize for database storage."""
        return {
            'call_id': self.call_id,
            'caller_id': self.caller_id,
            'callee_id': self.callee_id,
            'status': self.status,
            'started_at': self.started_at,
            'connected_at': self.connected_at,
            'ended_at': self.ended_at,
            'duration': self.calculate_duration()
        }
    
    def calculate_duration(self) -> int:
        """Calculate call duration in seconds."""
        if self.connected_at and self.ended_at:
            return int((self.ended_at - self.connected_at).total_seconds())
        return 0
```

---

#### 2. Analysis WebSocket Handler

**Module**: `backend/app/websockets/analysis.py`

**Purpose**: Receive audio chunks from receivers and coordinate AI analysis.

**Endpoints**:
```python
@app.websocket("/ws/analysis")
async def websocket_analysis(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for audio analysis.
    Receives PCM audio chunks and sends back risk updates.
    """
    pass
```

**Audio Buffer Management**:
```python
class AudioBuffer:
    def __init__(self, max_duration_seconds: int = 30):
        self.max_samples = max_duration_seconds * 16000  # 16kHz
        self.buffer: deque = deque(maxlen=self.max_samples)
        
    def append(self, pcm_chunk: List[int]):
        """Add audio samples to buffer (ring buffer)."""
        self.buffer.extend(pcm_chunk)
        
    def get_window(self, duration_seconds: float = 3.0) -> bytes:
        """Get recent audio window for analysis."""
        num_samples = int(duration_seconds * 16000)
        samples = list(itertools.islice(self.buffer, 
                                        max(0, len(self.buffer) - num_samples),
                                        len(self.buffer)))
        return struct.pack(f'{len(samples)}h', *samples)
    
    def clear(self):
        """Clear all buffered audio."""
        self.buffer.clear()
```

**Processing Pipeline**:
```python
async def process_audio_chunk(
    call_id: str,
    pcm_data: List[int],
    sample_rate: int,
    audio_buffers: Dict[str, AudioBuffer],
    ai_client: AIModelClient,
    risk_engine: RiskEngine,
    connection_manager: ConnectionManager
):
    """
    Process incoming audio chunk and generate risk update.
    
    Steps:
    1. Validate call session exists
    2. Append to bounded buffer
    3. Extract analysis window (3 seconds)
    4. Send to AI model API
    5. Calculate risk score
    6. Broadcast risk update to receiver
    """
    # Get or create buffer
    if call_id not in audio_buffers:
        audio_buffers[call_id] = AudioBuffer(max_duration_seconds=30)
    
    buffer = audio_buffers[call_id]
    buffer.append(pcm_data)
    
    # Get analysis window
    audio_window = buffer.get_window(duration_seconds=3.0)
    
    # Call AI model
    prediction = await ai_client.predict(audio_window, sample_rate)
    
    # Calculate risk
    risk_result = risk_engine.calculate_risk(prediction)
    
    # Send to client
    await connection_manager.send_to_user(receiver_id, {
        'type': 'risk_update',
        'callId': call_id,
        **risk_result
    })
```

---

#### 3. AI Model Proxy

**Module**: `backend/app/services/ai_analyzer.py`

**Purpose**: Securely interface with external AI model API for voice analysis.

**Interface**:
```python
class AIModelClient:
    def __init__(self):
        self.api_url = settings.MODEL_API_URL
        self.api_key = settings.MODEL_API_KEY
        self.timeout = settings.MODEL_TIMEOUT_SECONDS or 10
        
    async def predict(
        self,
        audio_data: bytes,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Send audio to external AI model and get prediction.
        
        Args:
            audio_data: Raw PCM audio bytes
            sample_rate: Sample rate of audio
            
        Returns:
            {
                "synthetic_probability": 0.91,
                "model_confidence": 0.94,
                "acoustic_indicators": {...},  # optional
                "prosody_indicators": {...}    # optional
            }
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/octet-stream",
                        "X-Sample-Rate": str(sample_rate)
                    },
                    content=audio_data,
                    timeout=self.timeout
                )
                
                response.raise_for_status()
                return response.json()
                
            except httpx.TimeoutException:
                logger.error("AI model timeout")
                return self._fallback_prediction()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"AI model error: {e}")
                return self._fallback_prediction()
    
    def _fallback_prediction(self) -> dict:
        """Return safe fallback when model is unavailable."""
        return {
            "synthetic_probability": 0.0,
            "model_confidence": 0.0,
            "error": "Model temporarily unavailable"
        }
```

**Mock Implementation** (for development):
```python
class MockAIModelClient(AIModelClient):
    """Mock AI model for testing without external API."""
    
    async def predict(
        self,
        audio_data: bytes,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        import random
        await asyncio.sleep(0.5)  # Simulate network delay
        
        return {
            "synthetic_probability": random.uniform(0.05, 0.85),
            "model_confidence": random.uniform(0.85, 0.98),
            "acoustic_indicators": {
                "spectral_anomaly": random.uniform(0.0, 1.0),
                "harmonic_distortion": random.uniform(0.0, 1.0)
            },
            "prosody_indicators": {
                "rhythm_consistency": random.uniform(0.0, 1.0),
                "pitch_naturalness": random.uniform(0.0, 1.0)
            }
        }
```

---

#### 4. Risk Engine

**Module**: `backend/app/services/risk_engine.py`

**Purpose**: Convert AI model predictions into application-level risk assessments.

**Interface**:
```python
class RiskEngine:
    def __init__(self):
        self.low_threshold = settings.RISK_LOW_THRESHOLD or 30
        self.high_threshold = settings.RISK_HIGH_THRESHOLD or 70
        
    def calculate_risk(self, model_prediction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate application-level risk from model prediction.
        
        Args:
            model_prediction: {
                "synthetic_probability": 0.91,
                "model_confidence": 0.94,
                ...
            }
            
        Returns:
            {
                "synthetic_confidence": 91,      # Percentage
                "model_confidence": 94,          # Percentage
                "risk_score": 85,                # Weighted score
                "risk_level": "HIGH",            # Category
                "recommendation": "...",         # User guidance
                "timestamp": "2024-01-15T10:30:00Z"
            }
        """
        synthetic_prob = model_prediction.get("synthetic_probability", 0.0)
        model_confidence = model_prediction.get("model_confidence", 0.0)
        
        # Convert to percentages
        synthetic_confidence = int(synthetic_prob * 100)
        confidence = int(model_confidence * 100)
        
        # Calculate weighted risk score
        risk_score = int(synthetic_confidence * model_confidence)
        
        # Determine risk level
        if risk_score < self.low_threshold:
            risk_level = "LOW"
            recommendation = "Voice appears natural. Continue call normally."
        elif risk_score < self.high_threshold:
            risk_level = "MEDIUM"
            recommendation = (
                "Moderate synthetic indicators detected. "
                "Stay alert and verify caller identity if needed."
            )
        else:
            risk_level = "HIGH"
            recommendation = (
                "Possible synthetic voice detected. "
                "Perform independent caller verification before sharing sensitive information."
            )
        
        return {
            "synthetic_confidence": synthetic_confidence,
            "model_confidence": confidence,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "acoustic_indicators": model_prediction.get("acoustic_indicators"),
            "prosody_indicators": model_prediction.get("prosody_indicators"),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
```

**Risk Level Definitions**:
- **LOW (0-30)**: Voice shows natural characteristics
- **MEDIUM (31-70)**: Some synthetic indicators present
- **HIGH (71-100)**: Strong synthetic indicators detected

**Note**: These thresholds are configurable application policy, not universal scientific standards.

---

#### 5. Call History Service

**Module**: `backend/app/services/call_history.py`

**Purpose**: Persist call metadata and risk analysis results to database.

**Interface**:
```python
class CallHistoryService:
    def __init__(self, db: Session):
        self.db = db
        
    async def create_call_record(
        self,
        call_session: CallSession,
        final_risk_level: str = None,
        final_risk_score: int = None
    ) -> CallHistory:
        """
        Create call history record after call ends.
        
        Args:
            call_session: Active call session data
            final_risk_level: Last risk level (HIGH/MEDIUM/LOW)
            final_risk_score: Last risk score (0-100)
            
        Returns:
            CallHistory database record
        """
        call_history = CallHistory(
            id=call_session.call_id,
            caller_id=call_session.caller_id,
            callee_id=call_session.callee_id,
            started_at=call_session.started_at,
            ended_at=call_session.ended_at,
            duration_seconds=call_session.calculate_duration(),
            status=call_session.status,
            risk_level=final_risk_level,
            risk_score=final_risk_score
        )
        
        self.db.add(call_history)
        await self.db.commit()
        await self.db.refresh(call_history)
        
        return call_history
    
    async def get_user_call_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[CallHistory]:
        """Get recent call history for user."""
        query = (
            self.db.query(CallHistory)
            .filter(
                or_(
                    CallHistory.caller_id == user_id,
                    CallHistory.callee_id == user_id
                )
            )
            .order_by(CallHistory.started_at.desc())
            .limit(limit)
        )
        
        return await query.all()
```

---

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_online ON users(is_online);
```

#### Call History Table
```sql
CREATE TABLE call_history (
    id UUID PRIMARY KEY,
    caller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    callee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,  -- 'completed', 'rejected', 'failed'
    risk_level VARCHAR(20),       -- 'LOW', 'MEDIUM', 'HIGH'
    risk_score INTEGER,           -- 0-100
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_duration CHECK (duration_seconds >= 0),
    CONSTRAINT valid_risk_score CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_call_history_caller ON call_history(caller_id);
CREATE INDEX idx_call_history_callee ON call_history(callee_id);
CREATE INDEX idx_call_history_started ON call_history(started_at DESC);
CREATE INDEX idx_call_history_risk ON call_history(risk_level);
```

#### Contacts Table (Optional - if not using simple user lookup)
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    nickname VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, contact_user_id)
);

CREATE INDEX idx_contacts_user ON contacts(user_id);
```

### SQLAlchemy Models

```python
# backend/app/models/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone_number = Column(String(50))
    avatar_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen = Column(DateTime, index=True)
    is_online = Column(Boolean, default=False, index=True)
    
    # Relationships
    calls_initiated = relationship("CallHistory", foreign_keys="CallHistory.caller_id")
    calls_received = relationship("CallHistory", foreign_keys="CallHistory.callee_id")
```

```python
# backend/app/models/call_history.py
class CallHistory(Base):
    __tablename__ = "call_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    caller_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    callee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, index=True)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer, default=0)
    status = Column(String(50), nullable=False)
    risk_level = Column(String(20), index=True)
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    caller = relationship("User", foreign_keys=[caller_id])
    callee = relationship("User", foreign_keys=[callee_id])
```

### Pydantic Schemas

```python
# backend/app/schemas/call.py
class CallInitiateRequest(BaseModel):
    to_user_id: str
    
class CallResponse(BaseModel):
    call_id: str
    caller_id: str
    callee_id: str
    status: str
    started_at: datetime
    
class RiskUpdate(BaseModel):
    call_id: str
    synthetic_confidence: int
    model_confidence: int
    risk_score: int
    risk_level: str
    recommendation: str
    acoustic_indicators: Optional[dict] = None
    prosody_indicators: Optional[dict] = None
    timestamp: str
    
class CallHistoryResponse(BaseModel):
    id: str
    caller: UserBasic
    callee: UserBasic
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: int
    status: str
    risk_level: Optional[str]
    risk_score: Optional[int]
    
    class Config:
        orm_mode = True
```

### WebSocket Message Formats

All WebSocket messages follow this structure:
```json
{
  "type": "message_type",
  "callId": "uuid",
  "...additional_fields"
}
```

**Complete Message Catalog**:

1. **call_initiate**
```json
{
  "type": "call_initiate",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-1",
  "to": "user-uuid-2",
  "callerInfo": {
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

2. **call_accept**
```json
{
  "type": "call_accept",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-2"
}
```

3. **call_reject**
```json
{
  "type": "call_reject",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-2",
  "reason": "busy"
}
```

4. **sdp_offer**
```json
{
  "type": "sdp_offer",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-1",
  "to": "user-uuid-2",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=- 123456..."
  }
}
```

5. **sdp_answer**
```json
{
  "type": "sdp_answer",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-2",
  "to": "user-uuid-1",
  "sdp": {
    "type": "answer",
    "sdp": "v=0\r\no=- 789012..."
  }
}
```

6. **ice_candidate**
```json
{
  "type": "ice_candidate",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-1",
  "to": "user-uuid-2",
  "candidate": {
    "candidate": "candidate:1234...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

7. **hangup**
```json
{
  "type": "hangup",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "user-uuid-1"
}
```

8. **audio_chunk** (Analysis WebSocket)
```json
{
  "type": "audio_chunk",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "pcm": [1234, 5678, ...],
  "sampleRate": 16000,
  "channels": 1,
  "timestamp": 1234567890.123
}
```

9. **risk_update** (Analysis WebSocket)
```json
{
  "type": "risk_update",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "synthetic_confidence": 85,
  "model_confidence": 92,
  "risk_score": 78,
  "risk_level": "MEDIUM",
  "recommendation": "Stay alert and verify caller identity if needed.",
  "acoustic_indicators": {
    "spectral_anomaly": 0.65
  },
  "prosody_indicators": {
    "rhythm_consistency": 0.72
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

10. **user_presence**
```json
{
  "type": "user_presence",
  "userId": "user-uuid-2",
  "status": "online" | "offline",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

11. **error**
```json
{
  "type": "error",
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "USER_OFFLINE",
  "message": "The user you are trying to call is offline",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

## Error Handling

### Frontend Error Categories

1. **Microphone Access Errors**
```javascript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied microphone permission
    showError('Microphone access denied. Please grant permission to make calls.');
  } else if (error.name === 'NotFoundError') {
    // No microphone found
    showError('No microphone found. Please connect a microphone.');
  } else if (error.name === 'NotReadableError') {
    // Microphone in use by another application
    showError('Microphone is already in use. Please close other applications.');
  }
}
```

2. **WebRTC Connection Errors**
```javascript
peerConnection.oniceconnectionstatechange = () => {
  const state = peerConnection.iceConnectionState;
  
  switch (state) {
    case 'failed':
      showError('Connection failed. Please check your internet connection.');
      attemptReconnect();
      break;
      
    case 'disconnected':
      showWarning('Connection unstable. Attempting to reconnect...');
      break;
      
    case 'closed':
      cleanup();
      break;
  }
};
```

3. **WebSocket Errors**
```javascript
websocket.onerror = (error) => {
  console.error('WebSocket error:', error);
  showError('Connection to server lost. Attempting to reconnect...');
  scheduleReconnect();
};

websocket.onclose = (event) => {
  if (!event.wasClean) {
    showError('Connection closed unexpectedly.');
    scheduleReconnect();
  }
};
```

4. **Browser Compatibility Errors**
```javascript
if (!navigator.mediaDevices || !window.RTCPeerConnection) {
  showError(
    'Your browser does not support voice calling. ' +
    'Please use a modern browser like Chrome, Firefox, or Edge.'
  );
}

if (!window.AudioWorklet) {
  showWarning(
    'Your browser has limited audio processing support. ' +
    'Voice analysis may not be available.'
  );
}
```

### Backend Error Handling

1. **WebSocket Connection Errors**
```python
@app.websocket("/ws/signaling")
async def websocket_signaling(websocket: WebSocket, token: str = Query(...)):
    try:
        # Authenticate
        user = await authenticate_websocket(token)
        if not user:
            await websocket.close(code=1008, reason="Authentication failed")
            return
        
        # Accept connection
        await connection_manager.connect(user.id, websocket)
        
        # Handle messages
        while True:
            data = await websocket.receive_json()
            await handle_signaling_message(user.id, data, connection_manager)
            
    except WebSocketDisconnect:
        await connection_manager.disconnect(user.id)
        logger.info(f"User {user.id} disconnected")
        
    except Exception as e:
        logger.error(f"WebSocket error for user {user.id}: {e}")
        await connection_manager.disconnect(user.id)
        await websocket.close(code=1011, reason="Internal server error")
```

2. **AI Model Errors**
```python
async def process_audio_chunk(call_id: str, pcm_data: List[int]):
    try:
        prediction = await ai_client.predict(audio_data)
    except ModelTimeoutError:
        logger.error(f"AI model timeout for call {call_id}")
        # Send degraded risk update with error flag
        await send_risk_update(call_id, {
            "risk_level": "UNKNOWN",
            "error": "Analysis temporarily unavailable"
        })
    except ModelAuthError:
        logger.critical("AI model authentication failed - check API key")
        # Critical error - notify admin
        await notify_admin("Model API authentication failure")
    except Exception as e:
        logger.error(f"Unexpected error in audio processing: {e}")
```

3. **Database Errors**
```python
async def create_call_record(call_session: CallSession):
    try:
        call_history = CallHistory(**call_session.to_dict())
        db.add(call_history)
        await db.commit()
    except IntegrityError as e:
        logger.error(f"Database integrity error: {e}")
        await db.rollback()
        raise HTTPException(status_code=409, detail="Call record already exists")
    except Exception as e:
        logger.error(f"Database error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save call record")
```

### Error Recovery Strategies

1. **Automatic Reconnection**
```javascript
class ReconnectManager {
  constructor(maxAttempts = 5, baseDelay = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.currentAttempt = 0;
  }
  
  async reconnect(connectFunction) {
    while (this.currentAttempt < this.maxAttempts) {
      const delay = this.baseDelay * Math.pow(2, this.currentAttempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        await connectFunction();
        this.currentAttempt = 0; // Reset on success
        return true;
      } catch (error) {
        this.currentAttempt++;
        console.log(`Reconnect attempt ${this.currentAttempt} failed`);
      }
    }
    
    return false;
  }
}
```

2. **Graceful Degradation**
```javascript
// If AudioWorklet not supported, fall back to ScriptProcessorNode
async function createAudioProcessor(audioContext, remoteStream) {
  if (audioContext.audioWorklet) {
    try {
      await audioContext.audioWorklet.addModule('/audioProcessor.js');
      return new AudioWorkletNode(audioContext, 'audio-processor');
    } catch (error) {
      console.warn('AudioWorklet failed, using fallback');
    }
  }
  
  // Fallback to ScriptProcessorNode (deprecated but widely supported)
  return createScriptProcessorFallback(audioContext);
}
```

3. **Timeout Protection**
```python
async def call_external_api_with_timeout(url: str, data: bytes, timeout: int = 10):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, content=data, timeout=timeout)
            return response.json()
    except httpx.TimeoutException:
        logger.error(f"API call timeout after {timeout}s")
        return None
```

---

## Testing Strategy

### Unit Tests

**Frontend Unit Tests** (Jest + React Testing Library):

1. **WebRTC Manager Tests**
   - Test call initiation with valid contact
   - Test call rejection flow
   - Test mute/unmute functionality
   - Test cleanup on call end
   - Test error handling for permission denied

2. **WebSocket Client Tests**
   - Test connection establishment
   - Test message sending and receiving
   - Test reconnection logic
   - Test authentication failure handling

3. **Risk Dashboard Tests**
   - Test rendering with different risk levels
   - Test updates on risk change
   - Test color transitions
   - Test recommendation display

**Backend Unit Tests** (pytest):

1. **Connection Manager Tests**
   - Test user connection tracking
   - Test message routing between users
   - Test presence broadcast
   - Test cleanup on disconnect

2. **Audio Buffer Tests**
   - Test bounded buffer behavior
   - Test window extraction
   - Test buffer clearing

3. **Risk Engine Tests**
   - Test risk score calculation
   - Test risk level categorization
   - Test threshold boundaries
   - Test recommendation generation

4. **AI Client Tests**
   - Test successful prediction
   - Test timeout handling
   - Test authentication error handling
   - Test fallback behavior

### Integration Tests

1. **End-to-End Call Flow**
   - User A initiates call to User B
   - User B accepts call
   - WebRTC connection established
   - Audio streams successfully
   - Either user ends call
   - Call history created

2. **Presence System**
   - User connects → marked online
   - Contacts receive presence update
   - User disconnects → marked offline
   - Contacts receive presence update

3. **Audio Analysis Pipeline**
   - Remote stream captured
   - AudioWorklet processes audio
   - PCM data sent to backend
   - Backend calls AI model
   - Risk update sent to frontend
   - Dashboard updates

4. **Error Scenarios**
   - Call to offline user → error message
   - Microphone permission denied → error shown
   - WebRTC connection fails → fallback/retry
   - AI model timeout → graceful degradation

### Mock Services for Testing

```python
# backend/tests/mocks.py
class MockAIModelClient:
    async def predict(self, audio_data: bytes, sample_rate: int = 16000):
        return {
            "synthetic_probability": 0.15,
            "model_confidence": 0.92
        }

class MockConnectionManager:
    def __init__(self):
        self.connections = {}
        
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.connections:
            await self.connections[user_id].send_json(message)
```

```javascript
// frontend/src/tests/mocks.js
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
    this.listeners = {};
  }
  
  send(data) {
    // Mock sending
  }
  
  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }
  
  simulateMessage(data) {
    this.listeners['message']?.({ data: JSON.stringify(data) });
  }
}
```

### Performance Testing

1. **Audio Processing Performance**
   - Measure AudioWorklet processing latency
   - Target: < 50ms per chunk
   - Monitor CPU usage

2. **WebSocket Throughput**
   - Test concurrent connections
   - Target: 100+ simultaneous calls
   - Monitor memory usage

3. **Risk Update Latency**
   - Measure end-to-end analysis time
   - Target: < 2 seconds from audio to dashboard update

### Browser Compatibility Testing

Test on:
- Chrome/Edge (Chromium) - Primary
- Firefox - Secondary
- Safari - Secondary
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Security Considerations

### Authentication

1. **JWT Token Security**
```python
# Token generation
def create_access_token(user_id: str, expires_delta: timedelta = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

2. **WebSocket Authentication**
```python
async def authenticate_websocket(token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        user = await get_user_by_id(user_id)
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```

### API Key Protection

```python
# .env
MODEL_API_KEY=sk_live_xxxxxxxxxxxxx

# config.py
class Settings(BaseSettings):
    MODEL_API_KEY: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# NEVER expose API key to frontend
```

### Audio Privacy

1. **No Persistent Storage**
   - Raw audio NEVER written to disk
   - Buffers cleared on call end
   - No audio in logs or error messages

2. **Transient Processing**
   - Audio exists only in bounded memory
   - Maximum buffer: 30 seconds
   - Automatic cleanup on disconnect

3. **Database Constraints**
```sql
-- Explicitly NO audio columns
-- Only metadata stored
CREATE TABLE call_history (
    -- NO audio_data
    -- NO recording_path
    -- NO wav_file
    -- ONLY metadata
);
```

### CORS Configuration

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Development
        "https://voiceshield.example.com"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting (Recommended)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    # Login logic
    pass
```

---

## File Structure

### New Files to Create

```
frontend/
├── public/
│   └── audioProcessor.js                    # AudioWorklet processor
│
├── src/
│   ├── hooks/
│   │   ├── useWebRTC.js                    # WebRTC management hook
│   │   ├── useWebSocket.js                 # WebSocket connection hook
│   │   └── useAudioProcessor.js            # Audio processing hook
│   │
│   ├── components/
│   │   ├── IncomingCallModal.jsx           # Incoming call notification
│   │   ├── RiskDashboard.jsx               # Real-time risk display
│   │   ├── CallControls.jsx                # Mute, end call buttons
│   │   └── PresenceIndicator.jsx           # Online/offline status
│   │
│   ├── pages/
│   │   └── ActiveCallPage.jsx              # Active call UI (update)
│   │
│   ├── services/
│   │   ├── webrtc.js                       # WebRTC helper functions
│   │   └── audioUtils.js                   # Audio processing utilities
│   │
│   └── context/
│       └── CallContext.jsx                 # Global call state (update)

backend/
├── app/
│   ├── websockets/
│   │   ├── signaling.py                    # WebRTC signaling WebSocket
│   │   ├── analysis.py                     # Audio analysis WebSocket
│   │   └── connection_manager.py           # Connection tracking (update)
│   │
│   ├── services/
│   │   ├── ai_analyzer.py                  # AI model client (update)
│   │   ├── risk_engine.py                  # Risk calculation (NEW)
│   │   ├── call_session_manager.py         # Call state tracking (NEW)
│   │   └── call_history.py                 # Call history service (NEW)
│   │
│   ├── models/
│   │   ├── call_history.py                 # Call history model (NEW)
│   │   └── call_session.py                 # In-memory call session (NEW)
│   │
│   ├── schemas/
│   │   └── call.py                         # Call-related schemas (NEW)
│   │
│   └── routers/
│       └── calls.py                        # Call history API (update)
│
└── alembic/
    └── versions/
        └── xxx_add_call_history.py         # Database migration (NEW)
```

### Existing Files to Modify

```
frontend/
├── src/
│   ├── context/
│   │   └── CallContext.jsx                 # Add WebRTC state management
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx                   # Add online presence
│   │   ├── ActiveCallPage.jsx              # Add risk dashboard
│   │   └── CallHistoryPage.jsx             # Display risk analysis
│   │
│   └── services/
│       └── api.js                          # Add call history endpoints

backend/
├── app/
│   ├── main.py                             # Register WebSocket routes
│   ├── config.py                           # Add risk thresholds
│   ├── database.py                         # No changes needed
│   │
│   ├── models/
│   │   └── user.py                         # Add is_online field
│   │
│   └── routers/
│       └── calls.py                        # Add call history endpoint
```

### Configuration Files

```env
# .env
MODEL_API_URL=https://api.voicemodel.example.com/predict
MODEL_API_KEY=sk_live_xxxxxxxxxxxxx
MODEL_TIMEOUT_SECONDS=10

# Risk thresholds (configurable)
RISK_LOW_THRESHOLD=30
RISK_HIGH_THRESHOLD=70

# WebRTC STUN servers (default: Google)
STUN_SERVER_URL=stun:stun.l.google.com:19302

# Optional TURN server (for NAT traversal)
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=username
TURN_PASSWORD=password
```

---

## Implementation Notes

### Development Workflow

1. **Phase 1: WebSocket Signaling** (Backend)
   - Implement connection manager
   - Add signaling WebSocket endpoint
   - Test message routing between users

2. **Phase 2: WebRTC Integration** (Frontend)
   - Create useWebRTC hook
   - Implement call initiation flow
   - Test peer connection establishment

3. **Phase 3: Audio Processing** (Frontend)
   - Create AudioWorklet processor
   - Implement PCM extraction
   - Test audio chunk transmission

4. **Phase 4: AI Integration** (Backend)
   - Create AI model client
   - Implement audio analysis WebSocket
   - Integrate risk engine

5. **Phase 5: Risk Dashboard** (Frontend)
   - Create RiskDashboard component
   - Implement real-time updates
   - Add visual indicators

6. **Phase 6: Call History** (Backend + Frontend)
   - Create database migration
   - Implement call history service
   - Add history API and UI

### Testing Approach

1. **Mock Mode First**
   - Use MockAIModelClient for development
   - Test all flows without external API dependency

2. **Integration Testing**
   - Test with real WebRTC connections
   - Verify audio processing pipeline
   - Validate risk updates

3. **Production Testing**
   - Switch to real AI model API
   - Monitor latency and errors
   - Verify privacy compliance

### Deployment Checklist

- [ ] Set production MODEL_API_KEY
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS with SSL certificate
- [ ] Configure TURN server (if needed)
- [ ] Test browser compatibility
- [ ] Monitor audio processing performance
- [ ] Verify no audio persistence
- [ ] Set up error logging (no audio in logs)
- [ ] Configure rate limiting
- [ ] Test call history retrieval

---

## Appendix

### WebRTC Connection Flow Diagram

```
Caller                  Signaling Server              Callee
  │                            │                         │
  ├──────call_initiate────────>│                         │
  │                            ├────call_initiate───────>│
  │                            │                         │
  │                            │<────call_accept─────────┤
  │<─────call_accepted─────────┤                         │
  │                            │                         │
  ├──────sdp_offer───────────>│                         │
  │                            ├────sdp_offer──────────>│
  │                            │                         │
  │                            │<────sdp_answer──────────┤
  │<─────sdp_answer────────────┤                         │
  │                            │                         │
  ├──────ice_candidate───────>│                         │
  │                            ├────ice_candidate──────>│
  │                            │                         │
  │<─────ice_candidate─────────┤<────ice_candidate───────┤
  │                            │                         │
  │                                                      │
  │════════════ WebRTC P2P Connection ══════════════════│
  │                                                      │
  │◄══════════ Bidirectional Audio Stream ═════════════►│
```

### Audio Processing Flow Diagram

```
Remote MediaStream
      │
      ▼
AudioContext.createMediaStreamSource()
      │
      ▼
AudioWorkletNode
  (audioProcessor.js)
      │
      ├─► process() called every 128 samples
      │   ├─► Accumulate to buffer (4096 samples)
      │   ├─► Convert Float32 → Int16 PCM
      │   └─► Post message to main thread
      │
      ▼
Main Thread
      │
      ├─► Receive PCM chunks
      ├─► Apply VAD (optional)
      └─► Send via WebSocket
      │
      ▼
Backend Analysis WS
      │
      ├─► Buffer audio (bounded, 30s max)
      ├─► Extract analysis window (3s)
      └─► Call AI model API
      │
      ▼
AI Model API
      │
      └─► Return prediction
      │
      ▼
Risk Engine
      │
      ├─► Calculate risk score
      ├─► Determine risk level
      └─► Generate recommendation
      │
      ▼
WebSocket → Frontend
      │
      ▼
RiskDashboard
  (Update UI)
```

### Risk Calculation Example

```
AI Model Prediction:
  synthetic_probability = 0.85
  model_confidence = 0.92

Calculation:
  synthetic_confidence = 85%
  model_confidence = 92%
  risk_score = 85 * 0.92 = 78

Risk Level:
  if risk_score < 30: LOW
  elif risk_score < 70: MEDIUM
  else: HIGH
  
Result: HIGH (78 > 70)

Recommendation:
  "Possible synthetic voice detected. Perform independent 
   caller verification before sharing sensitive information."
```

### Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ | ✅ | ✅ | ✅ |
| AudioWorklet | ✅ | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |
| MediaDevices API | ✅ | ✅ | ✅ | ✅ |

**Minimum Versions**:
- Chrome: 66+
- Firefox: 76+
- Safari: 14.1+
- Edge: 79+

---

**Document Version:** 1.0  
**Created:** January 15, 2024  
**Status:** Ready for Implementation
