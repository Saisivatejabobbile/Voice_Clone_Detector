# Implementation Plan: WebRTC Voice Calling

## Overview

This implementation plan breaks down the WebRTC Voice Calling feature into discrete, actionable coding tasks. The plan follows a modular approach, building from foundational infrastructure through to end-to-end integration and testing. Each task is designed to be completed incrementally, with frequent validation points to ensure system integrity.

**Implementation Stack:**
- **Backend**: Python with FastAPI, SQLAlchemy, WebSockets
- **Frontend**: JavaScript/React with WebRTC APIs, AudioWorklet
- **Architecture**: Modular separation between WebRTC, Audio Processing, AI Analysis, and UI layers

**Key Principles:**
- Incremental development with continuous validation
- Clear separation of concerns across modules
- Security-first approach (API keys backend-only, no audio persistence)
- Real-time processing with bounded in-memory buffers

---

## Tasks

### 1. Backend Foundation - Database Schema and Models

- [x] 1.1 Create database migration for call_history table
  - Add `call_history` table with columns: id (UUID), caller_id, callee_id, started_at, ended_at, duration_seconds, status, risk_level, risk_score, created_at
  - Add foreign key constraints to users table
  - Add indexes on caller_id, callee_id, started_at, risk_level
  - Add CHECK constraints for valid duration (>= 0) and risk_score (0-100)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.2 Update User model with presence tracking fields
  - Add `is_online` boolean field (default: False) with index
  - Add `last_seen` timestamp field with index
  - Add relationships for calls_initiated and calls_received to CallHistory
  - _Requirements: 16.1, 16.2, 16.3_

- [x] 1.3 Create CallHistory SQLAlchemy model
  - Implement model with all fields from migration
  - Add relationships to User model (caller and callee)
  - Implement `__repr__` for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 1.4 Create CallSession in-memory data class
  - Implement dataclass with fields: call_id, caller_id, callee_id, status, started_at, connected_at, ended_at
  - Add status state tracking: initiating, ringing, accepted, connected, ended, rejected, failed
  - Implement `calculate_duration()` method
  - Implement `to_dict()` method for serialization
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 1.5 Create Pydantic schemas for call operations
  - Create CallInitiateRequest schema (to_user_id)
  - Create CallResponse schema (call_id, caller_id, callee_id, status, started_at)
  - Create RiskUpdate schema (call_id, synthetic_confidence, model_confidence, risk_score, risk_level, recommendation, optional indicators, timestamp)
  - Create CallHistoryResponse schema with ORM mode enabled
  - _Requirements: 2.1, 8.2, 15.2, 15.3, 15.4_

---

### 2. Backend WebSocket Signaling Infrastructure

- [x] 2.1 Implement ConnectionManager for WebSocket tracking
  - Create ConnectionManager class with active_connections dict (user_id -> WebSocket)
  - Implement `connect(user_id, websocket)` method to register connections
  - Implement `disconnect(user_id)` method to remove connections
  - Implement `send_to_user(user_id, message)` method for targeted messaging
  - Implement `is_online(user_id)` method to check user availability
  - Implement `broadcast_presence(user_id, status)` method for online/offline notifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 16.1, 16.2, 16.3_

- [x] 2.2 Create WebSocket authentication helper
  - Implement `authenticate_websocket(token: str)` function using JWT
  - Decode token and extract user_id from "sub" claim
  - Query database for user and return User object or None
  - Handle ExpiredSignatureError and InvalidTokenError exceptions
  - _Requirements: 1.1_

- [x] 2.3 Implement CallSessionManager for active call tracking
  - Create CallSessionManager class with active_sessions dict (call_id -> CallSession)
  - Implement `create_session(call_id, caller_id, callee_id)` method
  - Implement `get_session(call_id)` method
  - Implement `update_session_status(call_id, status)` method
  - Implement `end_session(call_id)` method that returns final CallSession
  - Implement `cleanup_user_sessions(user_id)` for disconnect handling
  - _Requirements: 1.3, 7.1, 7.2, 7.3, 7.4_

