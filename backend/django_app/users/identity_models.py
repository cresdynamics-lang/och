"""
User identity models for SSO and external identity providers.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class UserIdentity(models.Model):
    """
    External identity provider links for SSO (OIDC/SAML).
    Maps external IdP user IDs to our User model.
    """
    PROVIDER_TYPES = [
        ('google', 'Google'),
        ('microsoft', 'Microsoft'),
        ('saml', 'SAML 2.0'),
        ('apple', 'Apple'),
        ('local', 'Local'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='identities'
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_TYPES)
    provider_sub = models.CharField(max_length=255, db_index=True)  # Subject ID from provider
    
    # Metadata from provider
    metadata = models.JSONField(default=dict, blank=True)  # Additional provider data
    
    # Link tracking
    linked_at = models.DateTimeField(auto_now_add=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_identities'
        unique_together = ['provider', 'provider_sub']
        indexes = [
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['provider', 'provider_sub']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.provider} ({self.provider_sub})"


