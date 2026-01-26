from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override any PostgreSQL-specific settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Disable PostgreSQL-specific features for SQLite
INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in ['django.contrib.postgres']]