- [x] 2.4 Implement signaling message routing logic
  - Create `handle_signaling_message(user_id, message, connection_manager, session_manager)` async function
  - Handle message types: call_initiate, call_accept, call_reject, sdp_offer, sdp_answer, ice_candidate, hangup
  - Validate target user is online before forwarding messages
  - Send error message if target user is offline
  - Forward message to target user via connection_manager
  - Update call session status appropriately
  - _Requirements: 1.5, 2.4, 2.5, 2.6, 3.4, 3.5, 6.3, 6.4, 6.5_

- [x] 2.5 Create WebSocket signaling endpoint
  - Create `/ws/signaling` WebSocket endpoint with token query parameter
  - Authenticate user using JWT token
  - Accept WebSocket connection and register with ConnectionManager
  - Mark user as online in database
  - Broadcast online presence to user's contacts
  - Enter message receive loop handling incoming signaling messages
  - Handle WebSocketDisconnect: mark offline, cleanup sessions, broadcast offline presence
  - Handle errors: log, cleanup, close connection gracefully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 16.1, 16.2, 16.3_

---

### 3. Backend AI Integration and Risk Analysis

- [x] 3.1 Create AI Model client with secure API key storage
  - Implement AIModelClient class reading MODEL_API_URL and MODEL_API_KEY from settings
  - Implement async `predict(audio_data: bytes, sample_rate: int)` method
  - Use httpx.AsyncClient to POST audio with Authorization header (Bearer token)
  - Set X-Sample-Rate header
  - Parse JSON response: synthetic_probability, model_confidence, optional acoustic/prosody indicators
  - Handle TimeoutException: log error and return fallback prediction
  - Handle HTTPStatusError: log error and return fallback prediction
  - Implement `_fallback_prediction()` returning safe defaults (0.0, 0.0, error message)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 3.2 Create MockAIModelClient for development and testing
  - Extend AIModelClient with mock implementation
  - Generate random synthetic_probability (0.05-0.85) and model_confidence (0.85-0.98)
  - Include optional acoustic_indicators and prosody_indicators with random values
  - Add simulated network delay (0.5s) using asyncio.sleep
  - _Requirements: 15.1, 15.2_

- [x] 3.3 Implement Risk Engine for score calculation
  - Create RiskEngine class with configurable thresholds (default: LOW < 30, HIGH >= 70)
  - Implement `calculate_risk(model_prediction: dict)` method
  - Extract synthetic_probability and model_confidence from prediction
  - Calculate risk_score = synthetic_confidence * model_confidence
  - Determine risk_level: LOW (< 30), MEDIUM (30-70), HIGH (>= 70)
  - Generate context-aware recommendation based on risk_level
  - Return dict with synthetic_confidence, model_confidence, risk_score, risk_level, recommendation, indicators, timestamp
  - _Requirements: 15.2, 15.3, 15.4_

- [x] 3.4 Implement AudioBuffer for transient audio storage
  - Create AudioBuffer class with bounded deque (max_samples based on duration)
  - Implement `append(pcm_chunk: List[int])` method using ring buffer
  - Implement `get_window(duration_seconds: float)` method to extract recent samples
  - Implement `clear()` method to release memory
  - Use max_duration_seconds = 30 for bounded buffer
  - _Requirements: 11.6, 13.1, 13.2, 13.5_

- [x] 3.5 Create audio processing pipeline handler
  - Implement async `process_audio_chunk(call_id, pcm_data, sample_rate, audio_buffers, ai_client, risk_engine, connection_manager)` function
  - Get or create AudioBuffer for call_id
  - Append pcm_data to buffer
  - Extract 3-second analysis window
  - Call ai_client.predict() with audio window
  - Calculate risk using risk_engine
  - Send risk_update message to receiver via connection_manager
  - Handle exceptions gracefully with logging
  - _Requirements: 11.2, 11.4, 11.5, 15.1, 15.4, 15.5_

