"""
VoiceShield Backend Configuration
Load environment variables and application settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "VoiceShield"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite:///./voiceshield.db"
    
    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-this-in-production-please-use-min-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Allow common development ports
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # WebRTC
    STUN_SERVER_URL: str = "stun:stun.l.google.com:19302"
    TURN_SERVER_URL: str = ""
    TURN_USERNAME: str = ""
    TURN_CREDENTIAL: str = ""
    
    # AI Model (Local - Optional)
    MODEL_PATH: str = "./models/voice_detector.pth"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.7
    ANALYSIS_SAMPLE_RATE: int = 16000
    ANALYSIS_CHUNK_SIZE: int = 4096
    
    # AI Model API (External - Required for WebRTC Voice Analysis)
    MODEL_API_URL: str = "https://api.voicemodel.example.com/predict"
    MODEL_API_KEY: str = ""
    MODEL_TIMEOUT_SECONDS: int = 10
    
    # Risk Analysis Thresholds
    RISK_LOW_THRESHOLD: int = 30
    RISK_HIGH_THRESHOLD: int = 70
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/voiceshield.log"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # Email (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@voiceshield.com"
    
    # Analytics (optional)
    ENABLE_ANALYTICS: bool = False
    ANALYTICS_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Create necessary directories
def create_directories():
    """Create required directories if they don't exist"""
    directories = [
        "logs",
        "uploads",
        "models",
        "temp"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        
        # Create .gitkeep files
        gitkeep_path = os.path.join(directory, ".gitkeep")
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, "w") as f:
                f.write("")


# Create directories on import
create_directories()
