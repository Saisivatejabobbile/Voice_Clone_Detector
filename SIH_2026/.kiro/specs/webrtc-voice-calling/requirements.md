# Requirements Document: WebRTC Voice Calling

## Introduction

This document specifies the requirements for implementing real-time peer-to-peer voice calling in VoiceShield using WebRTC technology. The feature enables authenticated users to make and receive voice calls with real-time audio streaming, call state management, and seamless integration with the existing VoiceShield application architecture.

## Architecture Overview

The system follows a modular architecture with clear separation of concerns:

**WebRTC Module** → **Audio Module** → **AI Module** → **Security Module** → **Frontend Display**

### Architecture Modules

1. **WEBRTC MODULE** (Frontend)
   - Signaling coordination
   - PeerConnection management
   - Call lifecycle orchestration
   - Audio track handling
   - NAT traversal (ICE/STUN)
   - Call controls (mute, unmute, end)
   - Connection cleanup
   - Outputs: Remote MediaStream

2. **AUDIO MODULE** (Frontend)
   - AudioWorklet-based audio processing
   - PCM extraction from audio streams
   - Voice Activity Detection (VAD)
   - Audio preprocessing pipeline
   - Outputs: Processed audio data chunks

3. **AI MODULE** (Backend Only)
   - External AI Model API integration
   - Secure API key storage in backend environment
   - Voice authenticity analysis
   - Outputs: Risk analysis results

4. **SECURITY MODULE** (Backend)
   - Risk Engine for threat assessment
   - Alert generation
   - Recommendation engine
   - Outputs: Risk indicators (HIGH/MEDIUM/LOW)

5. **FRONTEND DISPLAY**
   - Live Risk Dashboard
   - Caller information visualization
   - Real-time risk level indicators (HIGH/MEDIUM/LOW)
   - Acoustic and prosody metrics

### Key Security Constraints

🔒 **Raw audio data MUST never be stored persistently** - all audio processing is transient and in-memory only

## Glossary

- **WebRTC_Manager**: The frontend service responsible for managing WebRTC peer connections, media streams, and ICE negotiation
- **Signaling_Server**: The backend WebSocket server that routes signaling messages between peers
- **Call_Session**: An in-memory object tracking the state and metadata of an active call
- **SDP**: Session Description Protocol - a format for describing multimedia communication sessions
- **ICE_Candidate**: Interactive Connectivity Establishment candidate - network path information for NAT traversal
- **STUN_Server**: Session Traversal Utilities for NAT - a server that helps discover public IP addresses
- **Remote_Stream**: The audio stream received from the remote peer
- **Local_Stream**: The audio stream captured from the local microphone
- **Call_History**: A database record of a completed call with metadata and risk analysis results
- **Risk_Analyzer**: The AI service that analyzes call audio for voice authenticity
- **Connection_Manager**: The backend service managing WebSocket connections and user presence
- **AudioWorklet**: A browser API for low-latency audio processing in a separate thread
- **PCM**: Pulse Code Modulation - uncompressed audio data format
- **VAD**: Voice Activity Detection - algorithm to detect speech presence in audio
- **Audio_Processor**: The AudioWorklet-based processor that extracts and preprocesses audio data
- **Risk_Dashboard**: The frontend component displaying real-time risk analysis results
- **AI_Model_API**: The external backend service providing voice analysis capabilities
- **Risk_Engine**: The backend component that interprets AI results and generates risk assessments
- **Risk_Level**: A categorical indicator of threat level (HIGH, MEDIUM, LOW)

## Requirements

### Requirement 1: WebSocket Signaling Infrastructure

**User Story:** As a system developer, I want a robust WebSocket signaling infrastructure, so that peers can exchange WebRTC connection information reliably.

#### Acceptance Criteria

1. THE Signaling_Server SHALL accept WebSocket connections with JWT authentication via query parameter
2. WHEN a user connects via WebSocket, THE Signaling_Server SHALL mark the user as online
3. WHEN a user disconnects from WebSocket, THE Signaling_Server SHALL mark the user as offline and clean up active call sessions
4. THE Connection_Manager SHALL maintain a mapping between user IDs and WebSocket connections
5. THE Signaling_Server SHALL route signaling messages between authenticated peers based on user IDs

### Requirement 2: Outgoing Call Initiation

**User Story:** As a user, I want to initiate voice calls to my contacts, so that I can communicate with them in real-time.

