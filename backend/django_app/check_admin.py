#!/usr/bin/env python3
import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def main():
    print("=== DJANGO ADMIN ACCESS ===")
    print()

    # Check admin users
    admins = User.objects.filter(is_staff=True)
    superusers = User.objects.filter(is_superuser=True)

    print(f"Staff/Admin Users: {admins.count()}")
    print(f"Superusers: {superusers.count()}")
    print()

    for user in admins:
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Superuser: {'Yes' if user.is_superuser else 'No'}")
        print(f"Active: {'Yes' if user.is_active else 'No'}")
        print()

    print("=== DJANGO ADMIN URLS ===")
    print("Frontend Admin Panel: http://localhost:3000/admin")
    print("Django Admin Interface: http://localhost:8002/admin/")
    print()

    print("=== LOGIN CREDENTIALS ===")
    print("Use any of the admin users above with their credentials")
    print("Example:")
    print("  Email: admin@test.com")
    print("  Password: testpass123")
    print()

    print("=== WHAT YOU CAN DO IN DJANGO ADMIN ===")
    print("• Manage Users & Roles")
    print("• View/Edit User Profiles")
    print("• Manage Cohorts & Programs")
    print("• View System Logs")
    print("• Manage Database Records")
    print("• Configure System Settings")

if __name__ == "__main__":
    main()