- [x] 3.6 Create analysis WebSocket endpoint
  - Create `/ws/analysis` WebSocket endpoint with token query parameter
  - Authenticate user using JWT token
  - Accept WebSocket connection
  - Initialize audio_buffers dict for active calls
  - Enter message receive loop handling audio_chunk messages
  - Call process_audio_chunk for each received audio chunk
  - Handle WebSocketDisconnect: cleanup audio buffers, log disconnect
  - Handle errors: log, cleanup buffers, close connection
  - _Requirements: 11.5, 11.7, 15.1, 15.4_

---

### 4. Backend Call History and Cleanup

- [x] 4.1 Implement CallHistoryService
  - Create CallHistoryService class with db session injection
  - Implement async `create_call_record(call_session: CallSession, final_risk_level, final_risk_score)` method
  - Create CallHistory instance from call_session data
  - Add to database, commit, and refresh
  - Handle IntegrityError with rollback and appropriate error
  - Handle general exceptions with rollback and logging
  - Implement async `get_user_call_history(user_id, limit=50)` method
  - Query CallHistory where user is caller OR callee
  - Order by started_at descending, apply limit
  - Return list of CallHistory records
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.2 Integrate call cleanup on hangup
  - Update signaling message handler to detect hangup messages
  - Retrieve CallSession from session_manager
  - Update session status to "ended" and set ended_at timestamp
  - Extract final risk level and score from most recent risk_update (store in session or use last known)
  - Call call_history_service.create_call_record()
  - Remove session from active_sessions
  - Clear audio buffer for call_id if exists
  - Forward hangup message to other participant
  - _Requirements: 6.3, 6.4, 6.5, 8.1, 8.5_

- [x] 4.3 Implement cleanup on unexpected disconnect
  - Update ConnectionManager.disconnect() to accept session_manager and call_history_service
  - Call session_manager.cleanup_user_sessions(user_id)
  - For each active session involving the user, create call_history record with status "failed"
  - Send hangup notification to other participant
  - Clear audio buffers for all user's call sessions
  - _Requirements: 1.3, 9.2_

- [x] 4.4 Create call history API endpoint
  - Create GET `/api/calls/history` endpoint requiring authentication
  - Call call_history_service.get_user_call_history(current_user.id)
  - Return list of CallHistoryResponse schemas
  - Include caller and callee user information (name, avatar)
  - _Requirements: 8.2, 8.3, 8.4_

---

### 5. Frontend WebRTC Manager Hook

- [x] 5.1 Create WebRTC configuration and state types
  - Define RTCConfiguration with Google STUN servers
  - Define CallState type: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'
  - Define useWebRTC hook interface with state and action methods
  - _Requirements: 2.1, 7.1, 7.2_

- [x] 5.2 Implement useWebRTC hook core state management (implemented via useSimplePeerCall)
  - Create useWebRTC custom hook
  - Initialize state: callState, localStream, remoteStream, isMuted, callDuration, peerConnection, currentCallId
  - Implement callState state machine transitions
  - Set up cleanup on unmount (stop streams, close peer connection)
  - _Requirements: 2.7, 5.5, 7.1, 7.2_

- [x] 5.3 Implement microphone access and local stream management
  - Implement async `requestMicrophoneAccess()` function
  - Call navigator.mediaDevices.getUserMedia({ audio: true })
  - Handle NotAllowedError, NotFoundError, NotReadableError with appropriate error messages
  - Store localStream in state
  - Implement `stopLocalStream()` function to stop all tracks and release microphone
  - _Requirements: 2.2, 2.3, 5.1, 9.1_

- [x] 5.4 Implement peer connection creation and setup
  - Implement `createPeerConnection(callId)` function
  - Create RTCPeerConnection with STUN configuration
  - Add localStream tracks to peer connection
  - Set up ontrack handler to receive remoteStream and update state
  - Set up onicecandidate handler to send ICE candidates via WebSocket
  - Set up oniceconnectionstatechange handler to monitor connection state (failed, disconnected, closed)
  - Set up event handlers for connection lifecycle
  - Store peerConnection in state
  - _Requirements: 2.4, 4.1, 4.6, 4.7, 5.2, 5.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.5 Implement call initiation flow
  - Implement `initiateCall(contactId)` async function
  - Generate unique call_id using UUID
  - Request microphone access
  - Update callState to 'calling'
  - Create peer connection
  - Send call_initiate message to signaling WebSocket with caller info
  - Store currentCallId in state
  - Navigate to ActiveCallPage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

