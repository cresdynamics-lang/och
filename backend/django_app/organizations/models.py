"""
Organization models for the Ongoza CyberHub platform.
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Organization(models.Model):
    """
    Organization model representing companies, teams, or groups.
    Supports Sponsors, Employers, and Partners.
    """
    ORG_TYPES = [
        ('sponsor', 'Sponsor'),
        ('employer', 'Employer'),
        ('partner', 'Partner'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    org_type = models.CharField(max_length=20, choices=ORG_TYPES, default='sponsor')
    description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    country = models.CharField(max_length=2, null=True, blank=True)  # ISO 3166-1 alpha-2
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # Deprecated, use status instead
    
    # Relationships
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_organizations'
    )
    members = models.ManyToManyField(
        User,
        through='OrganizationMember',
        related_name='organizations'
    )
    
    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """
    Through model for Organization-User relationship with roles.
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('viewer', 'Viewer'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'organization_members'
        unique_together = ['organization', 'user']
    
    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"

