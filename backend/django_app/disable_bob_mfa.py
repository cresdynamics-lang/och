#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User

user = User.objects.get(email='bob@student.com')
print(f'Before - MFA enabled: {user.mfa_enabled}')

user.mfa_enabled = False
user.mfa_method = None
user.save()

print(f'After - MFA enabled: {user.mfa_enabled}')
print('MFA disabled for bob@student.com')