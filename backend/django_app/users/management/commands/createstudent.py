from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
from organizations.models import Organization

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a student user'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Student email')
        parser.add_argument('--password', default='student123', help='Student password')
        parser.add_argument('--first-name', default='Student', help='First name')
        parser.add_argument('--last-name', default='User', help='Last name')
        parser.add_argument('--org', help='Organization slug (optional)')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        org_slug = options.get('org')

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

        # Assign student role
        student_role, _ = Role.objects.get_or_create(
            name='student',
            defaults={'description': 'Student role'}
        )
        
        UserRole.objects.create(
            user=user,
            role=student_role,
            scope='global',
            is_active=True
        )

        # Add to organization if specified
        if org_slug:
            try:
                org = Organization.objects.get(slug=org_slug)
                org.members.add(user)
                self.stdout.write(f'Added to organization: {org.name}')
            except Organization.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Organization {org_slug} not found'))

        self.stdout.write(
            self.style.SUCCESS(f'Student created: {email} (password: {password})')
        )