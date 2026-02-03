#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User

# Get the user
user = User.objects.get(email='bob@student.com')
print(f'Before - User: {user.email}')

# Set the password correctly
password = 'Password123!'
user.set_password(password)
user.save()

print(f'Password set for {user.email}')
print(f'check_password result: {user.check_password(password)}')

# Test authentication
from django.contrib.auth import authenticate
auth_user = authenticate(username=user.email, password=password)
print(f'authenticate result: {auth_user}')
print('Password reset complete!')