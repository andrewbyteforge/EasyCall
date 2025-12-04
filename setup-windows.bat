@echo off
echo Setting up Python virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo.
echo Setup complete! Run start-application.bat to launch the app.
pause
