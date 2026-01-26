#!/usr/bin/env python3
import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

def main():
    print("=== DJANGO LOGIN CREDENTIALS ===")
    print()

    # Check admin user
    print("ADMIN USER:")
    admin = User.objects.filter(email='admin@test.com').first()
    if admin:
        print("  Email: admin@test.com")
        print("  Password: testpass123")
        print("  Status: Active" if admin.is_active else "  Status: Inactive")
    else:
        print("  Not created")
    print()

    # Check the specific user we were working with
    print("STUDENT USER (from earlier context):")
    ongoza = User.objects.filter(email='ongoza@gmail.com').first()
    if ongoza:
        print("  Email: ongoza@gmail.com")
        print("  Password: Ongoza@#1")
        if ongoza.user_roles.exists():
            print(f"  Role: {ongoza.user_roles.first().role.name}")
        else:
            print("  Role: No role assigned")
        print("  Status: Active" if ongoza.is_active else "  Status: Inactive")
    else:
        print("  Not found")
    print()

    # Support roles
    print("SUPPORT ROLES:")
    support_users = [
        ('director@test.com', 'Program Director'),
        ('mentor@test.com', 'Mentor'),
        ('sponsor@test.com', 'Sponsor Admin'),
        ('analyst@test.com', 'Analyst'),
        ('finance@test.com', 'Finance')
    ]

    for email, role in support_users:
        user = User.objects.filter(email=email).first()
        if user:
            print(f"  {email} - {role}")
            print(f"    Password: testpass123")
            print(f"    Status: {'Active' if user.is_active else 'Inactive'}")
        else:
            print(f"  {email} - {role} (Not created)")
        print()

    # Student accounts
    print("STUDENT ACCOUNTS:")
    total_students = User.objects.filter(email__startswith='student', email__endswith='@test.com').count()
    print(f"  Total test students: {total_students}")

    if total_students > 0:
        students = User.objects.filter(email__startswith='student', email__endswith='@test.com')[:5]
        print("  Examples:")
        for student in students:
            print(f"    {student.email} - Password: testpass123")
    print()

    print("API ENDPOINTS:")
    print("  POST /api/v1/auth/login/ - Standard login")
    print("  POST /api/v1/auth/login/simple - Simple login")
    print()

    print("FRONTEND LOGIN URLS:")
    print("  http://localhost:3000/login/student")
    print("  http://localhost:3000/login/director")
    print("  http://localhost:3000/login/employer")

if __name__ == "__main__":
    main()

