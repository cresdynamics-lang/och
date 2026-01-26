"""
Create sponsor user and organization for testing.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization, OrganizationMember
from users.models import Role, UserRole

User = get_user_model()

def main():
    print("=" * 60)
    print("Creating Sponsor User and Organization")
    print("=" * 60)
    
    # Get or create sponsor user
    sponsor_user, user_created = User.objects.get_or_create(
        email='sponsor@test.com',
        defaults={
            'username': 'sponsor',
            'first_name': 'Sponsor',
            'last_name': 'User',
            'account_status': 'active',
            'email_verified': True,
        }
    )
    
    # Set password
    sponsor_user.set_password('testpass123')
    sponsor_user.save()
    
    if user_created:
        print(f"✅ Created sponsor user: sponsor@test.com")
    else:
        print(f"✅ Sponsor user already exists: sponsor@test.com")
        # Ensure account is active
        sponsor_user.account_status = 'active'
        sponsor_user.email_verified = True
        sponsor_user.save()
        print(f"✅ Updated sponsor user to active status")
    
    # Get or create sponsor role
    sponsor_role, role_created = Role.objects.get_or_create(name='sponsor_admin')
    if role_created:
        print(f"✅ Created sponsor_admin role")
    
    # Assign role to user
    user_role, role_assigned = UserRole.objects.get_or_create(
        user=sponsor_user,
        role=sponsor_role,
        defaults={'scope': 'global', 'is_active': True}
    )
    if role_assigned:
        print(f"✅ Assigned sponsor_admin role to user")
    
    # Create or get sponsor organization
    org, org_created = Organization.objects.get_or_create(
        slug='sponsor-test-org',
        defaults={
            'name': "Sponsor Test Organization",
            'org_type': 'sponsor',
            'status': 'active',
            'owner': sponsor_user,
        }
    )
    
    if org_created:
        print(f"✅ Created sponsor organization: {org.name}")
    else:
        print(f"✅ Sponsor organization already exists: {org.name}")
    
    # Add user to organization as admin
    member, member_created = OrganizationMember.objects.get_or_create(
        organization=org,
        user=sponsor_user,
        defaults={'role': 'admin'}
    )
    
    if member_created:
        print(f"✅ Added user to organization as admin")
    
    # Set user's org_id
    sponsor_user.org_id = org
    sponsor_user.save()
    
    print(f"✅ Set user's org_id to organization")
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print(f"\nLogin credentials:")
    print(f"  Email: sponsor@test.com")
    print(f"  Password: testpass123")
    print(f"\nOrganization: {org.name}")
    print(f"  Slug: {org.slug}")
    print(f"  Type: {org.org_type}")

if __name__ == '__main__':
    main()
