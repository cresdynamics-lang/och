#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, UserRole
from users.utils.risk_utils import requires_mfa

user = User.objects.get(email='bob@student.com')
print(f'User: {user.email}')
print(f'MFA enabled: {user.mfa_enabled}')

# Check user roles
user_roles = UserRole.objects.filter(user=user, is_active=True)
user_role_names = [ur.role.name for ur in user_roles]
primary_role = user_role_names[0] if user_role_names else None

print(f'User roles: {user_role_names}')
print(f'Primary role: {primary_role}')

# Check MFA requirement
risk_score = 0.1  # Low risk
mfa_required = requires_mfa(risk_score, primary_role)
print(f'MFA required by policy: {mfa_required}')

# Trust the device
from users.utils.auth_utils import trust_device
device_fingerprint = "web-1770014642954"
device_name = "Web Browser"
ip_address = "127.0.0.1"
user_agent = "curl/8.13.0"

trust_device(user, device_fingerprint, device_name, "web", ip_address, user_agent, expires_days=365)
print('Device trusted for 365 days')