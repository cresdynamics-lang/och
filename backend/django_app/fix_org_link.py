#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization

User = get_user_model()

try:
    user = User.objects.get(email='ongozacyberhub@gmail.com')
    org = Organization.objects.get(name='Ongoza CyberHub')

    # Link the user to the organization
    user.org_id = org
    user.save()

    print('✅ Successfully linked user to organization')
    print(f'User: {user.email}')
    print(f'Organization: {org.name} ({org.org_type})')
    print(f'Owner: {org.owner.email}')

except Exception as e:
    print(f'❌ Error: {e}')
