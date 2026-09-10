# Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Configuration

#### Backend Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/voiceshield

# JWT Authentication
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Model Service
AI_MODEL_URL=http://localhost:5000/predict
AI_MODEL_TIMEOUT=10

# CORS
FRONTEND_URL=http://localhost:5173

# WebSocket
WS_HEARTBEAT_INTERVAL=30
```

#### Frontend Environment Variables (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

### 2. Dependencies Check

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

**Required packages:**
- fastapi >= 0.104.0
- uvicorn[standard] >= 0.24.0
- websockets >= 12.0
- httpx >= 0.25.0
- sqlalchemy >= 2.0.0
- psycopg2-binary >= 2.9.9
- python-jose[cryptography] >= 3.3.0
- passlib[bcrypt] >= 1.7.4

#### Frontend
```bash
cd frontend
npm install
```

**Required packages:**
- react >= 18.2.0
- simple-peer >= 9.11.1
- zustand >= 4.4.0
- tailwindcss >= 3.3.0

### 3. Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE voiceshield;

# Run migrations
cd backend
alembic upgrade head
```

### 4. AI Model Service

Ensure AI model service is running:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "healthy"}
```

---

## Build & Test

### 1. Backend Tests
```bash
cd backend
pytest tests/ -v
```

**Expected:** All tests pass

### 2. Frontend Build
```bash
cd frontend
npm run build
```

**Expected:** Build completes without errors

### 3. Lint Check
```bash
# Backend
cd backend
flake8 app/

# Frontend
cd frontend
npm run lint
```

---

## Production Deployment

### 1. Backend Deployment

#### Using Docker
```bash
cd backend
docker build -t voiceshield-backend .
docker run -d -p 8000:8000 --env-file .env voiceshield-backend
```

#### Using Gunicorn/Uvicorn
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Production settings:**
- Workers: 4-8 (based on CPU cores)
- Timeout: 60 seconds
- Keep-alive: 5 seconds

### 2. Frontend Deployment

#### Build for Production
```bash
cd frontend
npm run build
```

#### Serve with Nginx
```nginx
server {
    listen 80;
    server_name voiceshield.example.com;
    
    root /var/www/voiceshield/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. SSL/TLS Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d voiceshield.example.com
```

**Important:** WebRTC requires HTTPS in production!

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://voiceshield.example.com/api/health

# WebSocket connectivity
wscat -c wss://voiceshield.example.com/ws/signaling?token=TEST_TOKEN
```

### 2. Functional Tests

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads with user list
- [ ] Presence indicators show online/offline status
- [ ] Call initiation works
- [ ] Audio permission prompts appear
- [ ] WebRTC connection establishes
- [ ] Audio streaming works both ways
- [ ] Risk dashboard updates in real-time
- [ ] Call history saves correctly
- [ ] Logout works

### 3. Browser Compatibility

Test on:
- [ ] Chrome 100+
- [ ] Firefox 100+
- [ ] Edge 100+
- [ ] Safari 15+

### 4. Performance Metrics

Monitor:
- WebSocket connection stability
- Audio latency (should be < 500ms)
- Risk analysis response time (should be < 2s)
- Database query performance
- Memory usage (frontend & backend)

---

## Monitoring & Logging

### 1. Backend Logging

```python
# Configure in app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### 2. Frontend Error Tracking

Consider integrating Sentry:
```bash
npm install @sentry/react
```

### 3. WebSocket Monitoring

Track:
- Active connections count
- Message throughput
- Connection errors
- Reconnection frequency

---

## Rollback Plan

### If deployment fails:

1. **Backend rollback:**
```bash
docker stop voiceshield-backend
docker run -d -p 8000:8000 --env-file .env voiceshield-backend:previous
```

2. **Frontend rollback:**
```bash
cd /var/www/voiceshield
rm -rf dist
cp -r dist.backup dist
```

3. **Database rollback:**
```bash
cd backend
alembic downgrade -1
```

---

## Security Checklist

- [ ] All environment variables secured (no hardcoded secrets)
- [ ] HTTPS enabled for production
- [ ] JWT secret key is strong (32+ random bytes)
- [ ] Database credentials are secure
- [ ] CORS configured correctly (no wildcard `*` in production)
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (using SQLAlchemy ORM)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSP headers configured

---

## Scaling Considerations

### Horizontal Scaling

**Backend:**
- Use load balancer (nginx/HAProxy)
- Enable sticky sessions for WebSocket
- Share Redis for session storage

**Database:**
- Enable connection pooling
- Consider read replicas for analytics

**AI Model Service:**
- Deploy multiple instances
- Use message queue (RabbitMQ/Kafka) for async processing

### Vertical Scaling

**Backend:**
- Increase worker count
- Allocate more CPU/RAM

**Database:**
- Increase max connections
- Optimize indexes

---

## Troubleshooting

### Common Issues

**1. WebSocket connection fails**
- Check CORS settings
- Verify JWT token is valid
- Check firewall rules
- Ensure Nginx WebSocket proxy config is correct

**2. Audio not working**
- Verify HTTPS is enabled (microphone requires secure context)
- Check browser permissions
- Test with chrome://webrtc-internals

**3. High latency**
- Check network connectivity
- Monitor CPU usage
- Verify AI model service response time

**4. Database connection errors**
- Check connection pool size
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running

---

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor disk space
- Verify backup completion

**Weekly:**
- Review performance metrics
- Check for security updates
- Analyze user feedback

**Monthly:**
- Update dependencies
- Review and optimize database queries
- Test disaster recovery plan

---

## Support Contacts

**Technical Issues:**
- Backend: [backend-team@example.com]
- Frontend: [frontend-team@example.com]
- DevOps: [devops@example.com]

**Emergency:**
- On-call: [on-call@example.com]
- Phone: [+1-XXX-XXX-XXXX]
