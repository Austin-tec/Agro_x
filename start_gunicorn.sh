#!/bin/bash
# Start script for AgroX backend with Gunicorn

# Set environment variables
export FLASK_ENV=production
export FLASK_APP=app.py

# Navigate to backend directory
cd backend

# Start Gunicorn with the configuration
gunicorn --config gunicorn.conf.py backend.app:app