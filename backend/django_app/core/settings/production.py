"""
Production settings for core project.
"""
from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Security settings for production
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files handling
STATIC_ROOT = '/var/www/static/'
MEDIA_ROOT = '/var/www/media/'