- [x] 5.6 Implement incoming call acceptance flow
  - Implement `acceptCall()` async function
  - Request microphone access
  - Send call_accept message via signaling WebSocket
  - Update callState to 'accepted'
  - Create peer connection
  - Wait for SDP offer from caller
  - _Requirements: 3.4, 4.1_

- [x] 5.7 Implement call rejection flow
  - Implement `rejectCall()` function
  - Send call_reject message via signaling WebSocket
  - Update callState to 'idle'
  - Close incoming call modal
  - _Requirements: 3.5, 3.6_

- [x] 5.8 Implement SDP offer/answer exchange
  - Implement `handleSDPOffer(sdp)` async function: set remote description, create answer, set local description, send sdp_answer
  - Implement `handleSDPAnswer(sdp)` async function: set remote description
  - Implement `createOffer()` async function: create offer, set local description, send sdp_offer
  - Integrate with signaling message handlers
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 5.9 Implement ICE candidate handling
  - Implement `handleICECandidate(candidate)` function
  - Add received ICE candidate to peer connection
  - Handle errors if peer connection not ready
  - _Requirements: 4.6, 4.7, 10.3, 10.4_

- [x] 5.10 Implement call controls (mute, unmute, end)
  - Implement `toggleMute()` function to enable/disable local audio track
  - Update isMuted state
  - Implement `endCall()` function: send hangup message, close peer connection, stop streams, update callState to 'ended'
  - Implement call duration tracking with setInterval (start on 'connected', stop on 'ended')
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 5.11 Implement connection state monitoring and error handling
  - Handle ICE connection state 'failed': display error, attempt reconnect
  - Handle ICE connection state 'disconnected': show warning, attempt reconnect
  - Handle ICE connection state 'closed': cleanup resources
  - Update callState to 'connected' when ICE state is 'connected'
  - Update callState to 'failed' on permanent connection failure
  - _Requirements: 4.8, 7.5, 9.3, 10.5_

---

### 6. Frontend WebSocket Client Hook

- [x] 6.1 Create useWebSocket hook for signaling connection (implemented via WebSocketContext)
  - Implement useWebSocket(url, token) custom hook
  - Initialize WebSocket connection with token in query string
  - Track connection state: 'connecting' | 'connected' | 'disconnected'
  - Set up onopen handler to update state to 'connected'
  - Set up onclose handler to update state to 'disconnected' and trigger reconnection
  - Set up onerror handler to log errors
  - Implement `sendMessage(message)` function to send JSON messages
  - Implement reconnection logic with exponential backoff (max 5 attempts)
  - Return isConnected, connectionState, sendMessage, onMessage callback registration
  - _Requirements: 1.1, 1.5, 9.4_

- [x] 6.2 Integrate signaling WebSocket with useWebRTC
  - Connect to `/ws/signaling` endpoint in useWebRTC hook
  - Register message handler for signaling messages
  - Route messages by type: call_initiate, call_accept, call_reject, sdp_offer, sdp_answer, ice_candidate, hangup, error
  - Call appropriate useWebRTC handler for each message type
  - Update call state based on signaling messages
  - _Requirements: 1.5, 2.5, 2.6, 3.1, 3.2, 3.4, 3.5, 6.5_

- [x] 6.3 Create separate useWebSocket instance for analysis
  - Implement connection to `/ws/analysis` endpoint
  - Send audio_chunk messages with PCM data
  - Receive risk_update messages
  - Pass risk updates to RiskDashboard component via callback
  - _Requirements: 11.5, 15.4, 15.5_

---

### 7. Frontend Audio Processing with AudioWorklet

