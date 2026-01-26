"""
Sponsor Dashboard models for corporate ROI visibility.
Aggregates sponsored seat utilization, cohort progress, graduate readiness, and financial metrics.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class SponsorDashboardCache(models.Model):
    """
    Sponsor dashboard cache - one row per sponsor organization.
    Aggregated metrics refreshed every 5 minutes by background workers.
    """
    org = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='sponsor_dashboard_cache',
        primary_key=True,
        db_index=True
    )
    
    # Financial KPIs
    seats_total = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_at_risk = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Seats with <50% completion'
    )
    budget_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    budget_used = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    budget_used_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Talent KPIs (aggregates ONLY)
    avg_readiness = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    avg_completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    graduates_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Completed cohorts'
    )
    active_cohorts_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Alerts
    overdue_invoices_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    low_utilization_cohorts = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Cohorts with <50% utilization'
    )
    
    cache_updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sponsor_dashboard_cache'
        ordering = ['-cache_updated_at']
    
    def __str__(self):
        return f"Sponsor Cache: {self.org.name}"


class SponsorCohortDashboard(models.Model):
    """
    Sponsor cohort dashboard - granular per-cohort details for sponsors.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='sponsor_cohort_dashboards',
        db_index=True
    )
    cohort = models.ForeignKey(
        'programs.Cohort',
        on_delete=models.CASCADE,
        related_name='sponsor_dashboards',
        db_index=True
    )
    
    cohort_name = models.CharField(max_length=200)
    track_name = models.CharField(max_length=200, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    mode = models.CharField(
        max_length=20,
        choices=[
            ('onsite', 'Onsite'),
            ('virtual', 'Virtual'),
            ('hybrid', 'Hybrid'),
        ],
        blank=True
    )
    
    # Seat metrics
    seats_total = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_sponsored = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_remaining = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Progress metrics
    avg_readiness = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    portfolio_health_avg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Graduate metrics
    graduates_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    at_risk_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Students at risk of dropout'
    )
    
    # Milestones and events
    next_milestone = models.JSONField(
        default=dict,
        blank=True,
        help_text='{title, date, type}'
    )
    upcoming_events = models.JSONField(
        default=list,
        blank=True
    )
    
    # Flags
    flags = models.JSONField(
        default=list,
        blank=True,
        help_text='["low_completion", "budget_alert", etc.]'
    )
    
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sponsor_cohort_dashboard'
        unique_together = ['org', 'cohort']
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['org', 'updated_at']),
            models.Index(fields=['cohort']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.cohort_name}"


class SponsorStudentAggregates(models.Model):
    """
    Sponsor student aggregates - consent-gated student profiles.
    Only shows PII if consent_employer_share is True.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='sponsor_student_aggregates',
        db_index=True
    )
    cohort = models.ForeignKey(
        'programs.Cohort',
        on_delete=models.CASCADE,
        related_name='sponsor_student_aggregates',
        db_index=True
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='sponsor_aggregates',
        db_index=True
    )
    
    name_anonymized = models.CharField(
        max_length=100,
        help_text='"Student #123" unless consent granted'
    )
    readiness_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    portfolio_items = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    consent_employer_share = models.BooleanField(
        default=False,
        help_text='Whether student consented to share profile with employer'
    )
    
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sponsor_student_aggregates'
        unique_together = ['org', 'cohort', 'student']
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['org', 'cohort']),
            models.Index(fields=['org', 'consent_employer_share']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.name_anonymized} ({self.cohort.name})"


class SponsorCode(models.Model):
    """
    Sponsor codes for bulk seat allocation.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='sponsor_codes',
        db_index=True
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='SPNSR-ABC123-2026 format'
    )
    seats = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Number of seats this code provides'
    )
    value_per_seat = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Fixed value or discount %'
    )
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    usage_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    max_usage = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum number of times this code can be used'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sponsor_codes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org', 'status']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.org.name} ({self.seats} seats)"
    
    @property
    def is_valid(self):
        """Check if code is currently valid."""
        if self.status != 'active':
            return False
        now = timezone.now().date()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_usage and self.usage_count >= self.max_usage:
            return False
        return True
