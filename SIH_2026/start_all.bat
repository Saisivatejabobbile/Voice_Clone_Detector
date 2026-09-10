@echo off
echo Starting servers...
start cmd /k "cd /d c:\Users\sai~1\OneDrive\Documents\SIH_2026\SIH_2026\backend ^&^& python -m uvicorn app.main:app --reload"
timeout /t 2 >nul
start cmd /k "cd /d c:\Users\sai~1\OneDrive\Documents\SIH_2026\SIH_2026\frontend ^&^& npm run dev"
timeout /t 5 >nul
start http://localhost:5173
echo Servers starting... Visit http://localhost:5173
pause