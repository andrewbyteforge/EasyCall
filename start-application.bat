@echo off
echo ========================================
echo Blockchain Intelligence Workflow Builder
echo ========================================
echo.
echo Starting Backend Server...
cd backend
start cmd /k "call venv\Scripts\activate && python main.py"
timeout /t 5
echo Starting Frontend Server...
cd ..\frontend
start cmd /k "npm install && npm start"
echo.
echo ========================================
echo Application is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
