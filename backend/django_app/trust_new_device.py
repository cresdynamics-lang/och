#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User
from users.utils.auth_utils import trust_device

user = User.objects.get(email='bob@student.com')

# Trust the new device fingerprint from frontend
device_fingerprint = "web-1770018870485"
device_name = "Web Browser"
ip_address = "127.0.0.1"
user_agent = "Mozilla/5.0"

trust_device(user, device_fingerprint, device_name, "web", ip_address, user_agent, expires_days=365)
print(f'Device {device_fingerprint} trusted for bob@student.com')