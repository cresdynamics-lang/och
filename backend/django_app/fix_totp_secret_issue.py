#!/usr/bin/env python
"""
Fix TOTP secret issue - handle invalid base32 characters gracefully
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.auth_models import MFAMethod
from users.utils.auth_utils import decrypt_totp_secret
import pyotp
import base64
import binascii

def fix_totp_secrets():
    """Fix TOTP secrets that contain invalid base32 characters"""
    
    # Get all TOTP methods
    totp_methods = MFAMethod.objects.filter(method_type='totp')
    
    print(f"Found {totp_methods.count()} TOTP methods to check")
    
    fixed_count = 0
    disabled_count = 0
    
    for method in totp_methods:
        try:
            # Try to decrypt the secret
            secret = decrypt_totp_secret(method.secret_encrypted)
            
            # Try to create TOTP object to validate the secret
            totp = pyotp.TOTP(secret)
            
            # Try to generate a code to fully validate
            test_code = totp.now()
            print(f"✓ User {method.user.email}: TOTP secret is valid")
            
        except (binascii.Error, ValueError, Exception) as e:
            print(f"✗ User {method.user.email}: Invalid TOTP secret - {str(e)}")
            
            # Option 1: Disable the MFA method
            method.enabled = False
            method.save()
            
            # Also disable MFA for the user if this was their only method
            user = method.user
            if not MFAMethod.objects.filter(user=user, enabled=True).exists():
                user.mfa_enabled = False
                user.mfa_method = None
                user.save()
                print(f"  → Disabled MFA for user {user.email}")
            
            disabled_count += 1
            
            # Option 2: Generate a new secret (uncomment if you want to regenerate)
            # new_secret = pyotp.random_base32()
            # from users.utils.auth_utils import encrypt_totp_secret
            # method.secret_encrypted = encrypt_totp_secret(new_secret)
            # method.enabled = False  # User will need to re-enroll
            # method.save()
            # print(f"  → Generated new secret for user {user.email} (requires re-enrollment)")
            # fixed_count += 1
    
    print(f"\nSummary:")
    print(f"- Disabled methods: {disabled_count}")
    print(f"- Fixed methods: {fixed_count}")
    print(f"- Total processed: {totp_methods.count()}")

if __name__ == "__main__":
    fix_totp_secrets()