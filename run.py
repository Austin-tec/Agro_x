"""
AgroX Unified Server - Frontend + Backend on Port 5000
Resolves CORS issues by serving everything from the same port and origin
"""
import os
import sys
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from pathlib import Path

# ==================== SETUP PATHS ====================
BASE_DIR = Path(__file__).parent
TEMPLATE_DIR = BASE_DIR / 'agrox' / 'Template'
CSS_DIR = BASE_DIR / 'css'
JS_DIR = BASE_DIR / 'js'
BACKEND_DIR = BASE_DIR / 'backend'

sys.path.insert(0, str(BACKEND_DIR))

# ==================== CREATE BACKEND APP ====================
from app import create_app as create_backend

backend_blueprint_app = create_backend('development')

# ==================== CREATE AND RUN ====================
app = backend_blueprint_app

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🚀 AgroX UNIFIED SERVER")
    print("=" * 70)
    print("\n✅ Everything on ONE PORT: 5000")
    print("\n🌐 Frontend:  http://127.0.0.1:5000")
    print("   - HTML files at: http://127.0.0.1:5000/")
    print("   - CSS at: http://127.0.0.1:5000/css/")
    print("   - JS at: http://127.0.0.1:5000/js/")
    print("\n🔌 Backend API:  http://127.0.0.1:5000/api/*")
    print("   - All API endpoints prefixed with /api/")
    print("\n📁 Directories:")
    print("   - Templates: ./agrox/Template/")
    print("   - CSS: ./css/")
    print("   - JS: ./js/")
    print("   - Database: ./instance/agro.db")
    print("\n" + "=" * 70 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