#### Acceptance Criteria

1. WHEN a user clicks the call button on a contact, THE WebRTC_Manager SHALL generate a unique call ID
2. WHEN initiating a call, THE WebRTC_Manager SHALL request microphone access from the browser
3. WHEN microphone access is granted, THE WebRTC_Manager SHALL create a WebRTC peer connection with STUN server configuration
4. THE WebRTC_Manager SHALL create an SDP offer and send it to the Signaling_Server
5. THE Signaling_Server SHALL verify the callee is online before forwarding the call initiation message
6. IF the callee is offline, THEN THE Signaling_Server SHALL send a call failure message to the caller
7. WHEN the call is initiated, THE WebRTC_Manager SHALL update the call state to "calling" and navigate to the active call page

### Requirement 3: Incoming Call Handling

**User Story:** As a user, I want to receive incoming call notifications, so that I can accept or reject calls from my contacts.

#### Acceptance Criteria

1. WHEN the Signaling_Server receives a call initiation, THE Signaling_Server SHALL send an incoming call message to the callee
2. WHEN an incoming call message is received, THE WebRTC_Manager SHALL display an incoming call modal with caller information
3. THE WebRTC_Manager SHALL play an incoming call ringtone
4. WHEN the user accepts the call, THE WebRTC_Manager SHALL send a call acceptance message to the Signaling_Server
5. WHEN the user rejects the call, THE WebRTC_Manager SHALL send a call rejection message to the Signaling_Server
6. WHEN a call rejection message is received, THE Signaling_Server SHALL notify the caller and remove the Call_Session

### Requirement 4: WebRTC Connection Establishment

**User Story:** As a system developer, I want WebRTC peer connections to be established automatically, so that users can exchange audio streams.

#### Acceptance Criteria

1. WHEN a call is accepted, THE WebRTC_Manager SHALL request microphone access from the callee
2. WHEN the caller receives a call acceptance, THE WebRTC_Manager SHALL create an SDP offer
3. THE WebRTC_Manager SHALL send the SDP offer to the callee via the Signaling_Server
4. WHEN the callee receives an SDP offer, THE WebRTC_Manager SHALL create an SDP answer
5. THE WebRTC_Manager SHALL send the SDP answer to the caller via the Signaling_Server
6. WHEN ICE candidates are discovered, THE WebRTC_Manager SHALL send them to the remote peer via the Signaling_Server
7. WHEN ICE candidates are received, THE WebRTC_Manager SHALL add them to the peer connection
8. WHEN the WebRTC connection state changes to "connected", THE WebRTC_Manager SHALL update the call state to "connected"

### Requirement 5: Audio Stream Management

**User Story:** As a user, I want to transmit and receive audio during calls, so that I can communicate with the other person.

#### Acceptance Criteria

1. WHEN microphone access is granted, THE WebRTC_Manager SHALL capture the Local_Stream from the microphone
2. THE WebRTC_Manager SHALL add the Local_Stream to the WebRTC peer connection
3. WHEN a Remote_Stream is received, THE WebRTC_Manager SHALL attach it to an audio element for playback
4. THE WebRTC_Manager SHALL monitor audio stream activity for visualization
5. WHEN the call ends, THE WebRTC_Manager SHALL stop all media tracks and release microphone access

### Requirement 6: Call Controls

**User Story:** As a user, I want to control my call with mute and end call functions, so that I can manage my audio and terminate calls.

#### Acceptance Criteria

1. WHEN the user clicks the mute button, THE WebRTC_Manager SHALL disable the audio track of the Local_Stream
2. WHEN the user clicks the unmute button, THE WebRTC_Manager SHALL enable the audio track of the Local_Stream
3. WHEN the user clicks the end call button, THE WebRTC_Manager SHALL send a hangup message to the Signaling_Server
4. WHEN a hangup message is sent, THE WebRTC_Manager SHALL close the peer connection and stop all media streams
5. WHEN a hangup message is received, THE WebRTC_Manager SHALL close the peer connection and navigate to the dashboard
6. THE WebRTC_Manager SHALL display the call duration during active calls

### Requirement 7: Call State Management

**User Story:** As a system developer, I want comprehensive call state tracking, so that the UI reflects the current call status accurately.

#### Acceptance Criteria