- [x] 7.1 Create AudioWorklet processor script
  - Create `public/audioProcessor.js` file
  - Extend AudioWorkletProcessor class
  - Initialize with bufferSize=4096, sampleRate=16000, vadThreshold=0.01
  - Implement `process(inputs, outputs, parameters)` method called for each 128-sample quantum
  - Accumulate samples to buffer until bufferSize reached
  - Convert Float32Array to mono if stereo
  - Resample to 16kHz if needed
  - Implement simple energy-based VAD algorithm
  - Convert to Int16 PCM format
  - Post message to main thread with type='pcm_chunk', data (Int16Array), timestamp, hasSpeech
  - Return true to keep processor alive
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 7.2 Create useAudioProcessor hook
  - Implement useAudioProcessor(remoteStream, callId) custom hook
  - Create AudioContext
  - Load AudioWorklet module from `/audioProcessor.js`
  - Create MediaStreamSource from remoteStream
  - Create AudioWorkletNode('audio-processor')
  - Connect source to worklet node and destination
  - Set up message handler for 'pcm_chunk' messages
  - Send audio chunks to analysis WebSocket when speech detected
  - Implement cleanup: disconnect nodes, close AudioContext, terminate worklet
  - _Requirements: 11.1, 11.2, 11.5, 11.7_

- [x] 7.3 Integrate AudioWorklet with WebRTC hook
  - Update useWebRTC to initialize useAudioProcessor when remoteStream is received
  - Pass remoteStream and callId to useAudioProcessor
  - Ensure AudioWorklet terminates when call ends
  - Handle AudioWorklet not supported: log warning, gracefully degrade
  - _Requirements: 11.1, 11.7, 11.8_

---

### 8. Frontend Risk Dashboard Component

- [x] 8.1 Create RiskDashboard component structure
  - Create RiskDashboard.jsx component accepting props: callId, callerInfo, isAnalyzing
  - Set up state for risk data: riskLevel, riskScore, confidence, recommendation, indicators, riskHistory
  - Implement useEffect to subscribe to analysis WebSocket risk_update messages
  - Update state when risk_update received for matching callId
  - Append to riskHistory for timeline tracking
  - _Requirements: 14.1, 14.2, 14.3, 15.5_

- [x] 8.2 Implement risk level indicator with color coding
  - Display large color-coded badge based on riskLevel
  - GREEN for LOW, YELLOW for MEDIUM, RED for HIGH
  - Add animated transitions between levels using CSS transitions
  - Display risk level text prominently
  - _Requirements: 14.1, 14.6_

- [x] 8.3 Implement risk score and confidence display
  - Display numeric risk score (0-100) with progress bar
  - Display model confidence percentage with progress bar
  - Update in real-time as new risk_update messages arrive
  - _Requirements: 14.3_

- [x] 8.4 Implement recommendation display
  - Display context-aware recommendation text from risk_update
  - Style differently based on risk level (info, warning, alert)
  - Show icon appropriate to risk level (âœ…, âš ï¸, ðŸš¨)
  - _Requirements: 14.7_

- [x] 8.5 Implement optional indicators display
  - Check if acoustic_indicators present in risk_update
  - Display acoustic metrics if available (spectral_anomaly, harmonic_distortion)
  - Check if prosody_indicators present in risk_update
  - Display prosody metrics if available (rhythm_consistency, pitch_naturalness)
  - Handle missing indicators gracefully
  - _Requirements: 14.4, 14.5_

- [x] 8.6 Implement risk history timeline visualization
  - Create visual chart showing risk level changes over call duration
  - Use simple line chart or sparkline showing risk_score over time
  - Display time axis (0s to current duration)
  - Update in real-time as new risk updates arrive
  - _Requirements: 14.8_

- [x] 8.7 Add privacy notice and caller info display
  - Display caller name and avatar at top of dashboard
  - Display phone number if available
  - Add privacy notice: "ðŸ”’ Privacy: Audio not stored"
  - Style dashboard with calm, professional design
  - _Requirements: 14.2_

---

### 9. Frontend UI Updates and Integration

