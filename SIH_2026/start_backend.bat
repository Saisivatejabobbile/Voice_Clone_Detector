@echo off
echo ========================================
echo Starting VoiceShield Backend Server
echo ========================================
echo.
echo Port: 8000
echo URL: http://localhost:8000
echo.
echo KEEP THIS WINDOW OPEN!
echo.
echo ========================================
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause

