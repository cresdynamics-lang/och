"""
Django management command to seed initial roles and permissions.
Usage: python manage.py seed_roles_permissions
"""
from django.core.management.base import BaseCommand
from users.models import Role, Permission


class Command(BaseCommand):
    help = 'Seed initial roles and permissions for the platform'

    def handle(self, *args, **options):
        self.stdout.write("Seeding roles and permissions...")
        
        # Define permissions
        permissions_data = [
            # User permissions
            ('create_user', 'user', 'create', 'Create users'),
            ('read_user', 'user', 'read', 'Read user profiles'),
            ('update_user', 'user', 'update', 'Update user profiles'),
            ('delete_user', 'user', 'delete', 'Delete users'),
            ('list_users', 'user', 'list', 'List users'),
            ('manage_users', 'user', 'manage', 'Manage all users'),
            
            # Organization permissions
            ('create_organization', 'organization', 'create', 'Create organizations'),
            ('read_organization', 'organization', 'read', 'Read organization details'),
            ('update_organization', 'organization', 'update', 'Update organizations'),
            ('delete_organization', 'organization', 'delete', 'Delete organizations'),
            ('list_organizations', 'organization', 'list', 'List organizations'),
            ('manage_organizations', 'organization', 'manage', 'Manage all organizations'),
            
            # Cohort permissions
            ('create_cohort', 'cohort', 'create', 'Create cohorts'),
            ('read_cohort', 'cohort', 'read', 'Read cohort details'),
            ('update_cohort', 'cohort', 'update', 'Update cohorts'),
            ('delete_cohort', 'cohort', 'delete', 'Delete cohorts'),
            ('list_cohorts', 'cohort', 'list', 'List cohorts'),
            ('manage_cohorts', 'cohort', 'manage', 'Manage all cohorts'),
            
            # Track permissions
            ('create_track', 'track', 'create', 'Create tracks'),
            ('read_track', 'track', 'read', 'Read track details'),
            ('update_track', 'track', 'update', 'Update tracks'),
            ('delete_track', 'track', 'delete', 'Delete tracks'),
            ('list_tracks', 'track', 'list', 'List tracks'),
            ('manage_tracks', 'track', 'manage', 'Manage all tracks'),
            
            # Portfolio permissions
            ('create_portfolio', 'portfolio', 'create', 'Create portfolios'),
            ('read_portfolio', 'portfolio', 'read', 'Read portfolio details'),
            ('update_portfolio', 'portfolio', 'update', 'Update portfolios'),
            ('delete_portfolio', 'portfolio', 'delete', 'Delete portfolios'),
            ('list_portfolios', 'portfolio', 'list', 'List portfolios'),
            ('manage_portfolios', 'portfolio', 'manage', 'Manage all portfolios'),
            
            # Profiling permissions
            ('read_profiling', 'profiling', 'read', 'Read profiling data'),
            ('update_profiling', 'profiling', 'update', 'Update profiling data'),
            ('list_profiling', 'profiling', 'list', 'List profiling data'),
            
            # Mentorship permissions
            ('create_mentorship', 'mentorship', 'create', 'Create mentorship relationships'),
            ('read_mentorship', 'mentorship', 'read', 'Read mentorship data'),
            ('update_mentorship', 'mentorship', 'update', 'Update mentorship data'),
            ('list_mentorship', 'mentorship', 'list', 'List mentorship relationships'),
            
            # Analytics permissions
            ('read_analytics', 'analytics', 'read', 'Read analytics data'),
            ('list_analytics', 'analytics', 'list', 'List analytics reports'),
            
            # Billing permissions
            ('read_billing', 'billing', 'read', 'Read billing information'),
            ('update_billing', 'billing', 'update', 'Update billing information'),
            ('manage_billing', 'billing', 'manage', 'Manage billing'),
            
            # Invoice permissions
            ('create_invoice', 'invoice', 'create', 'Create invoices'),
            ('read_invoice', 'invoice', 'read', 'Read invoice details'),
            ('update_invoice', 'invoice', 'update', 'Update invoices'),
            ('list_invoices', 'invoice', 'list', 'List invoices'),
            
            # API Key permissions
            ('create_api_key', 'api_key', 'create', 'Create API keys'),
            ('read_api_key', 'api_key', 'read', 'Read API key details'),
            ('revoke_api_key', 'api_key', 'delete', 'Revoke API keys'),
            ('list_api_keys', 'api_key', 'list', 'List API keys'),
            
            # Webhook permissions
            ('create_webhook', 'webhook', 'create', 'Create webhook endpoints'),
            ('read_webhook', 'webhook', 'read', 'Read webhook details'),
            ('update_webhook', 'webhook', 'update', 'Update webhooks'),
            ('delete_webhook', 'webhook', 'delete', 'Delete webhooks'),
            ('list_webhooks', 'webhook', 'list', 'List webhooks'),
        ]
        
        # Create permissions
        created_permissions = {}
        for name, resource_type, action, description in permissions_data:
            permission, created = Permission.objects.get_or_create(
                name=name,
                defaults={
                    'resource_type': resource_type,
                    'action': action,
                    'description': description,
                }
            )
            created_permissions[name] = permission
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created permission: {name}"))
        
        # Define roles with their permissions
        roles_data = [
            {
                'name': 'admin',
                'display_name': 'Admin',
                'description': 'Full platform admin; manage roles/policies, tenants, secrets',
                'permissions': [p for p in created_permissions.keys()],  # All permissions
            },
            {
                'name': 'program_director',
                'display_name': 'Program Director',
                'description': 'Manage programs/cohorts/tracks; view analytics; assign mentors',
                'permissions': [
                    'read_user', 'list_users',
                    'read_organization', 'list_organizations',
                    'create_cohort', 'read_cohort', 'update_cohort', 'list_cohorts', 'manage_cohorts',
                    'create_track', 'read_track', 'update_track', 'list_tracks', 'manage_tracks',
                    'read_portfolio', 'list_portfolios',
                    'read_profiling', 'list_profiling',
                    'create_mentorship', 'read_mentorship', 'update_mentorship', 'list_mentorship',
                    'read_analytics', 'list_analytics',
                ],
            },
            {
                'name': 'mentor',
                'display_name': 'Mentor',
                'description': 'Access assigned mentees; create notes; review portfolios; limited analytics',
                'permissions': [
                    'read_user',  # Only assigned mentees
                    'read_portfolio', 'update_portfolio',
                    'read_profiling',  # Only with consent
                    'create_mentorship', 'read_mentorship', 'update_mentorship',
                    'read_analytics',  # Limited analytics
                ],
            },
            {
                'name': 'mentee',
                'display_name': 'Mentee',
                'description': 'Primary user role for mentees in the OCH ecosystem (Tier 0 and Tier 1)',
                'permissions': [
                    'read_user',  # Own profile
                    'update_user',  # Own profile
                    'read_portfolio',  # Own portfolio
                    'create_portfolio', 'update_portfolio',
                    'read_profiling',  # Own profiling
                    'create_profiling', 'update_profiling',
                    'read_mentorship',  # Own mentorship
                    'read_analytics',  # Own analytics
                ],
            },
            {
                'name': 'student',
                'display_name': 'Student',
                'description': 'Access personal modules (profiling, learning, portfolio, mentorship)',
                'permissions': [
                    'read_user', 'update_user',  # Own profile
                    'read_portfolio', 'create_portfolio', 'update_portfolio',  # Own portfolio
                    'read_profiling', 'update_profiling',  # Own profiling
                    'read_mentorship',  # Own mentorship
                ],
            },
            {
                'name': 'finance',
                'display_name': 'Finance',
                'description': 'Access billing/revenue, refunds, sponsorship wallets; no student PII beyond billing',
                'permissions': [
                    'read_billing', 'update_billing', 'manage_billing',
                    'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices',
                ],
            },
            {
                'name': 'finance_admin',
                'display_name': 'Finance Admin',
                'description': 'Full finance administration access; manage billing, invoices, refunds, and financial reports',
                'permissions': [
                    'read_billing', 'update_billing', 'manage_billing',
                    'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices', 'delete_invoice',
                    'read_user',  # Limited access for billing purposes
                ],
            },
            {
                'name': 'sponsor_admin',
                'display_name': 'Sponsor/Employer Admin',
                'description': 'Manage sponsored users, view permitted profiles per consent',
                'permissions': [
                    'read_user', 'list_users',  # Only sponsored users
                    'read_organization', 'update_organization',  # Own organization
                    'read_portfolio', 'list_portfolios',  # With consent
                    'read_profiling', 'list_profiling',  # With consent
                ],
            },
            {
                'name': 'analyst',
                'display_name': 'Analyst',
                'description': 'Analytics read with RLS/CLS; no PII without scope',
                'permissions': [
                    'read_analytics', 'list_analytics',
                ],
            },
        ]
        
        # Create roles
        for role_data in roles_data:
            permissions_list = role_data.pop('permissions')
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            
            # Assign permissions
            role_permissions = [created_permissions[p] for p in permissions_list if p in created_permissions]
            role.permissions.set(role_permissions)
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {role.display_name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Role already exists: {role.display_name}"))
        
        self.stdout.write(self.style.SUCCESS("\nSuccessfully seeded roles and permissions!"))