- [x] 9.1 Create IncomingCallModal component
  - Create IncomingCallModal.jsx component accepting props: callerInfo, onAccept, onReject
  - Display caller name and avatar
  - Display caller phone number if available
  - Add "Accept" button calling onAccept callback
  - Add "Reject" button calling onReject callback
  - Play incoming call ringtone using Audio API
  - Stop ringtone when modal closes
  - Apply overlay styling to focus user attention
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9.2 Update ActiveCallPage with risk dashboard integration
  - Update ActiveCallPage.jsx to include RiskDashboard component
  - Pass callId and callerInfo to RiskDashboard
  - Display call duration prominently
  - Show connection status (connecting, connected, reconnecting)
  - _Requirements: 14.1, 14.2, 6.6_

- [x] 9.3 Create CallControls component
  - Create CallControls.jsx component with mute and end call buttons
  - Implement mute button with toggle state (muted/unmuted icon)
  - Call toggleMute from useWebRTC on button click
  - Implement end call button with confirmation
  - Call endCall from useWebRTC on button click
  - Style with clear, accessible button design
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 9.4 Add call controls to ActiveCallPage
  - Integrate CallControls component in ActiveCallPage
  - Position controls prominently (bottom of page)
  - Pass mute and endCall handlers from useWebRTC
  - Display current mute state
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9.5 Update CallContext with WebRTC integration
  - Update CallContext.jsx to provide WebRTC state globally
  - Wrap app with CallContext provider
  - Make useWebRTC accessible from any component
  - Handle incoming call state globally to show IncomingCallModal
  - _Requirements: 3.1, 3.2_

- [x] 9.6 Update Dashboard with online presence indicators
  - Update Dashboard.jsx to display online/offline status for contacts
  - Add PresenceIndicator component (green dot for online, gray for offline)
  - Subscribe to user_presence WebSocket messages
  - Update contact list with presence status
  - Disable call button for offline contacts
  - _Requirements: 16.4, 16.5_

- [x] 9.7 Create PresenceIndicator component
  - Create PresenceIndicator.jsx component accepting isOnline prop
  - Display green indicator for online users
  - Display gray indicator for offline users
  - Add optional tooltip showing "Online" or "Offline"
  - _Requirements: 16.4_

- [x] 9.8 Update CallHistoryPage with risk analysis display
  - Update CallHistoryPage.jsx to display risk_level and risk_score
  - Add color-coded risk badge for each call history entry
  - Display call duration, caller/callee info
  - Add filter option to view high-risk calls only
  - Load call history from API endpoint on page mount
  - _Requirements: 8.2, 8.3, 8.4_

---

### 10. Error Handling and Edge Cases

- [x] 10.1 Implement frontend error handling for microphone access
  - Wrap getUserMedia calls in try-catch blocks
  - Display user-friendly error messages for NotAllowedError (permission denied)
  - Display error for NotFoundError (no microphone found)
  - Display error for NotReadableError (microphone in use)
  - Provide guidance on how to resolve each error
  - _Requirements: 9.1_

- [x] 10.2 Implement WebRTC connection failure handling
  - Monitor ICE connection state for 'failed' status
  - Display error message to user
  - Implement automatic reconnection attempt (1 retry)
  - If reconnection fails, show permanent error and cleanup
  - _Requirements: 9.3_

- [x] 10.3 Implement WebSocket reconnection logic
  - Use exponential backoff for reconnection (1s, 2s, 4s, 8s, 16s)
  - Maximum 5 reconnection attempts
  - Display connection status to user (reconnecting...)
  - If all attempts fail, show error and suggest manual refresh
  - _Requirements: 9.4_

- [x] 10.4 Implement backend error handling for AI model failures
  - Wrap AI model API calls in try-except blocks
  - Handle httpx.TimeoutException: log error, return fallback prediction
  - Handle httpx.HTTPStatusError: log error, return fallback prediction
  - Send error flag in risk_update when model unavailable
  - Frontend: display "Analysis temporarily unavailable" message
  - _Requirements: 12.7, 15.1_

- [x] 10.5 Implement call cleanup on unexpected disconnect
  - Backend: detect WebSocket disconnect in signaling endpoint
  - Cleanup all active call sessions for disconnected user
  - Notify other participants of disconnect
  - Create call_history records with status="failed"
  - Clear audio buffers
  - _Requirements: 9.2_

