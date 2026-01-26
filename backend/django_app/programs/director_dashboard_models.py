"""
Director Dashboard Cache Models
Cached aggregations for director dashboard performance at scale.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class DirectorDashboardCache(models.Model):
    """
    Per-director dashboard cache for summary metrics.
    Refreshed every 5 minutes by background workers.
    """
    director = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='director_dashboard_cache',
        primary_key=True
    )
    
    # Program Level Summaries
    active_programs_count = models.IntegerField(default=0)
    active_cohorts_count = models.IntegerField(default=0)
    total_seats = models.IntegerField(default=0)
    seats_used = models.IntegerField(default=0)
    seats_pending = models.IntegerField(default=0)
    
    # Cohort Health and Progress
    avg_readiness_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    avg_completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    avg_portfolio_health = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    avg_mission_approval_time_minutes = models.IntegerField(null=True, blank=True)
    
    # Mentorship KPIs
    mentor_coverage_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mentor_session_completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mentors_over_capacity_count = models.IntegerField(default=0)
    mentee_at_risk_count = models.IntegerField(default=0)
    
    # Alerts and Flags
    cohorts_flagged_count = models.IntegerField(default=0)
    mentors_flagged_count = models.IntegerField(default=0)
    missions_bottlenecked_count = models.IntegerField(default=0)
    payments_overdue_count = models.IntegerField(default=0)
    
    # Timestamps
    cache_updated_at = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'director_dashboard_cache'
        ordering = ['-cache_updated_at']
    
    def __str__(self):
        return f"Dashboard Cache for {self.director.email}"


class DirectorCohortDashboard(models.Model):
    """
    Granular cohort-level dashboard data cached per director.
    Refreshed on-demand or every 5 minutes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    director = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='director_cohort_dashboards',
        db_index=True
    )
    cohort = models.ForeignKey(
        'programs.Cohort',
        on_delete=models.CASCADE,
        related_name='director_dashboards',
        db_index=True
    )
    
    # Basic Cohort Info
    cohort_name = models.CharField(max_length=200)
    track_name = models.CharField(max_length=200)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    MODE_CHOICES = [
        ('onsite', 'Onsite'),
        ('virtual', 'Virtual'),
        ('hybrid', 'Hybrid'),
    ]
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='virtual')
    
    # Seat Management
    seats_total = models.IntegerField(default=0)
    seats_used = models.IntegerField(default=0)
    seats_scholarship = models.IntegerField(default=0)
    seats_sponsored = models.IntegerField(default=0)
    
    # Enrollment Status (JSONB-like structure stored as JSONField)
    enrollment_status = models.JSONField(
        default=dict,
        help_text='{active: 45, pending: 3, withdrawn: 2}'
    )
    
    # Metrics
    readiness_avg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mentor_coverage_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mentor_session_completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mission_approval_time_avg = models.IntegerField(null=True, blank=True)
    portfolio_health_avg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    at_risk_mentees = models.IntegerField(default=0)
    
    # Structured Data (JSONB-like)
    milestones_upcoming = models.JSONField(
        default=list,
        help_text='List of next milestone events with dates'
    )
    calendar_events = models.JSONField(
        default=list,
        help_text='Upcoming key dates'
    )
    flags_active = models.JSONField(
        default=list,
        help_text='Cohort or mentor risk flags'
    )
    
    updated_at = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'director_cohort_dashboard'
        unique_together = ['director', 'cohort']
        indexes = [
            models.Index(fields=['director', 'cohort'], name='idx_director_cohort'),
            models.Index(fields=['updated_at'], name='idx_cohort_dashboard_updated'),
        ]
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.cohort_name} Dashboard for {self.director.email}"

