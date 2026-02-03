from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a mentor user'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Mentor email')
        parser.add_argument('--password', default='mentor123', help='Mentor password')
        parser.add_argument('--first-name', default='Mentor', help='First name')
        parser.add_argument('--last-name', default='User', help='Last name')
        parser.add_argument('--expertise', help='Areas of expertise (comma-separated)')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        expertise = options.get('expertise', '')

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

        # Set mentor flag
        user.is_mentor = True
        if expertise:
            user.metadata = user.metadata or {}
            user.metadata['expertise'] = [e.strip() for e in expertise.split(',')]
        user.save()

        # Assign mentor role
        mentor_role, _ = Role.objects.get_or_create(
            name='mentor',
            defaults={'description': 'Mentor role'}
        )
        
        UserRole.objects.create(
            user=user,
            role=mentor_role,
            scope='global',
            is_active=True
        )

        self.stdout.write(
            self.style.SUCCESS(f'Mentor created: {email} (password: {password})')
        )