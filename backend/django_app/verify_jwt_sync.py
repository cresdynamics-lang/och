#!/usr/bin/env python
"""
Quick script to verify JWT key synchronization between Django and FastAPI.
Run: python verify_jwt_sync.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.conf import settings

print("=" * 80)
print("Django JWT Configuration")
print("=" * 80)
print(f"SECRET_KEY length: {len(settings.SECRET_KEY)}")
print(f"SECRET_KEY starts with: {settings.SECRET_KEY[:20]}...")
print(f"JWT_SECRET_KEY length: {len(settings.JWT_SECRET_KEY)}")
print(f"JWT_SECRET_KEY starts with: {settings.JWT_SECRET_KEY[:20]}...")
print(f"JWT_ALGORITHM: {settings.JWT_ALGORITHM}")
print(f"SIMPLE_JWT SIGNING_KEY length: {len(settings.SIMPLE_JWT['SIGNING_KEY'])}")
print(f"SIMPLE_JWT SIGNING_KEY starts with: {settings.SIMPLE_JWT['SIGNING_KEY'][:20]}...")
print(f"SIMPLE_JWT ALGORITHM: {settings.SIMPLE_JWT['ALGORITHM']}")
print()

# Check if keys match
if settings.SECRET_KEY == settings.JWT_SECRET_KEY:
    print("⚠️  JWT_SECRET_KEY equals SECRET_KEY (using fallback)")
else:
    print("✅ JWT_SECRET_KEY is different from SECRET_KEY (using dedicated key)")

if settings.JWT_SECRET_KEY == settings.SIMPLE_JWT['SIGNING_KEY']:
    print("✅ JWT_SECRET_KEY matches SIMPLE_JWT SIGNING_KEY")
else:
    print("❌ ERROR: JWT_SECRET_KEY does NOT match SIMPLE_JWT SIGNING_KEY")

print()
print("=" * 80)
print("FastAPI JWT Configuration")
print("=" * 80)
try:
    import sys
    import os
    fastapi_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fastapi_app')
    sys.path.insert(0, fastapi_path)
    from config import settings as fastapi_settings
    
    print(f"JWT_SECRET_KEY length: {len(fastapi_settings.JWT_SECRET_KEY)}")
    print(f"JWT_SECRET_KEY starts with: {fastapi_settings.JWT_SECRET_KEY[:20]}...")
    print(f"JWT_ALGORITHM: {fastapi_settings.JWT_ALGORITHM}")
    print()
    
    # Check if keys match
    if settings.JWT_SECRET_KEY == fastapi_settings.JWT_SECRET_KEY:
        print("✅ Django and FastAPI JWT_SECRET_KEY MATCH!")
    else:
        print("❌ ERROR: Django and FastAPI JWT_SECRET_KEY do NOT match!")
        print(f"   Django: {settings.JWT_SECRET_KEY[:30]}...")
        print(f"   FastAPI: {fastapi_settings.JWT_SECRET_KEY[:30]}...")
    
    if settings.JWT_ALGORITHM == fastapi_settings.JWT_ALGORITHM:
        print("✅ Django and FastAPI JWT_ALGORITHM MATCH!")
    else:
        print("❌ ERROR: Django and FastAPI JWT_ALGORITHM do NOT match!")
        
except Exception as e:
    print(f"⚠️  Could not load FastAPI config: {e}")
    print("Run manually: cd ../fastapi_app && python -c \"from config import settings; print('JWT_SECRET_KEY:', settings.JWT_SECRET_KEY[:20] + '...'); print('JWT_ALGORITHM:', settings.JWT_ALGORITHM)\"")

print("=" * 80)
