import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, Role, UserRole

# Create roles first
roles_to_create = [
    {'name': 'admin', 'display_name': 'Admin', 'description': 'System administrator'},
    {'name': 'mentor', 'display_name': 'Mentor', 'description': 'Mentor role'},
    {'name': 'student', 'display_name': 'Student', 'description': 'Student role'},
]

for role_data in roles_to_create:
    Role.objects.get_or_create(
        name=role_data['name'],
        defaults={
            'display_name': role_data['display_name'],
            'description': role_data['description'],
            'is_system_role': True
        }
    )

print('[OK] Roles created/verified')

# Create superuser
try:
    admin, created = User.objects.get_or_create(
        email='admin@ongozacyberhub.com',
        defaults={
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
            'email_verified': True,
            'account_status': 'active'
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print('[OK] Superuser created: ' + admin.email)
    else:
        print('[OK] Superuser already exists: ' + admin.email)
except Exception as e:
    print('[ERROR] Admin creation error: ' + str(e))

# Create mentor user
try:
    mentor, created = User.objects.get_or_create(
        email='mentor@ongozacyberhub.com',
        defaults={
            'username': 'mentor',
            'first_name': 'John',
            'last_name': 'Mentor',
            'is_active': True,
            'email_verified': True,
            'account_status': 'active'
        }
    )
    if created:
        mentor.set_password('mentor123')
        mentor.save()

        # Assign mentor role
        mentor_role = Role.objects.get(name='mentor')
        UserRole.objects.get_or_create(
            user=mentor,
            role=mentor_role,
            defaults={'scope': 'global', 'is_active': True}
        )
        print('[OK] Mentor user created: ' + mentor.email)
    else:
        print('[OK] Mentor user already exists: ' + mentor.email)
except Exception as e:
    print('[ERROR] Mentor creation error: ' + str(e))

# Create student user
try:
    student, created = User.objects.get_or_create(
        email='student@ongozacyberhub.com',
        defaults={
            'username': 'student',
            'first_name': 'Jane',
            'last_name': 'Student',
            'is_active': True,
            'email_verified': True,
            'account_status': 'active'
        }
    )
    if created:
        student.set_password('student123')
        student.save()

        # Assign student role
        student_role = Role.objects.get(name='student')
        UserRole.objects.get_or_create(
            user=student,
            role=student_role,
            defaults={'scope': 'global', 'is_active': True}
        )
        print('[OK] Student user created: ' + student.email)
    else:
        print('[OK] Student user already exists: ' + student.email)
except Exception as e:
    print('[ERROR] Student creation error: ' + str(e))

print('\n=== Login Credentials ===')
print('Admin: admin@ongozacyberhub.com / admin123')
print('Mentor: mentor@ongozacyberhub.com / mentor123')
print('Student: student@ongozacyberhub.com / student123')
print('\nDjango Admin: http://localhost:8000/admin')
print('API Docs: http://localhost:8001/docs')
