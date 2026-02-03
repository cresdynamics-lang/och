from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from organizations.models import Organization

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a sponsor user'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Sponsor email')
        parser.add_argument('--password', default='sponsor123', help='Sponsor password')
        parser.add_argument('--first-name', default='Sponsor', help='First name')
        parser.add_argument('--last-name', default='User', help='Last name')
        parser.add_argument('--org-name', help='Organization name to create/join')
        parser.add_argument('--org-slug', help='Organization slug')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        org_name = options.get('org_name')
        org_slug = options.get('org_slug')

        # Check if user exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists'))
            return

        # Create user
        user = User.objects.create_user(
            username=email,  # Use email as username
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            email_verified=True
        )

        # Assign sponsor role
        sponsor_role, _ = Role.objects.get_or_create(
            name='sponsor',
            defaults={'description': 'Sponsor role'}
        )
        
        UserRole.objects.create(
            user=user,
            role=sponsor_role,
            scope='global',
            is_active=True
        )

        # Create or join organization
        if org_name and org_slug:
            try:
                from organizations.models import Organization
                org, created = Organization.objects.get_or_create(
                    slug=org_slug,
                    defaults={
                        'name': org_name,
                        'type': 'sponsor',
                        'is_active': True
                    }
                )
                org.members.add(user)
                
                if created:
                    self.stdout.write(f'Created organization: {org_name}')
                else:
                    self.stdout.write(f'Added to existing organization: {org_name}')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not create organization: {e}'))

        self.stdout.write(
            self.style.SUCCESS(f'Sponsor created: {email} (password: {password})')
        )