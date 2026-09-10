# VoiceShield

**Privacy-First Real-Time Voice Integrity Security Layer**

VoiceShield is a hackathon-ready application that provides real-time synthetic voice detection for browser-based WebRTC calls. It analyzes incoming audio streams to identify potential voice manipulation or impersonation attempts while maintaining strict privacy standards.

## 🎯 Purpose

VoiceShield sits on top of one-to-one WebRTC calls and:
- Analyzes ONLY the remote caller's audio stream (not the receiver's microphone)
- Integrates with an externally deployed AI voice detection model
- Provides real-time synthetic voice confidence scores
- Calculates application-level impersonation risk
- **Never persists raw call audio** - all processing is transient

## 🏗️ Architecture

```
┌─────────────┐         WebRTC Audio          ┌─────────────┐
│   Caller    │ ─────────────────────────────>│  Receiver   │
│  (Browser)  │                                │  (Browser)  │
└─────────────┘                                └──────┬──────┘
                                                      │
                                               Remote Stream Only
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │  AudioWorklet    │
                                            │  (PCM Extract)   │
                                            └────────┬─────────┘
                                                     │
                                              Transient Audio
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  FastAPI Backend │
                                            │  Analysis WS     │
                                            └────────┬─────────┘
                                                     │
                                              Bounded Buffer
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  External Model  │
                                            │  API (Deployed)  │
                                            └────────┬─────────┘
                                                     │
                                            Synthetic Confidence
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │   Risk Engine    │
                                            │ (App-level Risk) │
                                            └────────┬─────────┘
                                                     │
                                               Risk Score
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  Dashboard WS    │
                                            │  (Real-time UI)  │
                                            └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Access to externally deployed AI model API

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saisivatejabobbile/SIH_2026.git
   cd SIH_2026
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration
   ```

3. **Backend setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn main:app --reload
   ```

4. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
voiceshield/
├── frontend/          # React + Vite frontend
├── backend/           # FastAPI backend
├── tests/             # Integration and unit tests
├── docs/              # Additional documentation
├── infra/             # Docker, deployment configs
├── README.md          # This file
├── ARCHITECTURE.md    # Detailed architecture documentation
├── API_CONTRACT.md    # REST and WebSocket API contracts
├── PRIVACY.md         # Privacy and data handling policy
└── .env.example       # Environment variable template
```

## 🔑 Key Features

### ✅ Implemented
- User registration and authentication
- Contact management and online presence
- One-to-one WebRTC calling (call, accept, reject, hangup)
- Remote audio stream isolation and analysis
- Real-time synthetic voice detection
- Configurable risk scoring engine
- Live dashboard with risk visualization
- Privacy-first architecture (no audio persistence)
- Mock mode for development and testing

### 🎯 Privacy Guarantees
- ✅ Raw audio never saved to disk
- ✅ No audio in database
- ✅ No audio in localStorage/IndexedDB
- ✅ Transient in-memory processing only
- ✅ Immediate cleanup on call termination
- ✅ Clear privacy status in UI

## 🔐 Security

- JWT-based authentication
- Secure password hashing (bcrypt)
- WebSocket authentication
- CORS protection
- Payload validation
- Rate limiting (recommended for production)
- No sensitive data logging

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
cd tests
pytest integration/
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and data flow
- **[API_CONTRACT.md](./API_CONTRACT.md)** - REST and WebSocket API documentation
- **[PRIVACY.md](./PRIVACY.md)** - Privacy policy and audio handling details
- **[DEMO_GUIDE.md](./docs/DEMO_GUIDE.md)** - How to demo the application
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Contribution guidelines

## ⚙️ Configuration

Key environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/voiceshield

# Authentication
JWT_SECRET=your-secret-key

# External Model API
MODEL_API_URL=https://your-model-api.com/predict
MODEL_API_KEY=your-api-key
MODEL_MODE=mock  # or 'real'

# Audio Processing
ANALYSIS_SAMPLE_RATE=16000
ANALYSIS_WINDOW_SECONDS=3

# Risk Thresholds
RISK_LOW_THRESHOLD=30
RISK_HIGH_THRESHOLD=70

# WebRTC
STUN_SERVER_URL=stun:stun.l.google.com:19302
TURN_SERVER_URL=turn:your-turn-server.com
```

## 🎓 Important Notes

### What VoiceShield Is
- A hackathon prototype demonstrating real-time voice integrity analysis
- A privacy-first architectural reference for audio analysis
- An integration layer for externally deployed AI models

### What VoiceShield Is NOT
- ❌ Not production telecom-ready (prototype only)
- ❌ Not a universal voice-cloning detector
- ❌ Not guaranteed fraud detection
- ❌ Not scientifically validated risk thresholds
- ❌ Not a model training/deployment platform

### Model Integration
This application **does not include**:
- Model training code
- Model weights or checkpoints
- Training datasets
- Model deployment infrastructure

The AI model must be **deployed externally** and accessed via API.

## 🐛 Troubleshooting

**WebRTC connection fails:**
- Check STUN/TURN server configuration
- Verify firewall allows UDP traffic
- Test with both users on same network first

**Model API errors:**
- Verify `MODEL_API_URL` and `MODEL_API_KEY` in backend `.env`
- Test model endpoint separately
- Use `MODEL_MODE=mock` for development

**Audio not detected:**
- Check browser microphone permissions
- Verify AudioWorklet loading
- Check browser console for WebRTC errors

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

Built for Smart India Hackathon 2026

## 🙏 Acknowledgments

- WebRTC community
- FastAPI framework
- React and Vite teams
- Open source audio processing libraries

---

**⚠️ Privacy Notice:** VoiceShield analyzes audio in real-time but does not store, record, or persist any call audio. All audio processing is transient and in-memory only.
