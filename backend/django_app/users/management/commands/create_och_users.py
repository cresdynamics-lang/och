"""
Django management command to create OCH users
Run: python manage.py create_och_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from django.db.models.signals import post_save
from community import signals

User = get_user_model()


class Command(BaseCommand):
    help = 'Create OCH users with @och.com emails and TestPass@123 password'

    def handle(self, *args, **options):
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

            self.stdout.write('='*60)
            self.stdout.write('Creating OCH Users')
            self.stdout.write('='*60)
            self.stdout.write('')

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
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Updated: {email} ({role_name})')
                    )
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
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {email} ({role_name})')
                    )
                
                # Assign role
                role, _ = Role.objects.get_or_create(name=role_name)
                UserRole.objects.get_or_create(
                    user=user,
                    role=role,
                    defaults={'scope': 'global', 'is_active': True}
                )

            self.stdout.write('')
            self.stdout.write('='*60)
            self.stdout.write(self.style.SUCCESS('✅ OCH Users Summary'))
            self.stdout.write('='*60)
            self.stdout.write(f'Created: {created_count} users')
            self.stdout.write(f'Updated: {updated_count} users')
            self.stdout.write(f'\nPassword for all users: {password}')
            self.stdout.write(f'\nLogin Credentials:')
            for user_data in och_users:
                self.stdout.write(f'  - {user_data["email"]} / {password}')
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('✅ All OCH users ready!'))
        finally:
            # Reconnect signal
            post_save.connect(signals.auto_map_user_on_create, sender=User)

