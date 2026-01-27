"""
Sponsor models for Ongóza Cyber Hub.
Manages sponsors, cohorts, and student enrollments for enterprise partnerships.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Sponsor(models.Model):
    """
    Sponsor organization model.
    Represents universities, corporations, and scholarship providers.
    """
    SPONSOR_TYPES = [
        ('university', 'University/Institution'),
        ('corporate', 'Corporate Partner'),
        ('scholarship', 'Scholarship Provider'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=100, unique=True, help_text='URL-friendly identifier')
    name = models.CharField(max_length=255, help_text='Full sponsor name')

    sponsor_type = models.CharField(
        max_length=20,
        choices=SPONSOR_TYPES,
        default='university',
        help_text='Type of sponsoring organization'
    )

    # Contact & Branding
    logo_url = models.URLField(blank=True, null=True, help_text='Sponsor logo URL')
    contact_email = models.EmailField(help_text='Primary contact email')
    website = models.URLField(blank=True, null=True, help_text='Sponsor website')

    # Location
    country = models.CharField(max_length=2, null=True, blank=True, help_text='ISO 3166-1 alpha-2 country code')
    city = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True, help_text='State/Province')

    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsors'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['sponsor_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_sponsor_type_display()})"


class SponsorCohort(models.Model):
    """
    Cohort managed by a sponsor.
    Represents a specific group of students (e.g., "Nairobi Poly Jan 2026 Cohort").
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor = models.ForeignKey(
        Sponsor,
        on_delete=models.CASCADE,
        related_name='cohorts'
    )

    name = models.CharField(max_length=255, help_text='Cohort display name')
    track_slug = models.CharField(max_length=50, help_text='Primary track (defender, grc, innovation, leadership, offensive)')

    # Capacity & Enrollment
    target_size = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1)],
        help_text='Target number of students'
    )
    students_enrolled = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current number of enrolled students'
    )

    # Timeline
    start_date = models.DateField(null=True, blank=True, help_text='Cohort start date')
    expected_graduation_date = models.DateField(null=True, blank=True, help_text='Expected completion date')

    # Status
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('graduated', 'Graduated'),
        ('archived', 'Archived'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        help_text='Cohort lifecycle status'
    )
    is_active = models.BooleanField(default=True, help_text='Whether cohort is currently active')
    completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Overall cohort completion percentage'
    )

    # Business metrics
    target_completion_date = models.DateField(null=True, blank=True, help_text='Target completion date for the cohort')
    budget_allocated = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Allocated budget in KES'
    )
    ai_interventions_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Number of AI interventions deployed'
    )
    placement_goal = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Target number of placements/hires'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsor_cohorts'
        ordering = ['-start_date', 'name']
        unique_together = ['sponsor', 'name']  # Prevent duplicate cohort names per sponsor
        indexes = [
            models.Index(fields=['sponsor', 'is_active']),
            models.Index(fields=['sponsor', 'status']),
            models.Index(fields=['track_slug']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['target_completion_date']),
        ]

    def __str__(self):
        return f"{self.sponsor.name} - {self.name}"

    @property
    def active_students(self):
        """Count of currently active students in this cohort"""
        return self.student_enrollments.filter(is_active=True).count()

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on enrolled students"""
        if self.students_enrolled == 0:
            return 0
        return (self.completion_rate * 100) / self.students_enrolled


class SponsorStudentCohort(models.Model):
    """
    Many-to-many relationship between students and sponsor cohorts.
    Tracks individual student enrollment and progress within a cohort.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    sponsor_cohort = models.ForeignKey(
        SponsorCohort,
        on_delete=models.CASCADE,
        related_name='student_enrollments'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sponsor_enrollments'
    )

    # Enrollment status
    is_active = models.BooleanField(default=True, help_text='Whether student is actively enrolled')
    enrollment_status = models.CharField(
        max_length=20,
        choices=[
            ('enrolled', 'Enrolled'),
            ('completed', 'Completed'),
            ('withdrawn', 'Withdrawn'),
            ('transferred', 'Transferred'),
        ],
        default='enrolled'
    )

    # Progress tracking
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Individual student completion percentage'
    )

    # Timeline
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)

    # Additional metadata
    notes = models.TextField(blank=True, null=True, help_text='Sponsor notes about this student')

    class Meta:
        db_table = 'sponsor_student_cohorts'
        unique_together = ['sponsor_cohort', 'student']  # Student can only be in one cohort per sponsor
        indexes = [
            models.Index(fields=['sponsor_cohort', 'is_active']),
            models.Index(fields=['student', 'enrollment_status']),
            models.Index(fields=['joined_at']),
            models.Index(fields=['last_activity_at']),
        ]

    def __str__(self):
        return f"{self.student.email} in {self.sponsor_cohort.name}"

    def update_completion_percentage(self):
        """Update completion percentage based on curriculum progress"""
        # This would be called by a management command or signal
        # Implementation would query curriculum progress for this student
        pass

    def mark_completed(self):
        """Mark student as completed"""
        from django.utils import timezone
        self.enrollment_status = 'completed'
        self.completed_at = timezone.now()
        self.completion_percentage = 100
        self.save(update_fields=['enrollment_status', 'completed_at', 'completion_percentage'])


class SponsorAnalytics(models.Model):
    """
    Cached analytics data for sponsor dashboards.
    Updated periodically to avoid expensive real-time calculations.
    """
    sponsor = models.OneToOneField(
        Sponsor,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='analytics'
    )

    # Executive Summary Metrics
    total_students = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    placement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    roi_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)

    # Hiring Metrics
    total_hires = models.IntegerField(default=0)
    hires_last_30d = models.IntegerField(default=0)
    avg_salary_kes = models.IntegerField(default=0, help_text='Average salary in KES')

    # AI Readiness
    avg_readiness_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Cache metadata
    last_updated = models.DateTimeField(auto_now=True)
    cache_version = models.IntegerField(default=1, help_text='Increment when cache structure changes')

    class Meta:
        db_table = 'sponsor_analytics'

    def __str__(self):
        return f"Analytics for {self.sponsor.name}"


class SponsorIntervention(models.Model):
    """
    Track AI interventions deployed by sponsors.
    """
    INTERVENTION_TYPES = [
        ('recipe_nudge', 'Recipe Nudge Deployment'),
        ('mentor_assignment', 'Mentor Assignment'),
        ('quiz_unlock', 'Quiz Unlock Assistance'),
        ('cohort_support', 'Cohort-wide Support'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor_cohort = models.ForeignKey(
        SponsorCohort,
        on_delete=models.CASCADE,
        related_name='interventions'
    )

    intervention_type = models.CharField(max_length=20, choices=INTERVENTION_TYPES)
    title = models.CharField(max_length=255, help_text='Human-readable intervention description')
    description = models.TextField(help_text='Detailed intervention details')

    # Targeting
    target_students = models.ManyToManyField(
        User,
        related_name='targeted_interventions',
        help_text='Students targeted by this intervention'
    )
    ai_trigger_reason = models.TextField(help_text='AI reasoning for this intervention')

    # Results
    expected_roi = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        help_text='Expected ROI multiplier'
    )
    actual_roi = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Actual ROI achieved'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('deployed', 'Deployed'),
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='deployed'
    )

    # Timeline
    deployed_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sponsor_interventions'
        ordering = ['-deployed_at']
        indexes = [
            models.Index(fields=['sponsor_cohort', 'status']),
            models.Index(fields=['intervention_type']),
            models.Index(fields=['deployed_at']),
        ]

    def __str__(self):
        return f"{self.intervention_type} for {self.sponsor_cohort.name}"