1. THE Call_Session SHALL track the following states: initiating, ringing, accepted, connected, ended, rejected, failed
2. WHEN a state transition occurs, THE WebRTC_Manager SHALL update the UI to reflect the new state
3. THE Call_Session SHALL record timestamps for call start, connection, and end events
4. THE Call_Session SHALL calculate call duration based on connection and end timestamps
5. WHEN a call fails, THE WebRTC_Manager SHALL display an appropriate error message and transition to idle state

### Requirement 8: Call History Persistence

**User Story:** As a user, I want my call history to be saved, so that I can review past calls and their risk analysis results.

#### Acceptance Criteria

1. WHEN a call ends, THE Signaling_Server SHALL create a Call_History record in the database
2. THE Call_History SHALL store caller ID, callee ID, start time, end time, duration, and final call state
3. THE Call_History SHALL store risk analysis results including risk level, risk score, and detailed indicators
4. THE Signaling_Server SHALL associate call participants with Call_History records via foreign keys
5. WHEN a call is rejected or fails before connecting, THE Signaling_Server SHALL create a Call_History record with zero duration

### Requirement 9: Error Handling and Edge Cases

**User Story:** As a user, I want the system to handle errors gracefully, so that I can understand what went wrong and recover easily.

#### Acceptance Criteria

1. WHEN microphone access is denied, THE WebRTC_Manager SHALL display an error message and prevent call initiation
2. WHEN a peer disconnects unexpectedly, THE Signaling_Server SHALL notify the other peer and clean up the Call_Session
3. WHEN WebRTC connection fails, THE WebRTC_Manager SHALL display an error message and allow retry
4. WHEN a signaling message fails to deliver, THE Signaling_Server SHALL log the error without crashing
5. IF a Call_Session ID is not found, THEN THE Signaling_Server SHALL log a warning and ignore the message
6. WHEN the browser does not support WebRTC, THE WebRTC_Manager SHALL display a compatibility error message

### Requirement 10: NAT Traversal and Connectivity

**User Story:** As a system developer, I want NAT traversal support, so that users behind different networks can establish peer connections.

#### Acceptance Criteria

1. THE WebRTC_Manager SHALL configure peer connections with Google STUN servers
2. WHEN creating a peer connection, THE WebRTC_Manager SHALL enable ICE candidate gathering
3. THE WebRTC_Manager SHALL send all discovered ICE candidates to the remote peer
4. THE WebRTC_Manager SHALL add all received ICE candidates to the peer connection
5. WHEN ICE connection state is "failed", THE WebRTC_Manager SHALL notify the user of connection issues

### Requirement 11: Real-Time Audio Processing Pipeline

**User Story:** As a system developer, I want an AudioWorklet-based audio processing pipeline, so that audio can be extracted and preprocessed efficiently without blocking the main thread.

#### Acceptance Criteria

1. WHEN a Remote_Stream is received, THE Audio_Processor SHALL create an AudioWorklet node for audio processing
2. THE Audio_Processor SHALL extract PCM audio data from the Remote_Stream in real-time
3. THE Audio_Processor SHALL implement Voice Activity Detection (VAD) to identify speech segments
4. WHEN speech is detected, THE Audio_Processor SHALL preprocess the audio data for AI analysis
5. THE Audio_Processor SHALL send processed audio chunks to the backend via WebSocket
6. THE Audio_Processor SHALL buffer audio data appropriately to avoid overwhelming the network
7. WHEN the call ends, THE Audio_Processor SHALL terminate the AudioWorklet and release all audio resources
8. THE Audio_Processor SHALL NOT store any raw audio data persistently - all processing is transient in-memory only

### Requirement 12: Backend AI Model Integration

**User Story:** As a system architect, I want AI model API calls to be handled exclusively by the backend, so that API keys remain secure and never exposed to the frontend.

#### Acceptance Criteria

1. THE AI_Model_API credentials SHALL be stored exclusively in the backend environment configuration
2. THE frontend SHALL NOT have access to AI model API keys or credentials
3. WHEN processed audio data is received, THE backend SHALL forward it to the AI_Model_API
4. THE backend SHALL authenticate with the AI_Model_API using secure API key storage
5. WHEN AI analysis results are received, THE backend SHALL parse and validate the response
6. THE backend SHALL forward validated AI results to the frontend via WebSocket
7. IF the AI_Model_API call fails, THEN THE backend SHALL log the error and send a fallback response to the frontend

