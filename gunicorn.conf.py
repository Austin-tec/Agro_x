# Gunicorn configuration for AgroX backend deployment

# Server socket - Use Railway's PORT environment variable
import os
port = os.getenv('PORT', '8000')
bind = f"0.0.0.0:{port}"
backlog = 2048

# Worker processes
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, this can help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'

# Process naming
proc_name = 'agrox_backend'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'
user = None
group = None
tmp_upload_dir = None

# Application
wsgi_module = "backend.app:app"
# Remove hardcoded pythonpath - let Railway handle it

# Environment variables
raw_env = [
    "FLASK_ENV=production"
]

# SSL (uncomment and configure for HTTPS)
# keyfile = "/path/to/ssl/private.key"
# certfile = "/path/to/ssl/certificate.crt"
