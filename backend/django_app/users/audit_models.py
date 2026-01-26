"""
Audit trail and logging models for compliance and security.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
import json

User = get_user_model()


class AuditLog(models.Model):
    """
    Comprehensive audit log for all system events.
    """
    ACTION_TYPES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('mfa_challenge', 'MFA Challenge'),
        ('mfa_success', 'MFA Success'),
        ('mfa_failure', 'MFA Failure'),
        ('password_change', 'Password Change'),
        ('role_assigned', 'Role Assigned'),
        ('role_revoked', 'Role Revoked'),
        ('permission_granted', 'Permission Granted'),
        ('permission_revoked', 'Permission Revoked'),
        ('consent_granted', 'Consent Granted'),
        ('consent_revoked', 'Consent Revoked'),
        ('api_key_created', 'API Key Created'),
        ('api_key_revoked', 'API Key Revoked'),
        ('data_exported', 'Data Exported'),
        ('data_erased', 'Data Erased'),
        ('sso_login', 'SSO Login'),
        ('session_created', 'Session Created'),
        ('session_revoked', 'Session Revoked'),
        ('device_trusted', 'Device Trusted'),
        ('device_revoked', 'Device Revoked'),
    ]
    
    # Actor (who performed the action)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    api_key = models.ForeignKey(
        'APIKey',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    actor_type = models.CharField(max_length=20)  # 'user', 'api_key', 'system'
    actor_identifier = models.CharField(max_length=255)  # email, key prefix, etc.
    
    # Action details
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=100)  # 'user', 'organization', etc.
    resource_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Generic foreign key for flexible resource linking
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    request_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    # Changes (for update actions)
    changes = models.JSONField(default=dict, blank=True)  # {'field': {'old': ..., 'new': ...}}
    metadata = models.JSONField(default=dict, blank=True)
    
    # Result
    SUCCESS_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
        ('partial', 'Partial'),
    ]
    result = models.CharField(max_length=20, choices=SUCCESS_CHOICES, default='success')
    error_message = models.TextField(null=True, blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['request_id']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.actor_identifier} - {self.action} - {self.resource_type} ({self.timestamp})"


class DataExport(models.Model):
    """
    Data export logs for GDPR/DPA compliance.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_exports')
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='exports_requested'
    )
    
    # Export details
    export_type = models.CharField(max_length=50)  # 'full', 'partial', 'specific'
    data_categories = models.JSONField(default=list, blank=True)  # ['profile', 'progress', 'consents']
    format = models.CharField(max_length=20, default='json')  # 'json', 'csv', 'xml'
    
    # File storage
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    file_hash = models.CharField(max_length=64, null=True, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    download_count = models.IntegerField(default=0)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'data_exports'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.export_type} ({self.status})"


class DataErasure(models.Model):
    """
    Data erasure logs for GDPR/DPA compliance.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_erasures')
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='erasures_requested'
    )
    
    # Erasure details
    erasure_type = models.CharField(max_length=50)  # 'full', 'partial', 'specific'
    data_categories = models.JSONField(default=list, blank=True)
    reason = models.TextField(blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Lifecycle
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results
    records_erased = models.IntegerField(default=0)
    records_anonymized = models.IntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'data_erasures'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.erasure_type} ({self.status})"


