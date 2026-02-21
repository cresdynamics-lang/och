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
            ('create_profiling', 'profiling', 'create', 'Create profiling data'),
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
            ('delete_invoice', 'invoice', 'delete', 'Delete invoices'),
            
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

            # Support / ticket permissions
            ('create_ticket', 'ticket', 'create', 'Create support tickets'),
            ('read_ticket', 'ticket', 'read', 'Read support ticket details'),
            ('update_ticket', 'ticket', 'update', 'Update support tickets'),
            ('list_tickets', 'ticket', 'list', 'List support tickets'),
            ('list_problem_codes', 'problem_code', 'list', 'List problem tracking codes'),
            ('manage_problem_codes', 'problem_code', 'manage', 'Create/update/delete problem codes'),
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
        # Permissions map to sidebars: see frontend utils/rbac.ts (DIRECTOR_NAV, ADMIN_NAV) and nav components
        roles_data = [
            {
                'name': 'admin',
                'display_name': 'Admin',
                'description': 'Full platform admin; manage roles/policies, tenants, secrets',
                # Admin sidebar: Overview, Users, Subscriptions, Recipes, Marketplace, Roles, Audit, Settings, API Keys
                'permissions': [p for p in created_permissions.keys()],  # All permissions
            },
            {
                'name': 'program_director',
                'display_name': 'Program Director',
                'description': 'Manage programs/cohorts/tracks; view analytics; assign mentors. Minimal (dashboard only): read_analytics',
                # Director sidebar permissions (see DirectorNavigation + rbac.ts DIRECTOR_NAV_PERMISSIONS):
                # Overview, Analytics -> read_analytics
                # Setup & Foundation (programs, tracks, missions, etc.) -> list_tracks
                # Cohort Mgmt (cohorts, applications, calendar) -> list_cohorts
                # Sponsors -> list_organizations | Students -> list_users
                # Enrollment, Seats, Overrides, Settings -> manage_cohorts
                # Mentors, Matching, Reviews, Cycles -> list_mentorship, create_mentorship, read_mentorship, update_mentorship
                'permissions': [
                    'read_analytics', 'list_analytics',  # Dashboard overview + Analytics & Reports
                    'list_tracks', 'read_track', 'create_track', 'update_track', 'manage_tracks',  # Setup & Foundation
                    'list_cohorts', 'read_cohort', 'create_cohort', 'update_cohort', 'manage_cohorts',  # Cohort Mgmt
                    'list_users', 'read_user',  # Students
                    'list_organizations', 'read_organization',  # Sponsors
                    'list_mentorship', 'read_mentorship', 'create_mentorship', 'update_mentorship',  # Mentorship
                    'read_portfolio', 'list_portfolios',  # Portfolio access for director view
                    'read_profiling', 'list_profiling',  # Profiling for director view
                    'list_tickets', 'read_ticket', 'create_ticket', 'update_ticket', 'list_problem_codes', 'manage_problem_codes',  # Support (add/manage support team, view tickets/codes)
                ],
            },
            {
                'name': 'mentor',
                'display_name': 'Mentor',
                'description': 'Access assigned mentees; create notes; review portfolios; limited analytics',
                # Mentor sidebar: Dashboard, Cohorts & Tracks, Sessions, Messages, Analytics, Profile, Missions, Reviews
                'permissions': [
                    'read_user', 'read_portfolio', 'update_portfolio',
                    'read_profiling', 'create_mentorship', 'read_mentorship', 'update_mentorship',
                    'read_analytics',
                ],
            },
            {
                'name': 'mentee',
                'display_name': 'Mentee',
                'description': 'Primary user role for mentees in the OCH ecosystem (Tier 0 and Tier 1)',
                # Mentee/Student dashboard: profile, portfolio, profiler, future-you, missions, community
                'permissions': [
                    'read_user', 'update_user', 'read_portfolio', 'create_portfolio', 'update_portfolio',
                    'read_profiling', 'create_profiling', 'update_profiling',
                    'read_mentorship', 'read_analytics',
                ],
            },
            {
                'name': 'student',
                'display_name': 'Student',
                'description': 'Access personal modules (profiling, learning, portfolio, mentorship)',
                # Student dashboard: profile, portfolio, profiler, missions, community
                'permissions': [
                    'read_user', 'update_user', 'read_portfolio', 'create_portfolio', 'update_portfolio',
                    'read_profiling', 'update_profiling', 'read_mentorship',
                ],
            },
            {
                'name': 'finance',
                'display_name': 'Finance',
                'description': 'Access billing/revenue, refunds, sponsorship wallets; no student PII beyond billing',
                # Finance dashboard: catalog, analytics, billing, sponsorship, rewards, security, profile
                'permissions': [
                    'read_billing', 'update_billing', 'manage_billing',
                    'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices',
                ],
            },
            {
                'name': 'finance_admin',
                'display_name': 'Finance Admin',
                'description': 'Full finance administration access; manage billing, invoices, refunds, and financial reports',
                # Finance Admin: full finance + limited user for billing
                'permissions': [
                    'read_billing', 'update_billing', 'manage_billing',
                    'create_invoice', 'read_invoice', 'update_invoice', 'list_invoices', 'delete_invoice',
                    'read_user',
                ],
            },
            {
                'name': 'sponsor_admin',
                'display_name': 'Sponsor/Employer Admin',
                'description': 'Manage sponsored users, view permitted profiles per consent',
                # Sponsor dashboard: users, org, portfolio, profiling (consent-scoped)
                'permissions': [
                    'read_user', 'list_users', 'read_organization', 'update_organization',
                    'read_portfolio', 'list_portfolios', 'read_profiling', 'list_profiling',
                ],
            },
            {
                'name': 'employer',
                'display_name': 'Employer',
                'description': 'Browse talent, filter by skill/readiness; contact Professional-tier mentees; post assignments',
                # Employer/Marketplace dashboard: talent, roles, orgs
                'permissions': [
                    'read_user', 'list_users', 'read_portfolio', 'list_portfolios',
                    'read_organization', 'list_organizations',
                ],
            },
            {
                'name': 'analyst',
                'display_name': 'Analyst',
                'description': 'Analytics read with RLS/CLS; no PII without scope',
                # Analyst dashboard: analytics views only
                'permissions': ['read_analytics', 'list_analytics'],
            },
            {
                'name': 'support',
                'display_name': 'Support',
                'description': 'Internal support role: handle tickets, problem tracking codes; added by director',
                # Support dashboard: tickets, problem codes, stats
                'permissions': [
                    'list_tickets', 'read_ticket', 'create_ticket', 'update_ticket',
                    'list_problem_codes',
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

