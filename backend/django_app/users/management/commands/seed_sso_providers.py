"""
Management command to seed SSO providers (Google, Microsoft, Apple, Okta).
Uses environment variables for credentials when available.
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from users.auth_models import SSOProvider


class Command(BaseCommand):
    help = 'Seed SSO providers (Google, Microsoft, Apple, Okta)'

    def handle(self, *args, **options):
        providers = [
            {
                'name': 'google',
                'provider_type': 'oidc',
                'is_active': True,
                'client_id': os.environ.get('GOOGLE_OAUTH_CLIENT_ID', 'PLACEHOLDER_GOOGLE_CLIENT_ID'),
                'client_secret': os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', 'PLACEHOLDER_GOOGLE_CLIENT_SECRET'),
                'authorization_endpoint': 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_endpoint': 'https://oauth2.googleapis.com/token',
                'userinfo_endpoint': 'https://openidconnect.googleapis.com/v1/userinfo',
                'issuer': 'https://accounts.google.com',
                'scopes': ['openid', 'email', 'profile'],
                'attribute_mapping': {
                    'email': 'email',
                    'first_name': 'given_name',
                    'last_name': 'family_name',
                    'external_id': 'sub',
                },
            },
            {
                'name': 'microsoft',
                'provider_type': 'oidc',
                'is_active': True,
                'client_id': 'PLACEHOLDER_MICROSOFT_CLIENT_ID',
                'client_secret': 'PLACEHOLDER_MICROSOFT_CLIENT_SECRET',
                'authorization_endpoint': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                'token_endpoint': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                'userinfo_endpoint': 'https://graph.microsoft.com/oidc/userinfo',
                'issuer': 'https://login.microsoftonline.com/common/v2.0',
                'scopes': ['openid', 'email', 'profile'],
                'attribute_mapping': {
                    'email': 'email',
                    'first_name': 'given_name',
                    'last_name': 'family_name',
                    'external_id': 'sub',
                },
            },
            {
                'name': 'apple',
                'provider_type': 'oidc',
                'is_active': True,
                'client_id': 'PLACEHOLDER_APPLE_CLIENT_ID',
                'client_secret': 'PLACEHOLDER_APPLE_CLIENT_SECRET',
                'authorization_endpoint': 'https://appleid.apple.com/auth/authorize',
                'token_endpoint': 'https://appleid.apple.com/auth/token',
                'userinfo_endpoint': 'https://appleid.apple.com/auth/userinfo',
                'issuer': 'https://appleid.apple.com',
                'scopes': ['openid', 'email', 'name'],
                'attribute_mapping': {
                    'email': 'email',
                    'first_name': 'name.givenName',
                    'last_name': 'name.familyName',
                    'external_id': 'sub',
                },
            },
            {
                'name': 'okta',
                'provider_type': 'oidc',
                'is_active': True,
                'client_id': 'PLACEHOLDER_OKTA_CLIENT_ID',
                'client_secret': 'PLACEHOLDER_OKTA_CLIENT_SECRET',
                'authorization_endpoint': 'https://PLACEHOLDER_OKTA_DOMAIN.okta.com/oauth2/v1/authorize',
                'token_endpoint': 'https://PLACEHOLDER_OKTA_DOMAIN.okta.com/oauth2/v1/token',
                'userinfo_endpoint': 'https://PLACEHOLDER_OKTA_DOMAIN.okta.com/oauth2/v1/userinfo',
                'issuer': 'https://PLACEHOLDER_OKTA_DOMAIN.okta.com/oauth2/default',
                'scopes': ['openid', 'email', 'profile'],
                'attribute_mapping': {
                    'email': 'email',
                    'first_name': 'given_name',
                    'last_name': 'family_name',
                    'external_id': 'sub',
                },
            },
        ]

        created_count = 0
        updated_count = 0

        for provider_data in providers:
            provider, created = SSOProvider.objects.update_or_create(
                name=provider_data['name'],
                defaults={
                    'provider_type': provider_data['provider_type'],
                    'is_active': provider_data['is_active'],
                    'client_id': provider_data['client_id'],
                    'client_secret': provider_data['client_secret'],
                    'authorization_endpoint': provider_data['authorization_endpoint'],
                    'token_endpoint': provider_data['token_endpoint'],
                    'userinfo_endpoint': provider_data['userinfo_endpoint'],
                    'issuer': provider_data['issuer'],
                    'scopes': provider_data['scopes'],
                    'attribute_mapping': provider_data['attribute_mapping'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created SSO provider: {provider.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated SSO provider: {provider.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSSO Providers Summary:\n'
                f'Created: {created_count} providers\n'
                f'Updated: {updated_count} providers\n'
                f'Total: {SSOProvider.objects.count()} providers'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                '\n⚠️  Note: All SSO providers use placeholder credentials.\n'
                'Update client_id and client_secret in the database or via environment variables.'
            )
        )






