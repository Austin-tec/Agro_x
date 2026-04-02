@echo off
REM Start script for AgroX backend with Gunicorn (Windows)

REM Set environment variables
set FLASK_ENV=production
set FLASK_APP=app.py

REM Navigate to backend directory
cd backend

REM Start Gunicorn with the configuration
gunicorn --config gunicorn.conf.py backend.app:app