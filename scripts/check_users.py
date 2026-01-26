#!/usr/bin/env python3
"""
Check what users exist in the database
"""
import os
import sys
import django
from django.contrib.auth import get_user_model

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

User = get_user_model()

def check_users():
    users = User.objects.all()[:5]  # Get first 5 users
    print(f"Found {User.objects.count()} users total")
    print("First 5 users:")
    for user in users:
        print(f"  {user.email} - {user.get_full_name()} - Active: {user.is_active} - Account Status: {user.account_status}")
        # Test password
        password_valid = user.check_password('testpass123')
        print(f"    Password 'testpass123' valid: {password_valid}")

if __name__ == '__main__':
    check_users()
