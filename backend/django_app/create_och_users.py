#!/usr/bin/env python
"""
Create OCH users with @och.com emails and TestPass@123 password.
Run: python create_och_users.py
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
    # OCH users with @och.com domain
    och_users = [
        {
            'email': 'student@och.com',
            'username': 'student',
            'first_name': 'Student',
            'last_name': 'User',
            'role': 'student',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'email': 'mentor@och.com',
            'username': 'mentor',
            'first_name': 'Mentor',
            'last_name': 'User',
            'role': 'mentor',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'email': 'admin@och.com',
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'email': 'director@och.com',
            'username': 'director',
            'first_name': 'Program',
            'last_name': 'Director',
            'role': 'program_director',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'email': 'analyst@och.com',
            'username': 'analyst',
            'first_name': 'Data',
            'last_name': 'Analyst',
            'role': 'analyst',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'email': 'finance@och.com',
            'username': 'finance',
            'first_name': 'Finance',
            'last_name': 'Manager',
            'role': 'finance',
            'is_staff': True,
            'is_superuser': False
        }
    ]

    password = 'TestPass@123'

    print('='*60)
    print('Creating OCH Users')
    print('='*60)
    print()

    created_count = 0
    updated_count = 0

    for user_data in och_users:
        role_name = user_data.pop('role')
        email = user_data['email']
        
        try:
            user = User.objects.get(email=email)
            # Update existing user
            user.set_password(password)
            user.account_status = 'active'
            user.email_verified = True
            user.is_active = True
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
            updated_count += 1
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
            created_count += 1
            print(f'✓ Created: {email} ({role_name})')
        
        # Assign role
        role, _ = Role.objects.get_or_create(name=role_name)
        UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={'scope': 'global', 'is_active': True}
        )

    print()
    print('='*60)
    print('✅ OCH Users Summary')
    print('='*60)
    print(f'Created: {created_count} users')
    print(f'Updated: {updated_count} users')
    print(f'\nPassword for all users: {password}')
    print(f'\nLogin Credentials:')
    for user_data in och_users:
        print(f'  - {user_data["email"]} / {password}')
    print()
    print('✅ All OCH users ready!')
finally:
    # Reconnect signal
    post_save.connect(signals.auto_map_user_on_create, sender=User)

