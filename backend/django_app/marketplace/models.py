"""
Marketplace models

These models power the Career / Marketplace module where verified
talent is exposed to employers with strict consent and tier rules.
"""

import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class Employer(models.Model):
    """
    Employer profile.

    Represents an organization user that can browse and contact talent.
    In most cases this will be linked to a User account with an
    "employer" role.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employer_profile',
        help_text='Primary account owner for this employer',
    )
    company_name = models.CharField(max_length=255, db_index=True)
    website = models.URLField(blank=True)
    sector = models.CharField(max_length=255, blank=True, help_text='Industry sector')
    country = models.CharField(max_length=100, blank=True)
    logo_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marketplace_employers'

    def __str__(self) -> str:
        return self.company_name


class MarketplaceProfile(models.Model):
    """
    Employer-facing view of a mentee.

    This denormalizes key data from TalentScope, portfolio, and
    subscriptions for fast filtering in the marketplace.
    """

    PROFILE_STATUS_CHOICES = [
        ('foundation_mode', 'Foundation Mode'),
        ('emerging_talent', 'Emerging Talent'),
        ('job_ready', 'Job Ready'),
    ]

    TIER_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter ($3)'),
        ('professional', 'Professional ($7)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='marketplace_profile',
        db_index=True,
    )

    # Subscription / tier snapshot used for visibility rules
    tier = models.CharField(
        max_length=32,
        choices=TIER_CHOICES,
        default='free',
        help_text='Current monetization tier used for marketplace visibility',
    )

    # Readiness metrics (denormalized from TalentScope)
    readiness_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Overall career readiness score 0-100',
    )
    job_fit_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='TalentScope job-match score (0-100) for current target role',
    )
    hiring_timeline_days = models.IntegerField(
        null=True,
        blank=True,
        help_text='Predicted days until hire from TalentScope',
    )
    profile_status = models.CharField(
        max_length=32,
        choices=PROFILE_STATUS_CHOICES,
        default='foundation_mode',
        db_index=True,
    )

    # Portfolio depth & skills snapshot to support filtering
    primary_role = models.CharField(
        max_length=255,
        blank=True,
        help_text='Target role label (e.g., SOC Analyst)',
    )
    primary_track_key = models.CharField(
        max_length=64,
        blank=True,
        help_text='Curriculum track key associated with this profile',
    )
    skills = models.JSONField(
        default=list,
        blank=True,
        help_text='List of key skills/keywords for filtering',
    )
    portfolio_depth = models.CharField(
        max_length=32,
        blank=True,
        help_text='Heuristic label like "basic", "moderate", "deep"',
    )

    # Privacy & consent flags
    is_visible = models.BooleanField(
        default=False,
        help_text='If false, profile is never shown in marketplace search',
    )
    employer_share_consent = models.BooleanField(
        default=False,
        help_text='Snapshot of employer_share consent scope at last sync',
    )

    # Activity tracking
    last_updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'marketplace_profiles'
        indexes = [
            models.Index(fields=['profile_status']),
            models.Index(fields=['tier', 'is_visible']),
        ]

    def __str__(self) -> str:
        return f'Marketplace profile for {self.mentee.email}'


class JobPosting(models.Model):
    """
    Employer job / assignment posting inside the marketplace.
    """

    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employer = models.ForeignKey(
        Employer,
        on_delete=models.CASCADE,
        related_name='job_postings',
    )
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    job_type = models.CharField(max_length=32, choices=JOB_TYPE_CHOICES)
    description = models.TextField()
    required_skills = models.JSONField(
        default=list,
        blank=True,
        help_text='List of required skills/keywords',
    )
    salary_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    salary_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    salary_currency = models.CharField(max_length=3, default='USD')
    is_active = models.BooleanField(default=True, db_index=True)
    posted_at = models.DateTimeField(default=timezone.now)
    application_deadline = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'marketplace_job_postings'
        indexes = [
            models.Index(fields=['is_active', 'posted_at']),
        ]

    def __str__(self) -> str:
        return f'{self.title} @ {self.employer.company_name}'


class EmployerInterestLog(models.Model):
    """
    Tracks employer interactions with a candidate profile.
    """

    ACTION_CHOICES = [
        ('view', 'Viewed'),
        ('favorite', 'Favorited'),
        ('shortlist', 'Shortlisted'),
        ('contact_request', 'Contact Requested'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employer = models.ForeignKey(
        Employer,
        on_delete=models.CASCADE,
        related_name='interest_logs',
    )
    profile = models.ForeignKey(
        MarketplaceProfile,
        on_delete=models.CASCADE,
        related_name='interest_logs',
    )
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Optional structured metadata (e.g., job_id, notes)',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'marketplace_employer_interest_logs'
        indexes = [
            models.Index(fields=['employer', 'action']),
            models.Index(fields=['profile', 'action']),
        ]

    def __str__(self) -> str:
        return f'{self.employer.company_name} {self.action} {self.profile.mentee.email}'


class JobApplication(models.Model):
    """
    Tracks student applications to job postings.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewing', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview Scheduled'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('accepted', 'Accepted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_posting = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,
        related_name='applications',
        db_index=True,
    )
    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='job_applications',
        db_index=True,
        help_text='Student who applied',
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    cover_letter = models.TextField(
        blank=True,
        help_text='Optional cover letter from applicant',
    )
    match_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Calculated match score based on skills (0-100)',
    )
    notes = models.TextField(
        blank=True,
        help_text='Internal notes from employer',
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When status was last changed',
    )

    class Meta:
        db_table = 'marketplace_job_applications'
        indexes = [
            models.Index(fields=['job_posting', 'status']),
            models.Index(fields=['applicant', 'status']),
            models.Index(fields=['status', 'applied_at']),
        ]
        unique_together = [['job_posting', 'applicant']]

    def __str__(self) -> str:
        return f'{self.applicant.email} -> {self.job_posting.title} ({self.status})'
