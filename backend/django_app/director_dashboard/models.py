"""
Director Dashboard models - Cache and health tracking for Program Directors.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class DirectorDashboardCache(models.Model):
    """Director dashboard cache - aggregated metrics per director."""
    director = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='director_dashboard_app_cache',
        primary_key=True,
        db_index=True
    )
    
    # Hero Metrics
    active_programs_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    active_cohorts_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_seats = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seats_pending = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    avg_readiness = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    avg_completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Risk Signals
    cohorts_at_risk = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    mentors_over_capacity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    mission_bottlenecks = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    payment_overdue_seats = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Cache metadata
    cache_updated_at = models.DateTimeField(auto_now=True, db_index=True)
    
    class Meta:
        db_table = 'director_dashboard_app_cache'
        ordering = ['-cache_updated_at']
    
    def __str__(self):
        return f"Dashboard Cache - {self.director.email}"


class DirectorCohortHealth(models.Model):
    """Cohort health details for director dashboard."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    director = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cohort_health_records',
        db_index=True
    )
    cohort = models.ForeignKey(
        'programs.Cohort',
        on_delete=models.CASCADE,
        related_name='health_records',
        db_index=True
    )
    cohort_name = models.CharField(max_length=255)
    
    # Metrics
    seats_used_total = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    readiness_avg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    mentor_coverage_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Milestone and risk tracking
    next_milestone = models.JSONField(default=dict, blank=True)
    risk_flags = models.JSONField(default=list, blank=True)
    risk_score = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    
    class Meta:
        db_table = 'director_cohort_health'
        unique_together = ['director', 'cohort']
        indexes = [
            models.Index(fields=['director', 'updated_at']),
            models.Index(fields=['cohort', 'risk_score']),
        ]
        ordering = ['-risk_score', '-updated_at']
    
    def __str__(self):
        return f"Health - {self.cohort_name} ({self.director.email})"

