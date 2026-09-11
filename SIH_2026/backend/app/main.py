"""
VoiceShield Backend - Main Application
FastAPI application with WebRTC signaling and AI voice analysis
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    from app.database import create_tables
    # Import models to ensure they're registered with SQLAlchemy
    from app.models.user import User
    from app.models.contact import Contact
    
    # Startup
    logger.info("Starting VoiceShield v1.0.0")
    logger.info("Environment: development")
    
    # Create database tables
    create_tables()
    logger.info("Database tables created")
    
    # Clean up any stale presence flags left from previous runs
    try:
        from app.database import SessionLocal
        with SessionLocal() as db_session:
            db_session.query(User).update({User.is_online: False})
            db_session.commit()
        logger.info("Cleared stale presence flags on startup: all users initialized to offline")
    except Exception as e:
        logger.warning(f"Could not reset presence flags on startup: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    try:
        from app.database import SessionLocal
        with SessionLocal() as db_session:
            db_session.query(User).update({User.is_online: False})
            db_session.commit()
    except Exception:
        pass


# Create FastAPI app
app = FastAPI(
    title="VoiceShield",
    version="1.0.0",
    description="Privacy-first real-time voice integrity security layer",
    lifespan=lifespan,
)


# Configure CORS - FIXED: Cannot use wildcard with credentials
app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
],

    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
    expose_headers=["Content-Type"],
    max_age=600,  # Cache preflight for 10 minutes
)

logger.info("CORS middleware configured")


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - API status"""
    return {
        "app": "VoiceShield",
        "version": "1.0.0",
        "status": "running",
        "environment": "development",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "VoiceShield",
        "version": "1.0.0",
    }


# Import and include routers
from app.routers import auth, users, calls, sessions
from app.websockets import signaling, analysis

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(signaling.router, tags=["WebRTC Signaling"])
app.include_router(analysis.router, tags=["Audio Analysis"])

logger.info("All routers registered")

