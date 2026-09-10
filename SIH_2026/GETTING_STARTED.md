# Getting Started with VoiceShield

Welcome to VoiceShield! This guide will help you get started with the project.

## 🎯 What You Have Now

The **complete project structure** has been created with:

### ✅ Core Documentation (Common Agreement)
- **README.md** - Project overview and quick start
- **ARCHITECTURE.md** - Complete system architecture and data flow
- **API_CONTRACT.md** - REST and WebSocket API contracts
- **PRIVACY.md** - Privacy policy and audio handling details
- **PROJECT_STRUCTURE.md** - Detailed project organization

### ✅ Configuration Files
- **.env.example** - Environment variable template
- **.gitignore** - Git ignore rules (secrets, audio, etc.)

### ✅ Directory Structure
- **frontend/** - React + JavaScript + Vite frontend
- **backend/** - FastAPI backend
- **tests/** - Test suite
- **docs/** - Additional documentation
- **infra/** - Infrastructure and deployment

### ✅ README Files
Each directory has its own README explaining:
- Purpose and responsibilities
- Technology stack
- Setup instructions
- Key components
- Next steps

---

## 📚 What to Read First

### Step 1: Understand the System (5-10 minutes)
1. **README.md** - Get the big picture
2. **ARCHITECTURE.md** - Understand the architecture
3. **PRIVACY.md** - Understand privacy guarantees

### Step 2: Review the Contracts (5 minutes)
1. **API_CONTRACT.md** - API endpoints and WebSocket messages
2. **PROJECT_STRUCTURE.md** - How code is organized

### Step 3: Review Your Area (5 minutes)
- **Frontend developers:** Read `frontend/README.md`
- **Backend developers:** Read `backend/README.md`
- **DevOps:** Read `infra/README.md`
- **QA:** Read `tests/README.md`

**Total reading time: ~15-20 minutes**

---

## 🚀 Implementation Phases

### Phase 1: Backend Foundation
**Goal:** Working FastAPI backend with authentication and database

**Tasks:**
1. Set up FastAPI application structure
2. Configure PostgreSQL database
3. Create database models (User, CallSession)
4. Implement authentication (register, login, JWT)
5. Create REST API endpoints
6. Write basic tests

**Files to create:**
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/database.py`
- `backend/app/models/user.py`
- `backend/app/routers/auth.py`
- `backend/requirements.txt`

**Deliverable:** Backend API with user authentication

---

### Phase 2: Frontend Foundation
**Goal:** React app with authentication UI

**Tasks:**
1. Set up Vite + React project
2. Create authentication components (Login, Register)
3. Implement REST API client
4. Create routing
5. Basic styling

**Files to create:**
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/auth/Login.jsx`
- `frontend/src/services/api.js`

**Deliverable:** Frontend app with login/register

---

### Phase 3: WebRTC + Signaling
**Goal:** Users can call each other

**Tasks:**
1. Implement signaling WebSocket (backend)
2. Create CallManager service (frontend)
3. Implement call flow (call, accept, reject, hangup)
4. WebRTC peer connection setup
5. Handle ICE candidates

**Files to create:**
- `backend/app/websockets/signaling.py`
- `frontend/src/services/CallManager.js`
- `frontend/src/components/call/IncomingCall.jsx`
- `frontend/src/components/call/ActiveCall.jsx`

**Deliverable:** Working WebRTC calls between users

---

### Phase 4: Audio Analysis Pipeline
**Goal:** Remote audio analyzed in real-time

**Tasks:**
1. Create AudioWorklet processor (frontend)
2. Implement analysis WebSocket (backend)
3. Create bounded buffer management (backend)
4. Implement audio validation
5. Connect remote stream to analysis

**Files to create:**
- `frontend/public/audioProcessor.js`
- `frontend/src/services/AudioProcessor.js`
- `backend/app/websockets/analysis.py`
- `backend/app/services/analysis_service.py`

**Deliverable:** Remote audio sent to backend for analysis

---

### Phase 5: Model Integration
**Goal:** External model API integrated

**Tasks:**
1. Create model client abstraction
2. Implement ExternalVoiceDetectionModel
3. Implement MockVoiceDetectionModel
4. Add error handling and timeouts
5. Test both mock and real modes

**Files to create:**
- `backend/app/services/model_client.py`
- `backend/app/services/model_factory.py`

**Deliverable:** Backend can call external model API

---

### Phase 6: Risk Engine
**Goal:** Risk scores calculated and displayed

**Tasks:**
1. Implement risk calculation logic
2. Create configurable thresholds
3. Generate recommendations
4. Send results via WebSocket
5. Display in dashboard

**Files to create:**
- `backend/app/services/risk_engine.py`
- `frontend/src/components/dashboard/RiskDisplay.jsx`
- `frontend/src/components/dashboard/LiveRiskGraph.jsx`

**Deliverable:** Real-time risk displayed to receiver

---

### Phase 7: UI/UX Polish
**Goal:** Complete user interface

**Tasks:**
1. Implement all designed screens
2. Add styling (CSS/Tailwind)
3. Create privacy indicators
4. Add loading states
5. Error handling UI
6. Responsive design

**Files to create:**
- All remaining component files
- Styling files
- Icons and assets

**Deliverable:** Complete, polished UI

---

### Phase 8: Testing & Privacy Verification
**Goal:** Comprehensive tests and privacy verification

**Tasks:**
1. Write unit tests for all services
2. Create integration tests for call flow
3. Implement privacy verification tests
4. Test cleanup on call termination
5. Verify no audio persistence

**Files to create:**
- `tests/unit/test_*.py`
- `tests/integration/test_*.py`
- `tests/conftest.py`

**Deliverable:** Fully tested application with privacy verified

---

### Phase 9: Infrastructure & Deployment
**Goal:** Deployable application

**Tasks:**
1. Create Dockerfiles
2. Write docker-compose.yml
3. Configure Nginx
4. Set up database migrations
5. Create deployment documentation

**Files to create:**
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `infra/docker-compose.yml`
- `infra/nginx/nginx.conf`
- `docs/DEPLOYMENT.md`

**Deliverable:** Production-ready deployment

---

### Phase 10: Documentation & Demo
**Goal:** Complete documentation and demo-ready

**Tasks:**
1. Complete all documentation
2. Create demo guide
3. Record demo video
4. Write contributing guide
5. Final testing

**Files to create:**
- `docs/DEMO_GUIDE.md`
- `docs/CONTRIBUTING.md`
- `docs/MODEL_INTEGRATION.md`

**Deliverable:** Demo-ready hackathon project

---

## 🎯 Quick Start Commands

### Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib bcrypt httpx python-multipart alembic
# Copy and edit .env
uvicorn app.main:app --reload
```

### Frontend (JavaScript)
```bash
cd frontend
npm create vite@latest . -- --template react
npm install
# Copy and edit .env
npm run dev
```

### Database (PostgreSQL)
```bash
# Using Docker
docker run -d \
  --name voiceshield-postgres \
  -e POSTGRES_USER=voiceshield_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=voiceshield \
  -p 5432:5432 \
  postgres:14

# Or install PostgreSQL locally and create database
```

---

## 📋 Implementation Checklist

### Before Starting Implementation
- [ ] All team members have read core documentation
- [ ] Roles assigned (frontend, backend, testing, devops)
- [ ] Development environment set up
- [ ] PostgreSQL installed or Docker ready
- [ ] External model API URL obtained (or using mock mode)

### During Implementation
- [ ] Follow the architecture in ARCHITECTURE.md
- [ ] Follow API contracts in API_CONTRACT.md
- [ ] Maintain privacy guarantees from PRIVACY.md
- [ ] Write tests alongside features
- [ ] Keep documentation updated

### Before Demo
- [ ] All 10 phases completed
- [ ] Tests passing
- [ ] Privacy verification tests passing
- [ ] Demo script prepared
- [ ] Two-browser demo working

---

## 🔒 Critical Privacy Reminders

As you implement, **always remember**:

1. ❌ **NEVER persist raw audio**
   - No file writes for audio
   - No database storage for audio
   - No localStorage/IndexedDB for audio

2. ✅ **Use bounded buffers**
   - Maximum buffer sizes enforced
   - Automatic cleanup on call end
   - Ring buffer (old data discarded)

3. ✅ **Analyze ONLY remote stream**
   - Not the receiver's microphone
   - Only the caller's audio

4. 🔐 **Keep MODEL_API_KEY secret**
   - Backend only
   - Never in frontend
   - Never with VITE_ prefix

5. 🧹 **Clean up on call termination**
   - Close WebSockets
   - Release AudioContext
   - Clear all buffers
   - Stop all tracks

---

## 🆘 Getting Help

### Documentation References
- **Architecture questions:** See ARCHITECTURE.md
- **API questions:** See API_CONTRACT.md
- **Privacy questions:** See PRIVACY.md
- **Setup issues:** See README files in each directory

### Common Issues

**Database connection fails:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check credentials

**WebRTC connection fails:**
- Check STUN/TURN configuration
- Test on same network first
- Check browser permissions

**Model API errors:**
- Verify MODEL_API_URL and MODEL_API_KEY
- Use MODEL_MODE=mock for development
- Check external model API status

---

## 🎓 Learning Resources

### WebRTC
- [WebRTC for the Curious](https://webrtcforthecurious.com/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### FastAPI
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)

### React
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioWorklet Guide](https://developer.chrome.com/blog/audio-worklet/)

---

## 🎉 Next Steps

1. **Assign roles** to team members
2. **Set up development environment** (PostgreSQL, Python, Node.js)
3. **Start with Phase 1** (Backend Foundation)
4. **Follow the phases** incrementally
5. **Test as you go** (don't wait until the end)
6. **Keep privacy front and center** throughout

---

## 📞 Project Contacts

- **Architecture Questions:** Review ARCHITECTURE.md first
- **API Questions:** Review API_CONTRACT.md first
- **Privacy Concerns:** Review PRIVACY.md first

---

**You now have everything you need to build VoiceShield! 🚀**

**Remember:** This is a privacy-first project. Every decision should prioritize user privacy and ensure no raw audio is ever persisted.

Good luck with your Smart India Hackathon 2026 project! 🇮🇳
