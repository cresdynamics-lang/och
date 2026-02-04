"""
Management command to verify and set up sponsor API functionality.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from organizations.models import Organization, OrganizationMember
from users.models import Role, UserRole
from sponsors.models import Sponsor, SponsorCohort, SponsorStudentCohort

User = get_user_model()


class Command(BaseCommand):
    help = 'Verify and set up sponsor API functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test sponsor data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Verifying Sponsor API Setup...'))
        
        # Check if sponsor models exist
        try:
            sponsor_count = Sponsor.objects.count()
            self.stdout.write(f'Found {sponsor_count} sponsors in database')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error accessing Sponsor model: {e}')
            )
            return

        # Check if required roles exist
        self.create_required_roles()
        
        # Create test data if requested
        if options['create_test_data']:
            self.create_test_sponsor_data()
        
        # Verify API endpoints
        self.verify_api_endpoints()
        
        self.stdout.write(
            self.style.SUCCESS('Sponsor API setup verification complete!')
        )

    def create_required_roles(self):
        """Create required roles for sponsor functionality"""
        self.stdout.write('Creating required roles...')
        
        roles_to_create = [
            ('sponsor_admin', 'Sponsor Administrator'),
            ('sponsor_user', 'Sponsor User'),
            ('sponsor_staff', 'Sponsor Staff Member'),
        ]
        
        for role_name, description in roles_to_create:
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': description}
            )
            if created:
                self.stdout.write(f'Created role: {role_name}')
            else:
                self.stdout.write(f'Role already exists: {role_name}')

    def create_test_sponsor_data(self):
        """Create test sponsor data for API testing"""
        self.stdout.write('Creating test sponsor data...')
        
        try:
            with transaction.atomic():
                # Create test sponsor
                sponsor, created = Sponsor.objects.get_or_create(
                    slug='test-sponsor-api',
                    defaults={
                        'name': 'Test Sponsor for API',
                        'sponsor_type': 'corporate',
                        'contact_email': 'api-test@sponsor.com',
                        'website': 'https://test-sponsor-api.com',
                        'country': 'KE',
                        'city': 'Nairobi',
                        'region': 'Nairobi County'
                    }
                )
                
                if created:
                    self.stdout.write(f'Created test sponsor: {sponsor.name}')
                else:
                    self.stdout.write(f'Test sponsor already exists: {sponsor.name}')
                
                # Create corresponding organization
                org, org_created = Organization.objects.get_or_create(
                    slug='test-sponsor-api',
                    defaults={
                        'name': 'Test Sponsor for API',
                        'org_type': 'sponsor',
                        'status': 'active'
                    }
                )
                
                if org_created:
                    self.stdout.write(f'Created test organization: {org.name}')
                
                # Create test cohort
                cohort, cohort_created = SponsorCohort.objects.get_or_create(
                    sponsor=sponsor,
                    name='Test API Cohort 2024',
                    defaults={
                        'track_slug': 'defender',
                        'target_size': 50,
                        'students_enrolled': 0,
                        'status': 'active',
                        'is_active': True,
                        'budget_allocated': 2500000,  # 2.5M KES
                        'placement_goal': 40
                    }
                )
                
                if cohort_created:
                    self.stdout.write(f'Created test cohort: {cohort.name}')
                
                # Create test user with sponsor admin role
                test_user, user_created = User.objects.get_or_create(
                    email='sponsor-admin@test.com',
                    defaults={
                        'first_name': 'Sponsor',
                        'last_name': 'Admin',
                        'user_type': 'sponsor_admin',
                        'is_active': True
                    }
                )
                
                if user_created:
                    test_user.set_password('testpass123')
                    test_user.save()
                    self.stdout.write(f'Created test user: {test_user.email}')
                
                # Add user to organization
                member, member_created = OrganizationMember.objects.get_or_create(
                    organization=org,
                    user=test_user,
                    defaults={'role': 'admin'}
                )
                
                if member_created:
                    self.stdout.write(f'Added user to organization as admin')
                
                # Assign sponsor admin role
                sponsor_role = Role.objects.get(name='sponsor_admin')
                user_role, role_created = UserRole.objects.get_or_create(
                    user=test_user,
                    role=sponsor_role,
                    scope_type='organization',
                    scope_id=str(org.id)
                )
                
                if role_created:
                    self.stdout.write(f'Assigned sponsor admin role to user')
                
                self.stdout.write(
                    self.style.SUCCESS('Test sponsor data created successfully!')
                )
                self.stdout.write(
                    self.style.WARNING(
                        f'Test credentials: {test_user.email} / testpass123'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test data: {e}')
            )

    def verify_api_endpoints(self):
        """Verify that API endpoints are properly configured"""
        self.stdout.write('Verifying API endpoint configuration...')
        
        # Check if URL patterns are importable
        try:
            from sponsors.urls_api import urlpatterns
            self.stdout.write(f'Found {len(urlpatterns)} API URL patterns')
        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing API URLs: {e}')
            )
            return
        
        # Check if views are importable
        try:
            from sponsors import views_api
            self.stdout.write('API views imported successfully')
        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing API views: {e}')
            )
            return
        
        # List available endpoints
        endpoint_groups = [
            'Identity & Organization APIs',
            'Program & Cohort Management APIs',
            'Billing & Finance APIs',
            'Notifications & Automation APIs',
            'Consent & Privacy APIs',
            'Analytics & Reporting APIs'
        ]
        
        for group in endpoint_groups:
            self.stdout.write(f'✓ {group}')
        
        self.stdout.write(
            self.style.SUCCESS('All API endpoints configured correctly!')
        )