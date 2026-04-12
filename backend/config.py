"""
Flask application configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///agrox.db')
    LOCAL_SQLITE_DATABASE_URI = os.getenv('LOCAL_SQLITE_DATABASE_URI', 'sqlite:///agrox.db')
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_size': int(os.getenv('DB_POOL_SIZE', 5)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 10)),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', 30)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 1800)),
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    
    # Flask-Mail Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = str(os.getenv('MAIL_USE_TLS', 'true')).lower() in ('true', '1', 'yes')
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'your-email@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'your-app-password')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@agrox.com')
    
    # CORS
    # Allow common local development origins (localhost, 127.0.0.1, file://, and null)
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:*,http://127.0.0.1:*,file://,null'
    ).split(',')
    
    # App Settings
    DEBUG = os.getenv('DEBUG', False)
    TESTING = False
    USE_SUPABASE = str(os.getenv('USE_SUPABASE', 'false')).lower() in ('true', '1', 'yes')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    MAIL_DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Config dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
