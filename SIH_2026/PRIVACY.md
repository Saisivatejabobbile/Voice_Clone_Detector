# VoiceShield Privacy Policy

**Version:** 1.0  
**Last Updated:** September 6, 2026  
**Effective Date:** September 6, 2026

---

## Overview

VoiceShield is a **privacy-first** real-time voice integrity security layer. This document describes how VoiceShield handles audio data, user information, and provides transparency about data processing.

**Core Privacy Principle:**  
**Raw call audio is NEVER persisted, stored, or recorded by the VoiceShield application.**

---

## Table of Contents

1. [Audio Data Handling](#audio-data-handling)
2. [What We Store](#what-we-store)
3. [What We Do NOT Store](#what-we-do-not-store)
4. [Data Processing Flow](#data-processing-flow)
5. [User Information](#user-information)
6. [Third-Party Services](#third-party-services)
7. [Data Retention](#data-retention)
8. [User Rights](#user-rights)
9. [Security Measures](#security-measures)
10. [Children's Privacy](#childrens-privacy)
11. [Changes to Privacy Policy](#changes-to-privacy-policy)
12. [Contact Information](#contact-information)

---

## Audio Data Handling

### Transient Processing Model

VoiceShield uses a **transient processing model** for all audio analysis:

```
Receive → Temporary Memory → Analyze → Result → Discard
```

### How It Works

1. **Audio Capture (Receiver Browser)**
   - Only the **remote caller's audio stream** is analyzed
   - The receiver's own microphone is NOT sent to analysis
   - Audio exists in browser memory as a WebRTC MediaStream

2. **Audio Processing (Receiver Browser)**
   - AudioWorklet converts remote stream to PCM format
   - Small bounded buffers (typically 4096 samples)
   - Buffers are cleared immediately after sending

3. **Audio Transmission (WebSocket)**
   - PCM audio chunks sent to backend via WebSocket
   - Data is transient network traffic
   - No caching or logging of audio data

4. **Audio Analysis (Backend)**
   - Audio stored in bounded in-memory buffers only
   - Maximum 30 seconds of audio in memory
   - Ring buffer: old data automatically discarded
   - Sent to external model API for analysis
   - **Never written to disk**

5. **Result Generation**
   - Model returns synthetic voice prediction
   - Backend calculates risk score
   - Result sent to client
   - **Audio is NOT included in result**

6. **Cleanup (Call Termination)**
   - All buffers immediately cleared
   - WebSocket connections closed
   - AudioContext and tracks released
   - **Zero audio persistence**

---

## What We Store

VoiceShield stores ONLY the following data:

### User Account Data
- Email address
- Password (hashed with bcrypt, never plaintext)
- Full name (display name)
- Account creation timestamp
- Last seen timestamp

### Call Session Metadata
- Call session ID
- Caller user ID
- Receiver user ID
- Call start timestamp
- Call end timestamp
- Call duration (seconds)
- Call status (completed, rejected, failed)

### Analysis Results (Metadata Only)
- Synthetic voice confidence score
- Model confidence score
- Risk level (LOW/MEDIUM/HIGH)
- Timestamp of analysis
- **NO AUDIO DATA**

---

## What We Do NOT Store

VoiceShield **explicitly does NOT store** the following:

### ❌ Audio Data
- Raw audio files (WAV, MP3, WebM, etc.)
- PCM audio data
- Base64-encoded audio
- Audio blobs or buffers
- Voice recordings
- Audio samples or segments

### ❌ Derived Audio Content
- Audio transcriptions
- Voice embeddings or fingerprints
- Spectrograms or mel-spectrograms
- Audio features or representations
- Voice profiles

### ❌ Sensitive Locations
- Browser localStorage
- Browser IndexedDB
- Browser cache
- Backend filesystem
- Database (PostgreSQL)
- Cache (Redis)
- Log files
- Error tracking systems
- Analytics platforms

---

## Data Processing Flow

### Complete Privacy-Preserving Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         PRIVACY ZONES                          │
└────────────────────────────────────────────────────────────────┘

ZONE 1: RECEIVER BROWSER (Transient Memory Only)
├─ Remote WebRTC MediaStream [TEMPORARY]
├─ AudioContext buffers [TEMPORARY, BOUNDED]
├─ AudioWorklet processing [TEMPORARY]
└─ WebSocket send buffer [TRANSIENT]
   │
   │ PCM audio chunks (network only)
   ↓

ZONE 2: BACKEND SERVER (Bounded Memory Only)
├─ WebSocket receive buffer [TRANSIENT]
├─ Audio validation buffer [TEMPORARY, BOUNDED, MAX 30 SEC]
├─ Voice activity detection [TEMPORARY]
└─ Model API request [TRANSIENT]
   │
   │ Audio sent to external model
   ↓

ZONE 3: EXTERNAL MODEL (Third-Party Policy)
├─ Model processes audio [EXTERNAL RESPONSIBILITY]
└─ Returns prediction only [NO AUDIO IN RESPONSE]
   │
   │ Synthetic probability + confidence
   ↓

ZONE 4: RISK ENGINE (Metadata Only)
├─ Calculate application risk score [METADATA]
├─ Determine risk level [METADATA]
└─ Generate recommendation [METADATA]
   │
   │ Risk result (no audio)
   ↓

ZONE 5: DATABASE (Metadata Only)
├─ Call session metadata [STORED]
├─ Risk scores [STORED]
└─ User account data [STORED]

✅ PRIVACY GUARANTEE: No audio crosses into ZONE 5
```

### Call Termination Cleanup

When a call ends, VoiceShield immediately:

1. **Frontend:**
   - Stops AudioWorklet processing
   - Closes AudioContext
   - Releases WebRTC tracks
   - Closes analysis WebSocket
   - Clears all audio-related variables

2. **Backend:**
   - Clears bounded audio buffers
   - Closes analysis WebSocket
   - Releases memory
   - **Does NOT save any audio**

3. **Result:**
   - Zero audio persistence
   - No audio recovery possible
   - Only metadata remains

---

## User Information

### What We Collect

- **Account Information:** Email, name, password (hashed)
- **Usage Information:** Login timestamps, online status
- **Call Metadata:** Call participants, timestamps, durations
- **Analysis Results:** Risk scores, risk levels (NO AUDIO)

### How We Use It

- **Authentication:** Verify user identity
- **Call Management:** Route calls between users
- **Presence:** Show online/offline status
- **Analysis History:** Display past risk assessments
- **Service Improvement:** Aggregate statistics (no audio)

### We Do NOT

- ❌ Sell user data
- ❌ Share audio with third parties (we don't have it!)
- ❌ Use audio for marketing
- ❌ Create voice profiles for tracking
- ❌ Train models on user audio (this app doesn't train models)

---

## Third-Party Services

### External Model API

**What is sent:**
- Transient PCM audio chunks
- Sample rate and format metadata

**What is NOT sent:**
- User identity
- Call participants
- Timestamps
- Any personally identifiable information

**Important:**
- The external model API has its own privacy policy
- Audio processing by the model is governed by their policy
- Users should review the model provider's privacy terms
- VoiceShield cannot control third-party data handling

**Recommendation:**
- Use model APIs from trusted providers
- Review model provider's data retention policy
- Prefer providers with no-logging policies
- Consider self-hosted models for maximum privacy

---

### STUN/TURN Servers

**Purpose:** WebRTC NAT traversal (network connectivity)

**What is sent:**
- IP addresses and ports
- ICE candidates
- Network connection metadata

**NOT sent:**
- Call audio (handled peer-to-peer)
- User credentials (except TURN auth)
- Call content or metadata

---

### Optional Services

**Redis (if used):**
- Stores temporary presence state only
- User online/offline status
- Active call session IDs
- NO AUDIO DATA

**Analytics (if configured):**
- Aggregate usage statistics only
- No personally identifiable information
- No audio data
- No call content

---

## Data Retention

### Retained Indefinitely (Until Account Deletion)
- User account information
- Contact lists

### Retained for 90 Days
- Call session metadata
- Analysis result metadata

### Retained for 30 Days
- Login history
- Presence logs

### NEVER Retained
- ❌ Raw call audio
- ❌ Audio files or recordings
- ❌ Audio transcriptions
- ❌ Voice embeddings

### Automatic Deletion

Call metadata older than 90 days is automatically deleted.

---

## User Rights

### Right to Access
- View your account information
- View call history and metadata
- Export your data (metadata only)

### Right to Deletion
- Request account deletion
- All associated data will be permanently deleted
- Call metadata involving your account will be anonymized

### Right to Correction
- Update your email or name
- Correct inaccurate information

### Right to Object
- Opt out of optional analytics
- Disable risk analysis (not recommended)

### How to Exercise Rights

Contact us at: [privacy@voiceshield.example.com](mailto:privacy@voiceshield.example.com)

---

## Security Measures

### Data Protection

**In Transit:**
- ✅ HTTPS/TLS for all API requests (production)
- ✅ WSS (WebSocket Secure) for WebSocket connections (production)
- ✅ End-to-end WebRTC encryption (DTLS-SRTP)

**At Rest:**
- ✅ Encrypted database connections
- ✅ Hashed passwords (bcrypt)
- ✅ Secure JWT token generation
- ❌ No audio at rest (never stored)

**Access Control:**
- ✅ JWT-based authentication
- ✅ WebSocket authentication
- ✅ User-scoped data access
- ✅ No cross-user data leakage

**Logging:**
- ✅ System logs (no sensitive data)
- ❌ NO audio logging
- ❌ NO password logging
- ❌ NO token logging

---

## Children's Privacy

VoiceShield is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.

If we learn that we have collected personal information from a child under 13, we will take immediate steps to delete that information.

Parents or guardians who believe we may have inadvertently collected information from a child under 13 should contact us immediately.

---

## Data Breach Notification

In the unlikely event of a data breach:

1. We will investigate immediately
2. Affected users will be notified within 72 hours
3. We will describe what data was affected
4. We will provide remediation steps

**Note:** Because VoiceShield does NOT store audio, call audio cannot be compromised in a data breach.

---

## Compliance

VoiceShield is designed with privacy regulations in mind:

- **GDPR** (EU): Right to access, deletion, portability
- **CCPA** (California): Right to know, delete, opt-out
- **PIPEDA** (Canada): Consent and data minimization

**Important:** VoiceShield is a hackathon prototype. For production deployment, a comprehensive legal review and compliance audit is required.

---

## Transparency

### What You Can Verify

1. **No Audio Storage:**
   - Inspect database schema (no audio columns)
   - Review source code (open source)
   - Monitor filesystem (no audio files created)

2. **Transient Processing:**
   - Code review: buffers are bounded and cleared
   - Network inspection: WebSocket carries PCM only
   - Memory profiling: no growing audio buffers

3. **Privacy Indicators:**
   - UI displays "Raw Audio Retention: OFF"
   - Clear cleanup on call termination
   - Analysis stops immediately when call ends

---

## Mock Mode Privacy

When `MODEL_MODE=mock` is enabled:

- External model API is NOT called
- Random risk scores are generated locally
- NO audio leaves the backend server
- Clearly labeled "DEMO MODE" in UI

**Purpose:** Development and integration testing without external dependencies.

---

## Limitations and Disclaimers

### What VoiceShield Can Control

✅ Audio handling within the application  
✅ Database and filesystem storage  
✅ Backend processing and cleanup  
✅ UI privacy indicators  

### What VoiceShield Cannot Control

❌ External model API data handling  
❌ User's local device security  
❌ Network intermediaries (ISPs, proxies)  
❌ Browser security vulnerabilities  
❌ Third-party TURN server policies  

### User Responsibilities

- Use trusted network connections
- Keep browser updated
- Use strong passwords
- Review external model provider policies
- Understand that "perfect privacy" depends on the entire stack

---

## Changes to Privacy Policy

We may update this privacy policy from time to time. Changes will be:

1. Posted on this page
2. Version number incremented
3. "Last Updated" date changed
4. Users notified via email (for material changes)

Continued use of VoiceShield after changes constitutes acceptance of the updated policy.

---

## Technical Verification

### For Developers and Auditors

**To verify no audio persistence:**

1. **Database Inspection:**
   ```sql
   -- Check schema for audio columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public';
   -- Result: No BYTEA, TEXT with audio, or BLOB columns
   ```

2. **Code Review:**
   - Search codebase for `file.write`, `fs.writeFile`, `open('wb')`, etc.
   - Verify no audio serialization code
   - Check `AudioWorklet` processor for bounded buffers

3. **Runtime Monitoring:**
   - Monitor backend filesystem: no `.wav`, `.mp3`, `.pcm` files created
   - Check database size: should not grow with call duration
   - Memory profiling: buffers are bounded and released

4. **Network Traffic:**
   - Inspect WebSocket messages: PCM arrays are transient
   - Verify no audio in REST API responses

---

## Contact Information

**Privacy Questions:**  
Email: [privacy@voiceshield.example.com](mailto:privacy@voiceshield.example.com)

**Data Deletion Requests:**  
Email: [privacy@voiceshield.example.com](mailto:privacy@voiceshield.example.com)  
Subject: "Data Deletion Request - [Your Email]"

**Security Concerns:**  
Email: [security@voiceshield.example.com](mailto:security@voiceshield.example.com)

**General Support:**  
Email: [support@voiceshield.example.com](mailto:support@voiceshield.example.com)

---

## Summary

### Privacy at a Glance

| Data Type | Stored? | Location | Duration |
|-----------|---------|----------|----------|
| Raw call audio | ❌ NO | N/A | Never |
| Audio files | ❌ NO | N/A | Never |
| Transcriptions | ❌ NO | N/A | Never |
| Voice embeddings | ❌ NO | N/A | Never |
| User accounts | ✅ YES | Database | Until deletion |
| Call metadata | ✅ YES | Database | 90 days |
| Risk scores | ✅ YES | Database | 90 days |
| Passwords | ✅ YES (hashed) | Database | Until changed |

### Key Takeaways

1. **No Audio Persistence:** VoiceShield never saves, records, or stores call audio
2. **Transient Processing:** All audio processing is in-memory only with bounded buffers
3. **Immediate Cleanup:** Audio buffers cleared immediately when call ends
4. **Metadata Only:** Database contains only call metadata and risk scores
5. **User Control:** Users can delete accounts and associated metadata
6. **Transparency:** Open source code allows verification
7. **Third-Party:** External model API has separate privacy policy

---

**Privacy is not just a feature—it's our architecture.**

---

**Document Version:** 1.0  
**Last Updated:** September 6, 2026  
**Maintained By:** VoiceShield Team
