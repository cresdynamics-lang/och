"""
ABAC Policy models for fine-grained access control.
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid


class Policy(models.Model):
    """
    ABAC Policy for access control evaluation.
    Policies define allow/deny rules based on resource, action, and conditions.
    """
    EFFECT_CHOICES = [
        ('allow', 'Allow'),
        ('deny', 'Deny'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Policy definition
    effect = models.CharField(max_length=10, choices=EFFECT_CHOICES)
    resource = models.CharField(max_length=100)  # e.g., 'user', 'portfolio', 'profiling'
    actions = models.JSONField(default=list)  # List of actions: ['read', 'write', 'delete']
    
    # Conditions (JSONB for flexible evaluation)
    condition = models.JSONField(default=dict, blank=True)
    # Example condition:
    # {
    #   "user.role": "mentor",
    #   "match_exists": {"user_id": "mentor_id"},
    #   "consent_scopes.includes": "share_with_mentor"
    # }
    
    # Versioning
    version = models.IntegerField(default=1)
    active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'policies'
        indexes = [
            models.Index(fields=['resource', 'active']),
            models.Index(fields=['effect', 'active']),
        ]
        ordering = ['name', '-version']
    
    def __str__(self):
        return f"{self.name} ({self.effect} {self.resource})"


