@echo off
echo Setting up FastAPI environment...
cd /d "%~dp0backend\fastapi_app"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt

echo Starting FastAPI server on port 8001...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