- [x] 10.6 Add browser compatibility checks
  - Check for navigator.mediaDevices support
  - Check for RTCPeerConnection support
  - Check for AudioWorklet support
  - Display compatibility error if unsupported
  - Suggest alternative browsers (Chrome, Firefox, Edge)
  - _Requirements: 9.6_

---

### 11. Configuration and Environment Setup

- [x] 11.1 Add backend environment variables
  - Add MODEL_API_URL to .env and config.py
  - Add MODEL_API_KEY to .env and config.py
  - Add MODEL_TIMEOUT_SECONDS to .env and config.py (default: 10)
  - Add RISK_LOW_THRESHOLD to .env and config.py (default: 30)
  - Add RISK_HIGH_THRESHOLD to .env and config.py (default: 70)
  - Add STUN_SERVER_URL to .env and config.py (default: Google STUN)
  - Document all variables in .env.example
  - _Requirements: 10.1, 12.1, 15.2_

- [x] 11.2 Update frontend API configuration
  - Add WebSocket URLs to frontend config
  - WS_SIGNALING_URL: `ws://localhost:8000/ws/signaling`
  - WS_ANALYSIS_URL: `ws://localhost:8000/ws/analysis`
  - Configure STUN servers in WebRTC config
  - _Requirements: 1.1, 10.1_

