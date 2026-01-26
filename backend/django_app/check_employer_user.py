#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserRole, Role

User = get_user_model()

try:
    user = User.objects.get(email='ongozacyberhub@gmail.com')
    print(f'✅ User: {user.email}')
    print(f'✅ Account Status: {user.account_status}')
    print(f'✅ Email Verified: {user.email_verified}')

    # Get user roles
    user_roles = UserRole.objects.filter(user=user).select_related('role')
    role_names = [ur.role.name for ur in user_roles]
    print(f'✅ Roles: {role_names}')

    # Check organization
    if hasattr(user, 'org_id') and user.org_id:
        print(f'✅ Organization: {user.org_id.name} ({user.org_id.org_type})')
    else:
        print('❌ No organization linked')

    # Verify sponsor_admin role
    if 'sponsor_admin' in role_names:
        print('✅ User has sponsor_admin role - CAN access employer dashboard')
    else:
        print('❌ User does NOT have sponsor_admin role - CANNOT access employer dashboard')

except User.DoesNotExist:
    print('❌ User not found')
except Exception as e:
    print(f'❌ Error: {e}')
