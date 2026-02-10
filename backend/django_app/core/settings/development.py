"""
Development settings for core project.
"""
from .base import *

DEBUG = True

# Allow override via environment; fall back to dev defaults
if os.environ.get('ALLOWED_HOSTS'):
    ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '').split(',') if h.strip()]
else:
    ALLOWED_HOSTS = [
        'localhost', '127.0.0.1', '0.0.0.0', 'testserver', 'nginx', 'django'
    ]

# Frontend URL for development
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Session settings for OAuth (cross-origin)
SESSION_COOKIE_SAMESITE = 'Lax'  # Allow cross-origin session cookies in development
SESSION_COOKIE_SECURE = False  # Not secure in development (no HTTPS)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_DOMAIN = None  # Allow localhost/127.0.0.1
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if os.environ.get('CSRF_TRUSTED_ORIGINS') else [
    'http://localhost:3000', 'http://127.0.0.1:3000'
]

# CORS settings for development
# Allow override via environment variable
if os.environ.get('CORS_ALLOWED_ORIGINS'):
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',  # In case Next.js runs on different port
    ]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Development-specific settings
INSTALLED_APPS = INSTALLED_APPS + [
    'django_extensions',  # Optional: for enhanced shell, etc.
]

# Use PostgreSQL for development (uses existing users table and data)
# Set USE_SQLITE=true in .env to use SQLite instead (e.g. if PostgreSQL is not running)
USE_SQLITE_FORCE = os.environ.get('USE_SQLITE', 'false').lower() == 'true'
if USE_SQLITE_FORCE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # PostgreSQL from base.py: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
    # Or set DATABASE_URL (see production.py) to override
    if os.environ.get('DATABASE_URL'):
        import dj_database_url
        DATABASES = {'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'), conn_max_age=600)}
    # else DATABASES already set in base.py (PostgreSQL with env vars)

# Use .env MAIL_* (SMTP) when MAIL_HOST is set; otherwise console for local testing
if os.environ.get('MAIL_HOST'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


