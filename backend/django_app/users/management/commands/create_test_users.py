"""
Django management command to create test users for development.
Usage: python manage.py create_test_users
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users with different roles for development'

    def handle(self, *args, **options):
        # Default password for all test users
        default_password = 'testpass123'

        # Create or get roles
        roles = {}
        role_names = ['admin', 'program_director', 'mentor', 'student', 'finance', 'sponsor_admin', 'analyst']
        
        for role_name in role_names:
            role, created = Role.objects.get_or_create(name=role_name)
            roles[role_name] = role
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created role: {role_name}'))

        # Test users to create
        test_users = [
            {
                'email': 'admin@test.com',
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'student@test.com',
                'username': 'student',
                'first_name': 'Student',
                'last_name': 'User',
                'role': 'student',
            },
            {
                'email': 'mentor@test.com',
                'username': 'mentor',
                'first_name': 'Mentor',
                'last_name': 'User',
                'role': 'mentor',
            },
            {
                'email': 'director@test.com',
                'username': 'director',
                'first_name': 'Director',
                'last_name': 'User',
                'role': 'program_director',
            },
            {
                'email': 'sponsor@test.com',
                'username': 'sponsor',
                'first_name': 'Sponsor',
                'last_name': 'User',
                'role': 'sponsor_admin',
            },
            {
                'email': 'analyst@test.com',
                'username': 'analyst',
                'first_name': 'Analyst',
                'last_name': 'User',
                'role': 'analyst',
            },
            {
                'email': 'finance@test.com',
                'username': 'finance',
                'first_name': 'Finance',
                'last_name': 'User',
                'role': 'finance',
                'mfa_enabled': True,  # Finance requires MFA
            },
        ]

        created_count = 0
        updated_count = 0

        for user_data in test_users:
            role_name = user_data.pop('role')
            email = user_data['email']
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    **user_data,
                    'account_status': 'active',
                    'email_verified': True,
                }
            )

            if not created:
                # Update existing user
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.account_status = 'active'
                user.email_verified = True
                user.save()
                updated_count += 1
            else:
                created_count += 1

            # Set password
            user.set_password(default_password)
            user.save()

            # Assign role
            role = roles[role_name]
            user_role, role_created = UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'scope': 'global'}
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created user: {email} ({role_name})'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'↻ Updated user: {email} ({role_name})'
                    )
                )

        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('Test Users Summary'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Created: {created_count} users')
        self.stdout.write(f'Updated: {updated_count} users')
        self.stdout.write(f'\nDefault password for all users: {default_password}')
        self.stdout.write(self.style.SUCCESS('\nTest users ready for development!'))

