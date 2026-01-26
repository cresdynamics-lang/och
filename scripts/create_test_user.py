#!/usr/bin/env python3
"""
Create a test user for testing goal creation
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

def create_test_user():
    # Delete existing user if it exists
    User.objects.filter(email__in=['test@example.com', 'test@test.com']).delete()

    # Create test user
    user = User.objects.create(
        email='test@test.com',
        username='testuser123',  # Use unique username
        first_name='Test',
        last_name='User',
        account_status='active',
        email_verified=True,
        is_active=True,
    )

    user.set_password('testpass123')
    user.save()

    print(f"Created user: {user.email}")
    print(f"Password set to: testpass123")

    # Verify password works
    password_valid = user.check_password('testpass123')
    print(f"Password verification: {password_valid}")

if __name__ == '__main__':
    create_test_user()
