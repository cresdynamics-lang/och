#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.conf import settings
from django.core.files.storage import default_storage

def test_media_setup():
    """Test media directory setup"""
    
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    
    # Check if media directory exists
    if os.path.exists(settings.MEDIA_ROOT):
        print("+ MEDIA_ROOT directory exists")
    else:
        print("- MEDIA_ROOT directory does not exist, creating...")
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        print("+ Created MEDIA_ROOT directory")
    
    # Test creating missions subdirectory
    missions_dir = os.path.join(settings.MEDIA_ROOT, 'missions')
    if not os.path.exists(missions_dir):
        os.makedirs(missions_dir, exist_ok=True)
        print("+ Created missions directory")
    else:
        print("+ Missions directory exists")
    
    print("Media setup test complete")

if __name__ == '__main__':
    test_media_setup()