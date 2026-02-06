#!/usr/bin/env python
"""
Setup Google OAuth SSO Provider
Reads credentials from environment and creates/updates the SSOProvider in database
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.auth_models import SSOProvider

def setup_google_oauth():
    """Create or update Google OAuth provider with credentials from .env"""
    
    # Support both naming conventions
    client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID') or os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET') or os.getenv('GOOGLE_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("❌ Error: Google OAuth credentials must be set in .env")
        print("   Required: GOOGLE_OAUTH_CLIENT_ID (or GOOGLE_CLIENT_ID)")
        print("   Required: GOOGLE_OAUTH_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)")
        return False
    
    # Create or update Google SSO provider
    provider, created = SSOProvider.objects.update_or_create(
        name='google',
        defaults={
            'provider_type': 'oidc',
            'client_id': client_id,
            'client_secret': client_secret,
            'authorization_endpoint': 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_endpoint': 'https://oauth2.googleapis.com/token',
            'userinfo_endpoint': 'https://openidconnect.googleapis.com/v1/userinfo',
            'issuer': 'https://accounts.google.com',
            'scopes': ['openid', 'email', 'profile'],
            'is_active': True,
        }
    )
    
    if created:
        print(f"✅ Created Google OAuth provider")
    else:
        print(f"✅ Updated Google OAuth provider")
    
    print(f"   Client ID: {client_id}")
    print(f"   Active: {provider.is_active}")
    print(f"   Scopes: {', '.join(provider.scopes)}")
    
    return True

if __name__ == '__main__':
    success = setup_google_oauth()
    sys.exit(0 if success else 1)
