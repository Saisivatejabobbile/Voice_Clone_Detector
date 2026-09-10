# WebSocket API Documentation

## Overview
VoiceShield provides two WebSocket endpoints for real-time communication:
- `/ws/signaling` - Call signaling and WebRTC negotiation
- `/ws/analysis` - Real-time audio analysis and risk detection

---

## Authentication
All WebSocket connections require JWT token authentication via query parameter:

```
ws://localhost:8000/ws/signaling?token=YOUR_JWT_TOKEN
ws://localhost:8000/ws/analysis?token=YOUR_JWT_TOKEN
```

---

## /ws/signaling Endpoint

### Purpose
Handles call signaling, WebRTC SDP exchange, and ICE candidate exchange.

### Message Types

#### 1. user_presence (Server → Client)
Sent when a user comes online or goes offline.

```json
{
  "type": "user_presence",
  "user_id": 2,
  "status": "online"  // or "offline"
}
```

#### 2. call_initiate (Client → Server)
Initiate a call to another user.

```json
{
  "type": "call_initiate",
  "callee_id": 2
}
```

**Server Response:**
```json
{
  "type": "call_notification",
  "call_id": "call_123",
  "caller_id": 1,
  "caller_name": "John Doe",
  "caller_email": "john@example.com"
}
```

#### 3. call_accept (Client → Server)
Accept an incoming call.

```json
{
  "type": "call_accept",
  "call_id": "call_123"
}
```

**Server Response:**
```json
{
  "type": "call_accepted",
  "call_id": "call_123"
}
```

#### 4. call_reject (Client → Server)
Reject an incoming call.

```json
{
  "type": "call_reject",
  "call_id": "call_123"
}
```

#### 5. sdp_offer (Client → Server)
Send WebRTC SDP offer.

```json
{
  "type": "sdp_offer",
  "call_id": "call_123",
  "to": 2,
  "sdp": "v=0\r\no=- ..."
}
```

**Server forwards to recipient:**
```json
{
  "type": "sdp_offer",
  "call_id": "call_123",
  "from": 1,
  "sdp": "v=0\r\no=- ..."
}
```

#### 6. sdp_answer (Client → Server)
Send WebRTC SDP answer.

```json
{
  "type": "sdp_answer",
  "call_id": "call_123",
  "to": 1,
  "sdp": "v=0\r\no=- ..."
}
```

#### 7. ice_candidate (Client → Server)
Exchange ICE candidates for NAT traversal.

```json
{
  "type": "ice_candidate",
  "call_id": "call_123",
  "to": 2,
  "candidate": {
    "candidate": "candidate:...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

#### 8. hangup (Client → Server)
End an active call.

```json
{
  "type": "hangup",
  "call_id": "call_123"
}
```

**Server broadcasts to both parties:**
```json
{
  "type": "hangup",
  "call_id": "call_123",
  "from": 1
}
```

#### 9. error (Server → Client)
Error notification.

```json
{
  "type": "error",
  "message": "User is offline",
  "code": "USER_OFFLINE"
}
```

---

## /ws/analysis Endpoint

### Purpose
Receives audio chunks and sends real-time risk analysis results.

### Message Types

#### 1. audio_chunk (Client → Server)
Send PCM audio data for analysis.

```json
{
  "type": "audio_chunk",
  "call_id": "call_123",
  "pcm_data": [0.1, -0.2, 0.3, ...],  // Array of float32 PCM samples
  "sample_rate": 16000,
  "timestamp": 1234567890.123
}
```

**Notes:**
- `pcm_data`: Array of normalized float32 values (-1.0 to 1.0)
- `sample_rate`: Audio sample rate (typically 16000 Hz)
- Send chunks every 1-2 seconds for real-time analysis

#### 2. risk_update (Server → Client)
Real-time risk analysis result.

```json
{
  "type": "risk_update",
  "call_id": "call_123",
  "risk_level": "HIGH",  // LOW, MEDIUM, or HIGH
  "risk_score": 85.5,    // 0-100
  "synthetic_confidence": 92.3,  // 0-100
  "model_confidence": 88.7,      // 0-100
  "recommendation": "TERMINATE",  // SAFE, CAUTION, or TERMINATE
  "acoustic_indicators": {
    "spectral_anomaly": 0.78,
    "harmonic_distortion": 0.65
  },
  "prosody_indicators": {
    "rhythm_consistency": 0.45,
    "pitch_naturalness": 0.52
  },
  "timestamp": 1234567890.123
}
```

**Risk Levels:**
- `LOW`: Risk score 0-30 (Green)
- `MEDIUM`: Risk score 31-70 (Yellow)
- `HIGH`: Risk score 71-100 (Red)

**Recommendations:**
- `SAFE`: No action needed
- `CAUTION`: User should be alert
- `TERMINATE`: Consider ending call

#### 3. analysis_error (Server → Client)
Error during analysis.

```json
{
  "type": "analysis_error",
  "call_id": "call_123",
  "message": "AI model temporarily unavailable",
  "fallback_used": true
}
```

---

## Connection Lifecycle

### Signaling WebSocket

1. **Connect** → Receives `user_presence` updates
2. **Initiate Call** → Send `call_initiate`
3. **Receive Notification** → Other party gets `call_notification`
4. **Accept/Reject** → Send `call_accept` or `call_reject`
5. **WebRTC Exchange** → Exchange `sdp_offer`, `sdp_answer`, `ice_candidate`
6. **Active Call** → Connection established
7. **End Call** → Send `hangup`
8. **Disconnect** → Close WebSocket

### Analysis WebSocket

1. **Connect** after call is established
2. **Send audio chunks** every 1-2 seconds
3. **Receive risk updates** in real-time
4. **Handle errors** with fallback UI
5. **Disconnect** when call ends

---

## Error Codes

| Code | Description |
|------|-------------|
| `USER_OFFLINE` | Callee is not connected |
| `USER_BUSY` | Callee is in another call |
| `CALL_NOT_FOUND` | Invalid call ID |
| `INVALID_MESSAGE` | Malformed message |
| `UNAUTHORIZED` | Invalid or expired token |
| `ANALYSIS_UNAVAILABLE` | AI model temporarily down |

---

## Rate Limits

- Audio chunks: Max 2 per second recommended
- Risk updates: Throttled to max 2 per second
- ICE candidates: No limit (bursty during negotiation)

---

## Examples

### Complete Call Flow

```javascript
// 1. Connect to signaling
const ws = new WebSocket('ws://localhost:8000/ws/signaling?token=...');

// 2. Initiate call
ws.send(JSON.stringify({
  type: 'call_initiate',
  callee_id: 2
}));

// 3. Exchange SDP/ICE (handled by SimplePeer/WebRTC library)
// 4. Connect to analysis after call established
const analysisWS = new WebSocket('ws://localhost:8000/ws/analysis?token=...');

// 5. Send audio chunks
analysisWS.send(JSON.stringify({
  type: 'audio_chunk',
  call_id: 'call_123',
  pcm_data: audioData,
  sample_rate: 16000,
  timestamp: Date.now() / 1000
}));

// 6. Receive risk updates
analysisWS.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'risk_update') {
    updateRiskDashboard(data);
  }
};

// 7. End call
ws.send(JSON.stringify({
  type: 'hangup',
  call_id: 'call_123'
}));
```

---

## Browser Compatibility

Required browser features:
- WebSocket API
- WebRTC (RTCPeerConnection)
- MediaDevices API (getUserMedia)
- AudioWorklet API (preferred)

**Supported Browsers:**
- Chrome 74+
- Firefox 76+
- Edge 79+
- Safari 14+
