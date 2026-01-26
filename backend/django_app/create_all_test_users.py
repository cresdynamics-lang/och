#!/usr/bin/env python
"""
Create all test users for development.
Run: python create_all_test_users.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from django.db.models.signals import post_save
from community import signals

User = get_user_model()

# Disconnect problematic signal
post_save.disconnect(signals.auto_map_user_on_create, sender=User)

try:
    test_users = [
        {'email': 'admin@test.com', 'username': 'admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
        {'email': 'student@test.com', 'username': 'student', 'role': 'student'},
        {'email': 'mentor@test.com', 'username': 'mentor', 'role': 'mentor'},
        {'email': 'director@test.com', 'username': 'director', 'role': 'program_director'},
        {'email': 'sponsor@test.com', 'username': 'sponsor', 'role': 'sponsor_admin'},
        {'email': 'analyst@test.com', 'username': 'analyst', 'role': 'analyst'},
        {'email': 'finance@test.com', 'username': 'finance', 'role': 'finance'},
    ]

    password = 'testpass123'

    for user_data in test_users:
        role_name = user_data.pop('role')
        email = user_data['email']
        
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.account_status = 'active'
            user.email_verified = True
            user.is_active = True
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
            print(f'✓ Updated: {email} ({role_name})')
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                password=password,
                account_status='active',
                email_verified=True,
                is_active=True,
                **user_data
            )
            print(f'✓ Created: {email} ({role_name})')
        
        # Assign role
        role, _ = Role.objects.get_or_create(name=role_name)
        UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={'scope': 'global', 'is_active': True}
        )

    print(f'\n✅ All test users ready!')
    print(f'Password for all users: {password}')
    print(f'\nTest credentials:')
    for user_data in test_users:
        print(f'  - {user_data["email"]} / {password}')
finally:
    # Reconnect signal
    post_save.connect(signals.auto_map_user_on_create, sender=User)

