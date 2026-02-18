"""
Script to set up Google SSO provider in the database.
Run with: python manage.py shell < setup_google_sso.py
"""
import os
from users.auth_models import SSOProvider

# Get credentials from environment
client_id = os.getenv('GOOGLE_CLIENT_ID')
client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

if not client_id or not client_secret:
    print("ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env")
    exit(1)

# Create or update Google SSO provider
provider, created = SSOProvider.objects.update_or_create(
    name='google',
    defaults={
        'display_name': 'Google',
        'provider_type': 'oidc',
        'client_id': client_id,
        'client_secret': client_secret,
        'authorization_endpoint': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_endpoint': 'https://oauth2.googleapis.com/token',
        'userinfo_endpoint': 'https://openidconnect.googleapis.com/v1/userinfo',
        'scopes': ['openid', 'email', 'profile'],
        'is_active': True,
    }
)

if created:
    print(f"✅ Created Google SSO provider")
else:
    print(f"✅ Updated Google SSO provider")

print(f"   Client ID: {client_id}")
print(f"   Status: Active")
