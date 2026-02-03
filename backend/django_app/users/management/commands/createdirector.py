from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import Role, UserRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a director user with activated account'

    def handle(self, *args, **options):
        # Disable MFA for admin user
        try:
            admin_user = User.objects.get(email='wilsonndambuki47@gmail.com')
            admin_user.mfa_enabled = False
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Disabled MFA for {admin_user.email}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('⚠️ Admin user not found'))

        # Create director user
        try:
            director_user = User.objects.create_user(
                email='director@example.com',
                password='director123',
                first_name='Director',
                last_name='User',
                username='director'
            )

            # Activate director account
            director_user.account_status = 'active'
            director_user.email_verified = True
            director_user.is_active = True
            director_user.mfa_enabled = False
            director_user.activated_at = timezone.now()
            director_user.email_verified_at = timezone.now()
            director_user.save()

            # Create or get program_director role
            director_role, created = Role.objects.get_or_create(
                name='program_director',
                defaults={
                    'display_name': 'Program Director',
                    'description': 'Program Director role',
                    'is_system_role': True
                }
            )

            # Assign director role
            UserRole.objects.get_or_create(
                user=director_user,
                role=director_role,
                scope='global',
                defaults={'is_active': True}
            )

            self.stdout.write(self.style.SUCCESS(f'✅ Created director: {director_user.email}'))
            self.stdout.write(self.style.SUCCESS('📧 Email: director@example.com'))
            self.stdout.write(self.style.SUCCESS('🔑 Password: director123'))

        except Exception as e:
            if 'already exists' in str(e):
                self.stdout.write(self.style.WARNING('⚠️ Director user already exists'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Error creating director: {e}'))