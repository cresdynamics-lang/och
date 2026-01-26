"""
Marketplace utility functions
"""

from .models import Employer


def get_employer_for_user(user):
    """
    Helper to get Employer instance for a user.
    Returns employer_profile if exists, or creates one if user has sponsor_admin role.
    """
    if hasattr(user, 'employer_profile'):
        return user.employer_profile
    
    # If user has sponsor_admin role but no employer_profile, auto-create one
    from users.models import UserRole
    if user.user_roles.filter(role__name='sponsor_admin', is_active=True).exists():
        # Auto-create employer profile for sponsor_admin users
        employer = Employer.objects.create(
            user=user,
            company_name=user.get_full_name() or user.email.split('@')[0] or 'Company',
            description='Auto-created employer profile for sponsor admin',
        )
        return employer
    
    return None

