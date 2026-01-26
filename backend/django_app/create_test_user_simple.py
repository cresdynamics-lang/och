#!/usr/bin/env python
"""
Simple script to create a test student user bypassing signals.
Run: python create_test_user_simple.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Role, UserRole

User = get_user_model()

def create_test_user():
    """Create a test student user."""
    email = 'ongozacyberhub@gmail.com'
    password = 'Ongoza@#1'
    
    # Get or create student role
    role, _ = Role.objects.get_or_create(name='student')
    
    # Check if user exists
    try:
        user = User.objects.get(email=email)
        print(f'User {email} already exists. Updating password...')
        user.set_password(password)
        user.account_status = 'active'
        user.email_verified = True
        user.is_active = True
        user.save()
    except User.DoesNotExist:
        print(f'Creating user {email}...')
        user = User.objects.create_user(
            email=email,
            username='student',
            password=password,
            first_name='Student',
            last_name='User',
            account_status='active',
            email_verified=True,
            is_active=True
        )
        print(f'✓ Created user: {email}')
    
    # Assign student role
    user_role, created = UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )
    
    if created:
        print(f'✓ Assigned student role to {email}')
    else:
        print(f'✓ User {email} already has student role')
    
    print(f'\n✅ Test user ready!')
    print(f'Email: {email}')
    print(f'Password: {password}')
    print(f'\nYou can now login with these credentials.')

if __name__ == '__main__':
    try:
        create_test_user()
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