### Requirement 13: Transient Audio Processing Security

**User Story:** As a security-conscious user, I want assurance that raw audio is never stored, so that my voice data remains private and ephemeral.

#### Acceptance Criteria

1. THE Audio_Processor SHALL process audio data in real-time without persisting it to disk
2. THE backend SHALL process received audio chunks transiently without storing them to disk or database
3. WHEN audio chunks are sent to the AI_Model_API, THE backend SHALL NOT cache or log the raw audio data
4. THE system SHALL only persist risk analysis metadata (risk scores, indicators) in the Call_History
5. WHEN a call ends, THE system SHALL ensure all in-memory audio buffers are cleared
6. THE system SHALL NOT include raw audio data in any logs, error messages, or debugging output

### Requirement 14: Live Risk Dashboard Display

**User Story:** As a user, I want to see real-time risk indicators during calls, so that I can assess the authenticity of the caller's voice.

#### Acceptance Criteria

1. THE Risk_Dashboard SHALL display the current risk level (HIGH, MEDIUM, LOW) with color-coded indicators
2. THE Risk_Dashboard SHALL show caller information including name and phone number
3. WHEN risk analysis updates are received, THE Risk_Dashboard SHALL update the display within 500ms
4. THE Risk_Dashboard SHALL display acoustic indicators when available from the AI analysis
5. THE Risk_Dashboard SHALL display prosody indicators when available from the AI analysis
6. THE Risk_Dashboard SHALL show a visual alert when risk level transitions to HIGH
7. WHEN risk level is HIGH, THE Risk_Dashboard SHALL display actionable recommendations
8. THE Risk_Dashboard SHALL maintain a historical view of risk level changes during the call

### Requirement 15: Risk Analysis Integration (formerly Requirement 11)

**User Story:** As a user, I want real-time voice analysis during calls, so that I can detect potential deepfake or synthetic voices.

#### Acceptance Criteria

1. WHEN processed audio data is received by the backend, THE Risk_Analyzer SHALL send it to the AI_Model_API
2. WHEN AI analysis results are received, THE Risk_Engine SHALL categorize the risk as HIGH, MEDIUM, or LOW
3. THE Risk_Engine SHALL calculate risk scores based on multiple factors including acoustic and prosody analysis
4. WHEN risk updates are generated, THE backend SHALL send them to the frontend via WebSocket
5. THE Risk_Dashboard SHALL update the UI with the latest risk indicators
6. WHEN the call ends, THE Call_Session SHALL store the final risk level and risk score in Call_History
7. THE system SHALL provide risk analysis at intervals of no more than 5 seconds during active calls

### Requirement 16: User Presence Management (formerly Requirement 12)

**User Story:** As a user, I want to see which contacts are online, so that I know who is available to call.

#### Acceptance Criteria

1. THE Connection_Manager SHALL track which users are currently connected via WebSocket
2. WHEN a user connects, THE Signaling_Server SHALL broadcast user online status to relevant contacts
3. WHEN a user disconnects, THE Signaling_Server SHALL broadcast user offline status to relevant contacts
4. THE WebRTC_Manager SHALL update contact availability indicators based on presence messages
5. THE WebRTC_Manager SHALL disable the call button for offline contacts

## Requirements Coverage Summary

This specification covers:
- **16 requirements** with **90+ acceptance criteria**
- End-to-end call flow from initiation to termination
- WebRTC signaling and peer connection management
- Audio stream capture, transmission, and playback
- **AudioWorklet-based real-time audio processing pipeline**
- **Voice Activity Detection (VAD) and audio preprocessing**
- **Backend-only AI model integration with secure API key storage**
- **Transient audio processing with no persistent storage**
- **Live risk dashboard with HIGH/MEDIUM/LOW indicators**
- Call state tracking and UI synchronization
- Error handling and edge cases
- NAT traversal for cross-network connectivity
- Real-time risk analysis with security engine
- User presence and availability tracking
- Call history persistence for auditing and review

All requirements follow EARS patterns and INCOSE quality rules for clarity, testability, and completeness.

The architecture ensures:
- **Security**: AI API keys never exposed to frontend, raw audio never stored
- **Performance**: AudioWorklet for efficient, non-blocking audio processing
- **Modularity**: Clear separation between WebRTC, Audio, AI, Security, and Frontend modules
- **Real-time**: Live risk indicators updated during calls with minimal latency
