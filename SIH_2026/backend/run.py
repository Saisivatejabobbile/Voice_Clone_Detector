"""
VoiceShield Backend - Run Script
Quick start script for development
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    print(f"🌐 Server: http://{settings.HOST}:{settings.PORT}")
    print(f"📖 Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔐 CORS Origins: {settings.cors_origins}")
    print()
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
