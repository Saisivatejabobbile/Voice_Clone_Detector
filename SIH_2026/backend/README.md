# VoiceShield Backend

Python FastAPI backend for VoiceShield's AI voice integrity security system with WebRTC signaling and real-time voice analysis.

## Status: 🚧 IN DEVELOPMENT

**Progress**: Backend foundation created, WebRTC signaling in progress

---

## Tech Stack

- **Framework**: FastAPI 0.109.0
- **Server**: Uvicorn (ASGI server)
- **Database**: SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: Passlib + Bcrypt
- **WebSocket**: Native FastAPI WebSocket support
- **AI/ML**: PyTorch + Librosa (voice analysis)
- **Audio Processing**: NumPy + SciPy

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and configuration
│   ├── database.py          # Database setup
│   │
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── call_session.py
│   │   └── call_history.py
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   └── call.py
│   │
│   ├── auth/                # Authentication
│   │   ├── security.py      # JWT & password hashing
│   │   └── dependencies.py  # Auth dependencies
│   │
│   ├── routers/             # API routes (TODO)
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── calls.py
│   │
│   ├── websockets/          # WebSocket handlers (TODO)
│   │   ├── signaling.py     # WebRTC signaling
│   │   ├── analysis.py      # Audio analysis
│   │   └── connection_manager.py
│   │
│   └── services/            # Business logic (TODO)
│       ├── call_manager.py
│       ├── user_service.py
│       └── ai_analyzer.py
│
├── models/                  # AI model files
│   └── .gitkeep
├── logs/                    # Application logs
│   └── .gitkeep
├── uploads/                 # Temporary uploads
│   └── .gitkeep
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── .env                     # Environment variables (gitignored)
└── run.py                   # Quick start script
```

---

## Quick Start

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

```bash
# Navigate to backend directory
cd SIH_2026/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

The `.env` file is already created with development settings. For production, update:
- `SECRET_KEY` - Generate a secure random key
- `DATABASE_URL` - Use PostgreSQL instead of SQLite
- `DEBUG` - Set to False

### Run Development Server

```bash
# Method 1: Using run.py script
python run.py

# Method 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

## Features Implemented

### ✅ Part 1: Backend Foundation (Complete)
- FastAPI application setup
- Configuration management (env variables)
- Database setup with SQLAlchemy
- CORS middleware
- Health check endpoints
- Logging configuration

### ✅ Part 2: Database Models (Complete)
- **User Model**: Authentication and profile
- **Call Session Model**: In-memory active calls
- **Call History Model**: Persistent call records

### ✅ Part 3: Authentication (Complete)
- Password hashing with bcrypt
- JWT token generation and validation
- Protected route dependencies
- User schemas (Pydantic)

### 🚧 Part 4: API Routes (In Progress)
- [ ] Auth routes (register, login, logout)
- [ ] User routes (profile, online users)
- [ ] Call routes (history, session details)

### 🚧 Part 5: WebRTC Signaling (In Progress)
- [ ] WebSocket connection manager
- [ ] Signaling WebSocket endpoint
- [ ] Call initiation and acceptance
- [ ] Offer/Answer SDP exchange
- [ ] ICE candidate exchange
- [ ] Hangup handling

### 🚧 Part 6: Audio Analysis (In Progress)
- [ ] Analysis WebSocket endpoint
- [ ] PCM audio processing
- [ ] AI model integration
- [ ] Risk level calculation
- [ ] Real-time risk updates

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (invalidate token)
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/online` - Get online users
- `GET /api/users/{user_id}` - Get user by ID
- `PUT /api/users/me` - Update profile

### Calls
- `GET /api/calls/history` - Get call history
- `GET /api/calls/{call_id}` - Get call session details

### WebSocket
- `WS /ws/signaling` - WebRTC signaling WebSocket
- `WS /ws/analysis` - Audio analysis WebSocket

### Health
- `GET /` - API status
- `GET /health` - Health check

---

## Database Schema

### Users Table
```sql
id              INTEGER PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
hashed_password VARCHAR(255) NOT NULL
full_name       VARCHAR(255) NOT NULL
phone           VARCHAR(50)
avatar_url      VARCHAR(500)
is_active       BOOLEAN DEFAULT TRUE
is_verified     BOOLEAN DEFAULT FALSE
is_online       BOOLEAN DEFAULT FALSE
preferences     TEXT (JSON)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
last_seen       TIMESTAMP
```

### Call History Table
```sql
id                    INTEGER PRIMARY KEY
call_id               VARCHAR(255) UNIQUE NOT NULL
caller_id             INTEGER FOREIGN KEY -> users.id
callee_id             INTEGER FOREIGN KEY -> users.id
started_at            TIMESTAMP NOT NULL
connected_at          TIMESTAMP
ended_at              TIMESTAMP NOT NULL
duration              INTEGER (seconds)
final_state           VARCHAR(50)
risk_level            VARCHAR(50) (LOW/MEDIUM/HIGH)
risk_score            FLOAT (0-100)
synthetic_confidence  FLOAT (0-100)
model_confidence      FLOAT (0-100)
recommendation        TEXT
acoustic_indicators   JSON
prosody_indicators    JSON
risk_updates          JSON
created_at            TIMESTAMP DEFAULT NOW()
```

