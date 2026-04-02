#!/usr/bin/env python3
"""
AgroX SIMPLE Unified Server
- Backend Flask app handles /api/* routes
- Add static route middleware for frontend files
"""
import os
import sys
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).parent.resolve()
TEMPLATE_DIR = BASE_DIR / 'agrox' / 'Template'
CSS_DIR = BASE_DIR / 'css'
JS_DIR = BASE_DIR / 'js'
BACKEND_DIR = BASE_DIR / 'backend'

sys.path.insert(0, str(BACKEND_DIR))

# Import and create backend app
from app import create_app
app = create_app('development')

# ============ ADD FRONTEND ROUTES AFTER BACKEND ============
from flask import send_file, jsonify



if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🚀 AgroX - UNIFIED SERVER")
    print("=" * 70)
    print("\n✅ Everything on PORT 5000")
    print("\n📍 Frontend URLs:")
    print("   http://127.0.0.1:5000/              -> index.html")
    print("   http://127.0.0.1:5000/register.html -> register page")
    print("   http://127.0.0.1:5000/css/...       -> CSS files")
    print("   http://127.0.0.1:5000/js/...        -> JavaScript files")
    print("\n📡 Backend API URLs:")
    print("   http://127.0.0.1:5000/api/listings  -> Get listings")
    print("   http://127.0.0.1:5000/api/auth/...  -> Auth endpoints")
    print("   http://127.0.0.1:5000/api/health    -> Health check")
    print("\n" + "=" * 70 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
