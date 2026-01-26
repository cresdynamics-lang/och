"""
API Key and Webhook models for service/partner integrations.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import secrets
import hashlib
import hmac
import uuid
from argon2 import PasswordHasher

User = get_user_model()
ph = PasswordHasher()


class APIKey(models.Model):
    """
    API Keys for service/partner integrations.
    Per specification: Service accounts (machine-to-machine) with scoped API keys.
    """
    OWNER_TYPES = [
        ('user', 'User'),
        ('org', 'Organization'),
        ('service', 'Service Account'),
    ]
    
    KEY_TYPES = [
        ('service', 'Service Key'),
        ('partner', 'Partner Key'),
        ('webhook', 'Webhook Key'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    key_type = models.CharField(max_length=20, choices=KEY_TYPES)
    
    # Key management (per spec: stored hashed with Argon2id)
    key_prefix = models.CharField(max_length=20, db_index=True)  # First 8 chars for identification
    key_hash = models.CharField(max_length=128, unique=True, db_index=True)  # Argon2id hash
    key_value = models.CharField(max_length=255, null=True, blank=True)  # Encrypted, only shown once
    
    # Ownership (per spec: owner_type enum)
    owner_type = models.CharField(max_length=20, choices=OWNER_TYPES, default='user')
    owner_id = models.UUIDField(null=True, blank=True, db_index=True)  # Generic owner ID
    
    # Legacy ownership fields (for backward compatibility)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='api_keys'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='api_keys'
    )
    
    # Permissions (per spec: scoped API keys with least privilege)
    scopes = models.JSONField(default=list, blank=True)  # List of permission scopes
    allowed_ips = models.JSONField(default=list, blank=True)  # IP whitelist
    rate_limit_per_min = models.IntegerField(default=60)  # Per spec: rate_limit_per_min INT
    
    # Lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'api_keys'
        indexes = [
            models.Index(fields=['key_prefix']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        owner = self.user.email if self.user else (self.organization.name if self.organization else 'System')
        return f"{self.name} ({owner})"
    
    @classmethod
    def generate_key(cls):
        """Generate a new API key (per spec: stored hashed with Argon2id)."""
        key_value = f"och_{secrets.token_urlsafe(32)}"
        key_prefix = key_value[:8]
        # Use Argon2id for hashing (per spec)
        key_hash = ph.hash(key_value)
        return key_value, key_prefix, key_hash
    
    def verify_key(self, provided_key):
        """Verify if provided key matches this API key (using Argon2id)."""
        if not self.is_active or self.revoked_at:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        try:
            ph.verify(self.key_hash, provided_key)
            return True
        except Exception:
            return False


class WebhookEndpoint(models.Model):
    """
    Webhook endpoints for external integrations.
    """
    name = models.CharField(max_length=100)
    url = models.URLField()
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='webhook_endpoints'
    )
    
    # Events to subscribe to
    events = models.JSONField(default=list, blank=True)  # List of event types
    
    # Security
    signing_secret = models.CharField(max_length=64, db_index=True)  # HMAC secret
    signing_secret_hash = models.CharField(max_length=64)  # SHA-256 hash
    
    # Configuration
    is_active = models.BooleanField(default=True)
    verify_ssl = models.BooleanField(default=True)
    timeout = models.IntegerField(default=30)  # seconds
    
    # Retry configuration
    max_retries = models.IntegerField(default=3)
    retry_backoff = models.FloatField(default=1.5)  # exponential backoff multiplier
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'webhook_endpoints'
        indexes = [
            models.Index(fields=['organization', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.url}"
    
    @classmethod
    def generate_secret(cls):
        """Generate a new webhook signing secret."""
        secret = secrets.token_urlsafe(32)
        secret_hash = hashlib.sha256(secret.encode()).hexdigest()
        return secret, secret_hash
    
    def verify_signature(self, payload, signature):
        """Verify webhook signature."""
        expected_signature = hmac.new(
            self.signing_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_signature)


class WebhookDelivery(models.Model):
    """
    Webhook delivery logs and retry management.
"""
    endpoint = models.ForeignKey(WebhookEndpoint, on_delete=models.CASCADE, related_name='deliveries')
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    
    # Delivery status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # HTTP response
    response_status = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(null=True, blank=True)
    response_headers = models.JSONField(default=dict, blank=True)
    
    # Retry tracking
    attempt_count = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'webhook_deliveries'
        indexes = [
            models.Index(fields=['endpoint', 'status']),
            models.Index(fields=['next_retry_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.endpoint.name} - {self.event_type} ({self.status})"