---

## Environment Variables

See `.env.example` for all available options. Key variables:

```env
# Application
APP_NAME=VoiceShield
DEBUG=True
ENVIRONMENT=development

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite:///./voiceshield.db

# JWT
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5175

# AI Model
MODEL_PATH=./models/voice_detector.pth
MODEL_CONFIDENCE_THRESHOLD=0.7
```

---

## Development

### Database Migrations

(Alembic migrations will be added later)

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

---

## Next Steps

1. **Create API Routes** (auth, users, calls)
2. **Build WebRTC Signaling Server** (WebSocket)
3. **Build Audio Analysis Server** (WebSocket)
4. **Integrate AI Model** (voice analysis)
5. **Add Call History Persistence**
6. **Add User Presence Tracking**
7. **Add Testing Suite**

---

## Integration with Frontend

Once backend is running, update frontend `.env`:

```env
VITE_MOCK_MODE=false
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## License

Part of the VoiceShield project. See root LICENSE file.

FastAPI backend for VoiceShield voice integrity analysis.

## Overview

The backend provides:
- REST API for authentication, users, contacts, calls
- WebSocket signaling for WebRTC negotiation
- WebSocket analysis endpoint for real-time audio processing
- External AI model integration
- Risk scoring engine
- Privacy-first audio handling (transient processing only)

## Tech Stack

- **Framework:** FastAPI 0.104+
- **Language:** Python 3.10+
- **Database:** PostgreSQL 14+
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Auth:** JWT (python-jose)
- **Password:** bcrypt
- **WebSocket:** FastAPI WebSockets
- **HTTP Client:** httpx (for external model API)

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI application
│   ├── config.py                # Configuration
│   ├── database.py              # Database connection
│   ├── models/                  # SQLAlchemy models
│   ├── schemas/                 # Pydantic schemas
│   ├── routers/                 # API endpoints
│   ├── websockets/              # WebSocket handlers
│   ├── services/                # Business logic
│   ├── utils/                   # Utilities
│   └── middleware/              # Middleware
├── alembic/                     # Database migrations
├── requirements.txt
└── .env.example
```

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

See `API_CONTRACT.md` for complete API documentation.

## Key Services

### AuthService
- User registration and login
- JWT token generation and validation
- Password hashing (bcrypt)

### PresenceService
- Track online/offline status
- Broadcast presence updates via WebSocket

### CallService
- Manage call sessions
- Store call metadata (NO AUDIO)

### AnalysisService
- Receive audio chunks from WebSocket
- Maintain bounded in-memory buffers
- Call external model API
- Send results to risk engine

### ModelClient
- `ExternalVoiceDetectionModel` - Calls deployed model API
- `MockVoiceDetectionModel` - Mock for development
- Authentication with `MODEL_API_KEY`

### RiskEngine
- Convert model's synthetic probability to application risk
- Configurable thresholds (LOW/MEDIUM/HIGH)
- Generate recommendations

## Privacy Requirements

**CRITICAL:** The backend must:
- ✅ Use bounded in-memory buffers for audio
- ✅ Clear buffers immediately on call termination
- ❌ NEVER write audio to disk
- ❌ NEVER store audio in database
- ❌ NEVER log audio data
- ❌ NEVER cache audio in Redis
- ✅ Validate all audio inputs
- ✅ Enforce maximum buffer sizes

## Environment Variables

**IMPORTANT:** Keep `MODEL_API_KEY` secret! Never expose to frontend!

```env
DATABASE_URL=postgresql://user:pass@localhost/voiceshield
JWT_SECRET=your-secret-key
MODEL_API_URL=https://your-model-api.com/predict
MODEL_API_KEY=your-api-key
MODEL_MODE=mock  # or 'real'
```

See `.env.example` for complete configuration.

## Database Models

### User
- id, email, password_hash, full_name
- created_at, updated_at, last_seen

### CallSession
- id, caller_id, receiver_id
- started_at, ended_at, duration_seconds, status
- **NO AUDIO COLUMNS**

## Testing

```bash
pytest                          # Run all tests
pytest tests/unit/              # Unit tests only
pytest tests/integration/       # Integration tests only
pytest -v                       # Verbose output
pytest --cov=app               # Coverage report
```

## Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run on custom port
uvicorn app.main:app --host 0.0.0.0 --port 8080

# Run with workers (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Show current revision
alembic current
```

## Security Checklist

- [ ] Strong `JWT_SECRET` set (use: `openssl rand -hex 32`)
- [ ] `MODEL_API_KEY` is backend-only
- [ ] Passwords hashed with bcrypt
- [ ] CORS configured for production domain
- [ ] HTTPS enabled in production
- [ ] No sensitive data in logs
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled (production)

## Privacy Checklist

- [ ] No audio in database schema
- [ ] Bounded buffers implemented
- [ ] Cleanup on call termination verified
- [ ] No audio in log files
- [ ] No `file.write()` calls for audio
- [ ] Transient processing verified

## Next Steps

1. Set up FastAPI application structure
2. Implement database models and migrations
3. Build authentication system
4. Create WebSocket handlers (signaling + analysis)
5. Implement external model client
6. Build risk engine
7. Add comprehensive tests
8. Verify privacy guarantees