- [x] 11.3 Update CORS configuration for WebSocket
  - Update FastAPI CORS middleware to allow WebSocket connections
  - Add development origin (http://localhost:5173)
  - Add production origin (when deployed)
  - Enable credentials
  - _Requirements: 1.1_

---

### 12. Integration Testing and End-to-End Validation

- [x] 12.1 Test WebSocket signaling flow
  - Start backend server
  - Connect two frontend clients with different users
  - Verify both marked as online
  - Verify presence updates received
  - Send call_initiate from User A
  - Verify User B receives call notification
  - _Requirements: 1.2, 1.3, 2.4, 2.5, 3.1, 16.2, 16.3_

- [x] 12.2 Test WebRTC peer connection establishment
  - User B accepts call
  - Verify SDP offer created and sent
  - Verify SDP answer received
  - Verify ICE candidates exchanged
  - Verify peer connection reaches 'connected' state
  - Verify audio streams established
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.3_

- [x] 12.3 Test audio processing pipeline
  - Verify AudioWorklet loaded and initialized
  - Verify PCM chunks generated from remote stream
  - Verify audio chunks sent to analysis WebSocket
  - Verify backend receives audio chunks
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 12.4 Test AI analysis integration (mock mode)
  - Configure backend to use MockAIModelClient
  - Verify audio chunks processed
  - Verify risk updates generated
  - Verify risk updates sent to frontend
  - Verify RiskDashboard displays risk level, score, recommendation
  - _Requirements: 15.1, 15.2, 15.4, 15.5, 14.1, 14.3, 14.7_

- [x] 12.5 Test call controls
  - Test mute functionality: verify audio track disabled/enabled
  - Test end call: verify hangup message sent, peer connection closed, streams stopped
  - Verify other participant receives hangup notification
  - Verify call_history record created with correct duration
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1_

- [x] 12.6 Test error scenarios
  - Test call to offline user: verify error message shown
  - Test microphone permission denied: verify error message
  - Test WebSocket disconnect during call: verify cleanup and notification
  - Test call rejection: verify caller notified, call_history created
  - _Requirements: 2.6, 3.5, 3.6, 9.1, 9.2_

- [x] 12.7 Test call history retrieval
  - Make multiple test calls
  - Navigate to CallHistoryPage
  - Verify calls displayed with caller/callee info, duration, risk level
  - Verify risk badges colored correctly (green/yellow/red)
  - _Requirements: 8.2, 8.3, 8.4_

---

### 13. Checkpoint - Integration Validation

- [x] 13. Ensure all core features working end-to-end
  - Ensure all tests from task 12 pass successfully
  - Verify no console errors in browser or backend logs
  - Verify call state transitions work correctly
  - Verify risk dashboard updates in real-time
  - Ask the user if questions arise or issues found

---

### 14. Performance Optimization and Polish

- [x] 14.1 Optimize AudioWorklet performance
  - Profile AudioWorklet processing latency (target < 50ms per chunk)
  - Adjust buffer size if needed for performance
  - Verify no audio glitches or dropouts
  - _Requirements: 11.2_

- [x] 14.2 Optimize WebSocket message handling
  - Implement message throttling if too frequent (e.g., max 2 risk updates per second)
  - Add message batching for ICE candidates if many generated
  - _Requirements: 15.7_

- [x] 14.3 Add loading states and transitions
  - Add loading spinner during call connection
  - Add smooth transitions for risk level changes
  - Add loading indicator during risk analysis
  - _Requirements: 7.2, 14.3_

- [x] 14.4 Improve error messages and user feedback
  - Review all error messages for clarity
  - Add specific troubleshooting steps where appropriate
  - Test all error paths and ensure good UX
  - _Requirements: 9.1, 9.3, 9.4, 9.6_

---

### 15. Documentation and Deployment Preparation

- [x] 15.1 Update API documentation
  - Document WebSocket endpoints (/ws/signaling, /ws/analysis)
  - Document message formats for all WebSocket message types
  - Document call history API endpoint
  - Add examples for each endpoint

- [x] 15.2 Create deployment checklist
  - Document production environment variables
  - Document CORS configuration for production domain
  - Document HTTPS/SSL requirements for WebRTC
  - Document optional TURN server setup for NAT traversal
  - List browser compatibility requirements

- [x] 15.3 Add user documentation
  - Create guide for making calls
  - Create guide for interpreting risk indicators
  - Document troubleshooting steps for common issues
  - Document microphone permission requirements

---

### 16. Final Checkpoint - Production Readiness

- [x] 16. Verify production readiness
  - Verify all environment variables documented
  - Verify no sensitive data (API keys) exposed to frontend
  - Verify raw audio never persisted (check code paths)
  - Verify call history working correctly
  - Verify error handling comprehensive
  - Verify browser compatibility tested
  - Ask the user for final review and approval

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "11.1", "11.2", "11.3"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["2.1", "2.2", "3.1", "3.2", "5.1"] },
    { "id": 3, "tasks": ["2.3", "3.3", "3.4", "5.2", "6.1", "7.1"] },
    { "id": 4, "tasks": ["2.4", "3.5", "5.3", "5.4", "7.2"] },
    { "id": 5, "tasks": ["2.5", "3.6", "5.5", "5.6", "5.7", "8.1"] },
    { "id": 6, "tasks": ["4.1", "5.8", "5.9", "6.2", "7.3", "8.2", "8.3", "9.1", "9.7"] },
    { "id": 7, "tasks": ["4.2", "4.3", "5.10", "5.11", "6.3", "8.4", "8.5", "9.3"] },
    { "id": 8, "tasks": ["4.4", "8.6", "8.7", "9.2", "9.4", "9.5", "9.6", "9.8"] },
    { "id": 9, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 11, "tasks": ["12.4", "12.5", "12.6", "12.7"] },
    { "id": 12, "tasks": ["13"] },
    { "id": 13, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 14, "tasks": ["15.1", "15.2", "15.3"] },
    { "id": 15, "tasks": ["16"] }
  ]
}
```

---

## Notes

- **Security Priority**: All tasks must maintain the security principle that raw audio is NEVER persisted. Only metadata (risk scores, indicators) is stored.
- **Modular Architecture**: Tasks are organized to maintain clear separation between WebRTC, Audio Processing, AI Integration, and UI layers.
- **Incremental Validation**: Checkpoints at tasks 13 and 16 ensure the system is tested incrementally.
- **Test-Driven**: Integration tests in task 12 validate the complete call flow before optimization.
- **Mock-First Development**: Task 3.2 provides a mock AI client so development can proceed without external API dependency.
- **Browser Compatibility**: Task 10.6 ensures graceful handling of unsupported browsers.
- **Production Readiness**: Task 15 ensures proper documentation and deployment preparation before going live.

This implementation plan provides a complete roadmap from database schema to production deployment, with clear dependencies and validation points throughout the process.

















