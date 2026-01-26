#!/usr/bin/env python
"""
Create employer user with specified email and password.
Creates:
  - Employer user with sponsor_admin role
  - Proper role assignment and permissions

Run: python create_employer_user.py
"""
import os
import sys
import django
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import Role, UserRole
from organizations.models import Organization

User = get_user_model()

def create_employer_user():
    """Create employer user with sponsor_admin role."""

    # User details
    email = 'employer@och.com'
    password = 'Ongoza@#1'
    first_name = 'Ongoza'
    last_name = 'CyberHub'
    username = 'ongozacyberhub_employer'

    print(f"Creating employer user: {email}")

    with transaction.atomic():
        # Check if user already exists with new email
        if User.objects.filter(email=email).exists():
            print(f"User {email} already exists. Updating password and role...")
            user = User.objects.get(email=email)
            user.set_password(password)
            user.first_name = first_name
            user.last_name = last_name
            user.account_status = 'active'
            user.email_verified = True
            user.save()
        # Also check if old email exists and update it
        elif User.objects.filter(email='ongozacyberhub@gmail.com').exists():
            print(f"Updating existing user from old email to new email...")
            user = User.objects.get(email='ongozacyberhub@gmail.com')
            user.email = email
            user.set_password(password)
            user.first_name = first_name
            user.last_name = last_name
            user.account_status = 'active'
            user.email_verified = True
            user.save()
        else:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                account_status='active',
                email_verified=True
            )
            print(f"Created new user: {user.email}")

        # Get or create sponsor_admin role
        role, created = Role.objects.get_or_create(
            name='sponsor_admin',
            defaults={
                'display_name': 'Sponsor/Employer Admin',
                'description': 'Employer/Sponsor administrative access',
                'is_system_role': True
            }
        )
        if created:
            print("Created sponsor_admin role")

        # Assign role to user
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={
                'assigned_by': user,  # Self-assigned for now
                'scope': 'global'
            }
        )
        if created:
            print(f"Assigned sponsor_admin role to {user.email}")
        else:
            print(f"User {user.email} already has sponsor_admin role")

        # Create or get organization for the employer
        try:
            org = Organization.objects.get(name='OCH Employer Portal')
            created = False
            print(f"Found existing organization: {org.name}")
        except Organization.DoesNotExist:
            # Try to create with a proper slug
            from django.utils.text import slugify
            org = Organization.objects.create(
                name='OCH Employer Portal',
                slug=slugify('OCH Employer Portal'),
                description='Employer access to OCH cybersecurity talent platform',
                org_type='employer',
                owner=user,
                status='active'
            )
            created = True
            print(f"Created organization: {org.name}")
        if created:
            print(f"Created organization: {org.name}")

        # Link user to organization
        user.org_id = org
        user.save()
        print(f"Linked {user.email} to organization {org.name}")

        print("\n✅ Employer user creation completed!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("Role: sponsor_admin (Employer/Sponsor Admin)")
        print(f"Organization: {org.name}")
        print("\nYou can now login at: http://localhost:3000/login/sponsor")
if __name__ == '__main__':
    create_employer_user()
