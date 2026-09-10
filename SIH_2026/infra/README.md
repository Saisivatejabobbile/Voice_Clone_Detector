# VoiceShield Infrastructure

Infrastructure configurations for local development and production deployment.

## Contents

- **docker-compose.yml** - Local development environment
- **docker-compose.prod.yml** - Production deployment
- **nginx/** - Nginx reverse proxy configuration
- **coturn/** - TURN server configuration (optional)
- **postgresql/** - PostgreSQL initialization
- **k8s/** - Kubernetes manifests (optional)

## Local Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Services

- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379 (optional)
- **Backend:** localhost:8000
- **Frontend:** localhost:5173
- **coturn:** localhost:3478 (optional)

## Production Deployment

### Using Docker Compose (Production)

```bash
# Set environment variables first
export JWT_SECRET=$(openssl rand -hex 32)
export MODEL_API_KEY=your-actual-key

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### Using Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployments
kubectl get deployments
kubectl get services

# View logs
kubectl logs -f deployment/voiceshield-backend
```

## Nginx Configuration

Nginx acts as reverse proxy:
- Route `/api` to backend
- Route `/ws` to WebSocket
- Serve frontend static files
- SSL/TLS termination

## TURN Server (coturn)

Optional TURN server for NAT traversal:
- Required for WebRTC across different networks
- Can use third-party service (Twilio, Xirsys)
- Or self-host with coturn

## Environment Variables

Create `.env` in `infra/`:

```env
# PostgreSQL
POSTGRES_USER=voiceshield_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=voiceshield

# Redis (optional)
REDIS_PASSWORD=redis_password

# Backend
JWT_SECRET=your-jwt-secret
MODEL_API_URL=https://model-api.example.com
MODEL_API_KEY=your-model-key

# coturn (optional)
TURN_USERNAME=turn_user
TURN_PASSWORD=turn_password
```

## Volume Mapping

```
./postgresql/data -> /var/lib/postgresql/data
./nginx/logs -> /var/log/nginx
./redis/data -> /data (optional)
```

**IMPORTANT:** No audio files should ever appear in these volumes!

## Security Considerations

### Production Checklist

- [ ] Use strong passwords
- [ ] Enable SSL/TLS (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable monitoring
- [ ] Configure log rotation
- [ ] Use secrets management
- [ ] Restrict database access
- [ ] Enable rate limiting

### Network Security

- Expose only necessary ports
- Use internal network for service communication
- Enable firewall
- Configure CORS properly

## Monitoring

### Health Checks

- Backend: `GET /api/health`
- PostgreSQL: Connection test
- Redis: `PING` command

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Nginx logs
docker-compose logs -f nginx

# Database logs
docker-compose logs -f postgres
```

## Backup Strategy

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U voiceshield_user voiceshield > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U voiceshield_user voiceshield < backup.sql
```

### Important Notes

- Only backup metadata (users, call sessions)
- NO AUDIO DATA to backup (by design)
- Backup environment variables securely
- Test restore process regularly

## Scaling

### Horizontal Scaling

For production load:

1. **Multiple backend instances**
   - Use load balancer
   - Sticky sessions for WebSocket
   - Or use Redis pub/sub for WebSocket broadcast

2. **Database**
   - Connection pooling
   - Read replicas
   - PostgreSQL clustering

3. **Redis**
   - Redis Cluster for high availability
   - Sentinel for failover

### Load Balancing

Nginx can distribute load:
```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## Next Steps

1. Create docker-compose.yml for local development
2. Create docker-compose.prod.yml for production
3. Configure Nginx reverse proxy
4. Set up PostgreSQL initialization scripts
5. Add coturn configuration (optional)
6. Create Kubernetes manifests (optional)
7. Document deployment process
8. Set up monitoring and alerting
