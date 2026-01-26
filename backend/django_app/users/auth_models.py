"""
Authentication models: MFA, SSO, Sessions, Device Trust.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import secrets
import uuid

User = get_user_model()


class MFAMethod(models.Model):
    """
    Multi-Factor Authentication methods for users.
    RFC 6238 TOTP support, SMS, and backup codes.
    """
    METHOD_TYPES = [
        ('totp', 'TOTP (Time-based One-Time Password)'),
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('backup_codes', 'Backup Codes'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mfa_methods')
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    
    # TOTP specific (RFC 6238)
    secret_encrypted = models.TextField(null=True, blank=True)  # Encrypted TOTP secret
    totp_backup_codes = models.JSONField(default=list, blank=True)  # Hashed backup codes
    
    # SMS specific
    phone_e164 = models.CharField(max_length=20, null=True, blank=True)  # E.164 format
    
    # Status
    enabled = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'mfa_methods'
        unique_together = [['user', 'method_type']]  # One method type per user
        indexes = [
            models.Index(fields=['user', 'is_primary']),
            models.Index(fields=['user', 'method_type']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.method_type}"


class MFACode(models.Model):
    """
    Temporary MFA codes (OTP, magic links).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mfa_codes')
    code = models.CharField(max_length=10, db_index=True)
    method = models.CharField(max_length=20)  # totp, sms, email
    expires_at = models.DateTimeField(db_index=True)
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'mfa_codes'
        indexes = [
            models.Index(fields=['user', 'code', 'used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.code[:3]}***"


class SSOProvider(models.Model):
    """
    SSO Provider configuration (OIDC/SAML).
    """
    PROVIDER_TYPES = [
        ('oidc', 'OpenID Connect'),
        ('saml', 'SAML 2.0'),
        ('oauth2', 'OAuth 2.0'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    provider_type = models.CharField(max_length=20, choices=PROVIDER_TYPES)
    is_active = models.BooleanField(default=True)
    
    # OIDC/OAuth2
    client_id = models.CharField(max_length=255, null=True, blank=True)
    client_secret = models.CharField(max_length=255, null=True, blank=True)
    authorization_endpoint = models.URLField(null=True, blank=True)
    token_endpoint = models.URLField(null=True, blank=True)
    userinfo_endpoint = models.URLField(null=True, blank=True)
    issuer = models.CharField(max_length=255, null=True, blank=True)
    
    # SAML
    entity_id = models.CharField(max_length=255, null=True, blank=True)
    sso_url = models.URLField(null=True, blank=True)
    x509_cert = models.TextField(null=True, blank=True)
    
    # Configuration
    scopes = models.JSONField(default=list, blank=True)
    attribute_mapping = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sso_providers'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.provider_type})"


class SSOConnection(models.Model):
    """
    User's SSO connection/linking.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sso_connections')
    provider = models.ForeignKey(SSOProvider, on_delete=models.CASCADE, related_name='connections')
    external_id = models.CharField(max_length=255, db_index=True)  # User ID from provider
    external_email = models.EmailField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)  # Encrypted
    refresh_token = models.TextField(null=True, blank=True)  # Encrypted
    token_expires_at = models.DateTimeField(null=True, blank=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'sso_connections'
        unique_together = ['provider', 'external_id']
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.provider.name}"


class UserSession(models.Model):
    """
    User session management with device tracking and refresh token binding.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    
    # Device tracking
    device_fingerprint = models.CharField(max_length=255, db_index=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)  # mobile, desktop, tablet
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    ua = models.TextField(null=True, blank=True)  # User agent
    
    # Refresh token (opaque, hashed)
    refresh_token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    
    # Trust and security
    is_trusted = models.BooleanField(default=False)
    trusted_at = models.DateTimeField(null=True, blank=True)
    mfa_verified = models.BooleanField(default=False)
    risk_score = models.FloatField(default=0.0)
    
    # Lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(db_index=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_sessions'
        indexes = [
            models.Index(fields=['user', 'is_trusted']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['device_fingerprint']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {str(self.id)[:8]}..."


class DeviceTrust(models.Model):
    """
    Trusted devices for users (skip MFA on trusted devices).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trusted_devices')
    device_id = models.UUIDField(unique=True, db_index=True, default=uuid.uuid4)
    device_name = models.CharField(max_length=255)
    device_type = models.CharField(max_length=50)
    device_fingerprint = models.CharField(max_length=255, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Trust metadata
    trusted_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'device_trust'
        unique_together = ['user', 'device_fingerprint']
        indexes = [
            models.Index(fields=['user', 'trusted_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.device_name}"

