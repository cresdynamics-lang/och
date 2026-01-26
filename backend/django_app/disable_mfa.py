#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    user = User.objects.get(email='employer@och.com')
    print(f'Found user: {user.email}')

    # Check and disable MFA
    if hasattr(user, 'mfa_enabled'):
        print(f'Current MFA status: {user.mfa_enabled}')
        user.mfa_enabled = False
        user.save()
        print('✅ Disabled MFA for user')
    else:
        print('MFA field not found on user model')

    # Remove MFA devices if they exist
    try:
        # Try different MFA device models
        if hasattr(user, 'totp_devices'):
            devices = user.totp_devices.all()
            count = devices.count()
            if count > 0:
                devices.delete()
                print(f'✅ Removed {count} TOTP devices')
            else:
                print('No TOTP devices found')

        # Try static token devices
        if hasattr(user, 'static_devices'):
            devices = user.static_devices.all()
            count = devices.count()
            if count > 0:
                devices.delete()
                print(f'✅ Removed {count} static token devices')

    except Exception as e:
        print(f'Could not remove MFA devices: {e}')

    print('🎯 MFA should now be disabled for this user')

except User.DoesNotExist:
    print('❌ User not found')
except Exception as e:
    print(f'❌ Error: {e}')

print("\n🔑 Test login again:")
print("Email: employer@och.com")
print("Password: Ongoza@#1")

