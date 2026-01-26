"""
User models for the Ongoza CyberHub platform.
Comprehensive identity, authentication, and authorization system.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class User(AbstractUser):
    """
    Enhanced User model with ABAC attributes and account lifecycle management.
    """
    # Override email to make it unique and indexed (AbstractUser has email but not unique by default)
    email = models.EmailField(unique=True, db_index=True)
    
    # Account lifecycle
    ACCOUNT_STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('deactivated', 'Deactivated'),
        ('erased', 'Erased'),
    ]
    account_status = models.CharField(
        max_length=20,
        choices=ACCOUNT_STATUS_CHOICES,
        default='pending_verification'
    )
    email_verification_token = models.CharField(max_length=255, null=True, blank=True)
    email_token_created_at = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    # Secure hashed verification token (Elite security standard)
    verification_hash = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    token_expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    password_reset_token = models.CharField(max_length=255, null=True, blank=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    erased_at = models.DateTimeField(null=True, blank=True)
    
    # ABAC Attributes
    cohort_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    track_key = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    org_id = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_members',
        db_index=True
    )
    country = models.CharField(max_length=2, null=True, blank=True)  # ISO 3166-1 alpha-2
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')  # ISO 639-1 language code
    
    # Risk and security
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        default='low'
    )
    mfa_enabled = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=20,
        choices=[('totp', 'TOTP'), ('sms', 'SMS'), ('email', 'Email')],
        null=True,
        blank=True
    )
    password_changed_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Profile fields
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    
    # Student onboarding fields (for TalentScope baseline)
    LEARNING_STYLE_CHOICES = [
        ('visual', 'Visual'),
        ('auditory', 'Auditory'),
        ('kinesthetic', 'Kinesthetic'),
        ('reading', 'Reading/Writing'),
        ('mixed', 'Mixed'),
    ]
    preferred_learning_style = models.CharField(
        max_length=20,
        choices=LEARNING_STYLE_CHOICES,
        blank=True,
        null=True,
        help_text='Preferred learning style for TalentScope calculations'
    )
    career_goals = models.TextField(
        blank=True,
        null=True,
        help_text='Career goals and aspirations for TalentScope baseline'
    )
    
    # Profile completion tracking
    profile_complete = models.BooleanField(default=False)
    onboarding_complete = models.BooleanField(default=False)
    
    # Profiling completion tracking (mandatory Tier 0 gateway)
    profiling_complete = models.BooleanField(default=False, db_index=True)
    profiling_completed_at = models.DateTimeField(null=True, blank=True)
    profiling_session_id = models.UUIDField(null=True, blank=True, help_text='Completed profiling session ID')
    
    # Foundations completion tracking (mandatory Tier 1 gateway)
    foundations_complete = models.BooleanField(default=False, db_index=True)
    foundations_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Mentor fields
    is_mentor = models.BooleanField(default=False, db_index=True)
    mentor_capacity_weekly = models.IntegerField(default=10)
    mentor_availability = models.JSONField(default=dict, blank=True)  # {"mon": ["14:00-16:00"]}
    mentor_specialties = models.JSONField(default=list, blank=True)  # ["SIEM", "DFIR"]
    CYBER_EXPOSURE_CHOICES = [
        ('none', 'No Experience'),
        ('beginner', 'Beginner (Some Awareness)'),
        ('intermediate', 'Intermediate (Some Training)'),
        ('advanced', 'Advanced (Professional Experience)'),
    ]
    cyber_exposure_level = models.CharField(
        max_length=20,
        choices=CYBER_EXPOSURE_CHOICES,
        blank=True,
        null=True,
        help_text='Current cyber security exposure level for TalentScope baseline'
    )
    
    # Metadata and settings
    metadata = models.JSONField(default=dict, blank=True, help_text='User metadata and settings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['cohort_id']),
            models.Index(fields=['track_key']),
            models.Index(fields=['org_id']),
            models.Index(fields=['account_status']),
            models.Index(fields=['email_verified']),
            models.Index(fields=['mfa_enabled']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_profiling_session_id_safe(self):
        """Safely get profiling_session_id, handling invalid UUID values."""
        try:
            # Try to access the field directly
            value = self.profiling_session_id
            # If it's None, return None
            if value is None:
                return None
            # If it's already a UUID object, return it
            import uuid
            if isinstance(value, uuid.UUID):
                return value
            # If it's a string, try to convert it
            if isinstance(value, str):
                try:
                    return uuid.UUID(value)
                except (ValueError, TypeError):
                    return None
            return value
        except (TypeError, ValueError, AttributeError) as e:
            # If there's an error accessing the field (invalid UUID in DB), return None
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to get profiling_session_id for user {self.id}: {e}")
            return None
    
    def activate(self):
        """Activate user account."""
        self.account_status = 'active'
        self.is_active = True
        if not self.activated_at:
            self.activated_at = timezone.now()
        self.save()
    
    def deactivate(self):
        """Deactivate user account."""
        self.account_status = 'deactivated'
        self.is_active = False
        self.deactivated_at = timezone.now()
        self.save()
    
    def erase(self):
        """Erase user data (GDPR compliance)."""
        self.account_status = 'erased'
        self.is_active = False
        self.erased_at = timezone.now()
        # Anonymize PII
        self.email = f"erased_{uuid.uuid4()}@erased.local"
        self.username = f"erased_{uuid.uuid4()}"
        self.first_name = "Erased"
        self.last_name = "User"
        self.bio = None
        self.phone_number = None
        self.save()
    
    def generate_verification_token(self):
        """
        Generate secure email verification token with hashing (Elite security standard).
        
        Returns:
            str: Raw token (URL-safe, 32 bytes) - MUST be used immediately, NOT stored in DB
        
        Security Features:
            - Uses secrets.token_urlsafe(32) for cryptographically secure generation
            - SHA-256 hashing at-rest (only hash stored in DB)
            - 24-hour expiration timestamp
            - One-time use (hash cleared after verification)
        """
        import secrets
        import hashlib
        from django.conf import settings
        from datetime import timedelta
        
        # Generate raw token (URL-safe, 32 bytes = ~43 characters)
        raw_token = secrets.token_urlsafe(32)
        
        # Hash the token using SHA-256 (64 character hex string)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        
        # Calculate expiration (24 hours from now)
        expiry_hours = getattr(settings, 'ACTIVATION_TOKEN_EXPIRY', 24)
        self.token_expires_at = timezone.now() + timedelta(hours=expiry_hours)
        
        # Store only the hash in database (raw token is NEVER stored)
        self.verification_hash = token_hash
        
        # Clear legacy fields if they exist
        self.email_verification_token = None
        self.email_token_created_at = None
        
        # Save hash and expiration
        self.save()
        
        # Return raw token (must be used immediately)
        return raw_token

    def generate_password_reset_token(self):
        """Generate secure password reset token"""
        import secrets
        self.password_reset_token = secrets.token_urlsafe(64)
        self.password_reset_token_created = timezone.now()
        self.save()

    def verify_email_token(self, raw_token):
        """
        Verify email verification token using hashed comparison (Elite security standard).
        
        Args:
            raw_token: The raw token from the URL
        
        Returns:
            bool: True if token is valid and not expired, False otherwise
        
        Security Features:
            - Hashes incoming token and compares with stored hash
            - Checks expiration timestamp
            - One-time use (clears hash after successful verification)
            - Prevents timing attacks with constant-time comparison
        """
        import hashlib
        from django.conf import settings
        
        # Check if user has a verification hash
        if not self.verification_hash or not self.token_expires_at:
            return False
        
        # Check if token has expired
        if timezone.now() > self.token_expires_at:
            return False
        
        # Hash the incoming raw token
        incoming_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        
        # Constant-time comparison to prevent timing attacks
        if not self._constant_time_compare(self.verification_hash, incoming_hash):
            return False
        
        # Token is valid - activate user and clear hash (one-time use)
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self.is_active = True
        self.account_status = 'active'
        if not self.activated_at:
            self.activated_at = timezone.now()
        
        # Clear hash and expiration (one-time use)
        self.verification_hash = None
        self.token_expires_at = None
        
        # Clear legacy fields if they exist
        self.email_verification_token = None
        self.email_token_created_at = None
        
        self.save()
        return True
    
    def _constant_time_compare(self, val1, val2):
        """
        Constant-time string comparison to prevent timing attacks.
        
        Args:
            val1: First string to compare
            val2: Second string to compare
        
        Returns:
            bool: True if strings are equal, False otherwise
        """
        import hmac
        if len(val1) != len(val2):
            return False
        return hmac.compare_digest(val1.encode('utf-8'), val2.encode('utf-8'))

    def verify_password_reset_token(self, token):
        """Verify password reset token"""
        from django.conf import settings
        expiry_hours = getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRY', 1)
        if (self.password_reset_token == token and
            self.password_reset_token_created and
            not self._token_expired(self.password_reset_token_created, expiry_hours)):
            return True
        return False

    def _token_expired(self, created_time, hours):
        """Check if token has expired"""
        from datetime import timedelta
        expiry_time = created_time + timedelta(hours=hours)
        return timezone.now() > expiry_time


class Role(models.Model):
    """
    RBAC Role model for global/base roles.
    """
    ROLE_TYPES = [
        ('admin', 'Admin'),
        ('program_director', 'Program Director'),
        ('mentor', 'Mentor'),
        ('mentee', 'Mentee'),
        ('student', 'Student'),
        ('finance', 'Finance'),
        ('finance_admin', 'Finance Admin'),
        ('sponsor_admin', 'Sponsor/Employer Admin'),
        ('analyst', 'Analyst'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=True)  # Cannot be deleted
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Permissions (many-to-many relationship)
    permissions = models.ManyToManyField(
        'Permission',
        related_name='roles',
        blank=True
    )
    
    class Meta:
        db_table = 'roles'
        ordering = ['name']
    
    def __str__(self):
        return self.display_name


class Permission(models.Model):
    """
    Permission model for fine-grained access control.
    """
    RESOURCE_TYPES = [
        ('user', 'User'),
        ('organization', 'Organization'),
        ('cohort', 'Cohort'),
        ('track', 'Track'),
        ('portfolio', 'Portfolio'),
        ('profiling', 'Profiling'),
        ('mentorship', 'Mentorship'),
        ('analytics', 'Analytics'),
        ('billing', 'Billing'),
        ('invoice', 'Invoice'),
        ('api_key', 'API Key'),
        ('webhook', 'Webhook'),
    ]
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('list', 'List'),
        ('manage', 'Manage'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'permissions'
        unique_together = ['resource_type', 'action']
        ordering = ['resource_type', 'action']
    
    def __str__(self):
        return f"{self.action}_{self.resource_type}"


class UserRole(models.Model):
    """
    User-Role assignment with context (cohort, track, org).
    Supports scope-based role assignments per specification.
    """
    SCOPE_CHOICES = [
        ('global', 'Global'),
        ('org', 'Organization'),
        ('cohort', 'Cohort'),
        ('track', 'Track'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    
    # Scope for ABAC (per specification)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='global')
    scope_ref = models.UUIDField(null=True, blank=True, db_index=True)  # Reference to org/cohort/track UUID
    
    # Legacy fields (for backward compatibility)
    cohort_id = models.CharField(max_length=100, null=True, blank=True)
    track_key = models.CharField(max_length=100, null=True, blank=True)
    org_id = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_assignments'
    )
    
    # Assignment metadata
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='role_assignments_made'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = [
            ['user', 'role', 'scope', 'scope_ref'],
            ['user', 'role', 'cohort_id', 'track_key', 'org_id'],  # Legacy compatibility
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['scope', 'scope_ref']),
            models.Index(fields=['cohort_id']),
            models.Index(fields=['track_key']),
            models.Index(fields=['org_id']),
        ]
    
    def __str__(self):
        context = []
        if self.scope != 'global':
            context.append(f"{self.scope}:{self.scope_ref}")
        if self.cohort_id:
            context.append(f"cohort:{self.cohort_id}")
        if self.track_key:
            context.append(f"track:{self.track_key}")
        if self.org_id:
            context.append(f"org:{self.org_id.id}")
        context_str = f" ({', '.join(context)})" if context else ""
        return f"{self.user.email} - {self.role.display_name}{context_str}"


class ConsentScope(models.Model):
    """
    Consent scopes for privacy compliance (GDPR/DPA).
    """
    SCOPE_TYPES = [
        ('share_with_mentor', 'Share with Mentor'),
        ('share_with_sponsor', 'Share with Sponsor'),
        ('analytics', 'Analytics'),
        ('marketing', 'Marketing'),
        ('research', 'Research'),
        ('public_portfolio', 'Public Portfolio'),
        ('employer_share', 'Employer Share'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consent_scopes')
    scope_type = models.CharField(max_length=50, choices=SCOPE_TYPES)
    granted = models.BooleanField(default=False)
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'consent_scopes'
        unique_together = ['user', 'scope_type']
        indexes = [
            models.Index(fields=['user', 'granted']),
        ]
    
    def __str__(self):
        status = "Granted" if self.granted else "Revoked"
        return f"{self.user.email} - {self.scope_type} ({status})"


class Entitlement(models.Model):
    """
    Entitlements for feature access control.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entitlements')
    feature = models.CharField(max_length=100, db_index=True)
    granted = models.BooleanField(default=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'entitlements'
        unique_together = ['user', 'feature']
        indexes = [
            models.Index(fields=['user', 'granted']),
            models.Index(fields=['feature']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.feature}"
