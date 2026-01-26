#!/usr/bin/env python3
"""
Set a user's profiler recommendation to 'leadership' track
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/caleb/kiptoo/och/ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from student_dashboard.models import StudentDashboardCache

User = get_user_model()

def set_user_to_leadership():
    # Get the test user
    try:
        user = User.objects.get(email='test@test.com')
        print(f"Found user: {user.email}")
    except User.DoesNotExist:
        print("User not found. Creating one...")
        user = User.objects.create(
            email='test@test.com',
            username='testuser123',
            first_name='Test',
            last_name='User',
            account_status='active',
            email_verified=True,
            is_active=True,
        )
        user.set_password('testpass123')
        user.save()
        print(f"Created user: {user.email}")

    # Get or create student dashboard cache
    cache, created = StudentDashboardCache.objects.get_or_create(user=user)
    
    # Set recommended track to leadership
    cache.recommended_track = 'leadership'
    cache.save()
    
    print(f"✅ Set {user.email} recommended_track to: {cache.recommended_track}")
    
    # Verify
    cache.refresh_from_db()
    print(f"Verified: {cache.recommended_track}")

if __name__ == '__main__':
    set_user_to_leadership()
