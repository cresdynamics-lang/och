#!/usr/bin/env python3
"""
Test script to verify Django settings are working correctly.
"""
import os
import sys

# Add the Django app to Python path
sys.path.insert(0, 'backend/django_app')

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

# Set FRONTEND_URL if not set
os.environ.setdefault('FRONTEND_URL', 'http://localhost:3000')

try:
    import django
    django.setup()

    from django.conf import settings
    print("✅ Django settings loaded successfully!")
    print(f"FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'NOT_SET')}")
    print(f"DEBUG: {getattr(settings, 'DEBUG', 'NOT_SET')}")
    print(f"DATABASES configured: {'default' in getattr(settings, 'DATABASES', {})}")

except Exception as e:
    print(f"❌ Error loading Django settings: {e}")
    import traceback
    traceback.print_exc()





































