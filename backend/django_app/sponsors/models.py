"""
Sponsor models for Ongóza Cyber Hub.
Manages sponsors, cohorts, and student enrollments for enterprise partnerships.
"""
import uuid
from decimal import Decimal
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


class SponsorFinancialTransaction(models.Model):
    """
    Financial transactions for sponsors including fees, revenue share, and adjustments.
    """
    TRANSACTION_TYPES = [
        ('platform_fee', 'Platform Fee'),
        ('mentor_fee', 'Mentor Fee'),
        ('lab_cost', 'Lab Cost'),
        ('scholarship', 'Scholarship'),
        ('revenue_share', 'Revenue Share'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('invoiced', 'Invoiced'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor = models.ForeignKey(
        Sponsor,
        on_delete=models.CASCADE,
        related_name='financial_transactions'
    )
    cohort = models.ForeignKey(
        SponsorCohort,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_transactions'
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
        help_text='Type of financial transaction'
    )
    description = models.TextField(help_text='Detailed transaction description')

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Transaction amount (positive = income, negative = expense)'
    )
    currency = models.CharField(
        max_length=3,
        default='KES',
        help_text='Currency code (KES, USD, etc.)'
    )

    # Billing period
    period_start = models.DateField(null=True, blank=True, help_text='Start date of billing period')
    period_end = models.DateField(null=True, blank=True, help_text='End date of billing period')

    # Status and documents
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Transaction status'
    )
    invoice_url = models.URLField(null=True, blank=True, help_text='Generated invoice PDF URL')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsor_financial_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sponsor', 'status']),
            models.Index(fields=['cohort', 'transaction_type']),
            models.Index(fields=['period_start', 'period_end']),
            models.Index(fields=['transaction_type', 'status']),
        ]

    def __str__(self):
        return f"{self.sponsor.name} - {self.transaction_type} - {self.amount} {self.currency}"


class SponsorCohortBilling(models.Model):
    """
    Monthly billing summary for sponsor cohorts.
    Auto-generated monthly with platform costs, mentor costs, and revenue share.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor_cohort = models.ForeignKey(
        SponsorCohort,
        on_delete=models.CASCADE,
        related_name='billing_records'
    )

    # Billing period
    billing_month = models.DateField(help_text='Month being billed (YYYY-MM-01)')

    # Activity metrics
    students_active = models.IntegerField(default=0, help_text='Number of active students this month')
    mentor_sessions = models.IntegerField(default=0, help_text='Number of mentor sessions this month')
    lab_usage_hours = models.IntegerField(default=0, help_text='Lab usage hours this month')
    hires = models.IntegerField(default=0, help_text='Number of hires this month')

    # Cost breakdown (KES)
    platform_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Platform fee (students_active × 20,000 KES)'
    )
    mentor_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Mentor fees (mentor_sessions × 7,000 KES)'
    )
    lab_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Lab costs (lab_usage_hours × 200 KES)'
    )
    scholarship_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Scholarship costs allocated this month'
    )

    # Revenue
    revenue_share_kes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Revenue share from hires (3% of first year salaries)'
    )

    # Calculated totals
    total_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Total costs (platform + mentor + lab + scholarship)'
    )
    net_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Net amount due (total_cost - revenue_share)'
    )

    # ROI calculation
    net_roi = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Return on investment ratio'
    )

    # Payment status
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('invoiced', 'Invoiced'),
            ('paid', 'Paid'),
            ('overdue', 'Overdue'),
        ],
        default='pending',
        help_text='Payment status'
    )
    payment_date = models.DateTimeField(null=True, blank=True, help_text='Date payment was received')
    invoice_generated = models.BooleanField(default=False, help_text='Whether invoice PDF has been generated')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsor_cohort_billing'
        unique_together = ['sponsor_cohort', 'billing_month']
        ordering = ['-billing_month']
        indexes = [
            models.Index(fields=['sponsor_cohort', 'billing_month']),
            models.Index(fields=['billing_month', 'payment_status']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.sponsor_cohort.name} - {self.billing_month.strftime('%Y-%m')}"

    def calculate_totals(self):
        """Calculate total costs and net amount"""
        self.total_cost = self.platform_cost + self.mentor_cost + self.lab_cost + self.scholarship_cost
        self.net_amount = self.total_cost - self.revenue_share_kes
        self.save(update_fields=['total_cost', 'net_amount'])


class RevenueShareTracking(models.Model):
    """
    Revenue share tracking for sponsor hires (3% of first year salaries).
    """
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor = models.ForeignKey(
        Sponsor,
        on_delete=models.CASCADE,
        related_name='revenue_shares'
    )
    cohort = models.ForeignKey(
        SponsorCohort,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revenue_shares'
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='revenue_shares'
    )

    # Employment details
    employer_name = models.CharField(max_length=255, help_text='Company that hired the student')
    role_title = models.CharField(max_length=255, help_text='Job title/role')
    first_year_salary_kes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Annual first year salary in KES'
    )

    # Revenue share calculation (3%)
    revenue_share_3pct = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='OCH revenue share (3% of first year salary)',
        editable=False
    )

    # Payment tracking
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        help_text='Payment status of revenue share'
    )
    paid_date = models.DateTimeField(null=True, blank=True, help_text='Date revenue share was paid to sponsor')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'revenue_share_tracking'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sponsor', 'payment_status']),
            models.Index(fields=['cohort', 'created_at']),
            models.Index(fields=['employer_name']),
            models.Index(fields=['payment_status', 'paid_date']),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.employer_name} ({self.first_year_salary_kes} KES)"

    def save(self, *args, **kwargs):
        # Auto-calculate revenue share
        if not self.revenue_share_3pct:
            self.revenue_share_3pct = self.first_year_salary_kes * Decimal('0.03')
        super().save(*args, **kwargs)


class SponsorCohortAssignment(models.Model):
    """
    Assignment of sponsors to cohorts with seat allocation and funding details.
    """
    ROLE_CHOICES = [
        ('funding', 'Funding'),
        ('mentorship', 'Mentorship'),
        ('partnership', 'Partnership'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor_uuid_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sponsor_assignments',
        to_field='uuid_id',
        db_column='sponsor_uuid_id'
    )
    cohort_id = models.ForeignKey(
        'programs.Cohort',
        on_delete=models.CASCADE,
        related_name='sponsor_assignments',
        db_column='cohort_id'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='funding')
    seat_allocation = models.IntegerField(validators=[MinValueValidator(1)])
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    funding_agreement_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsor_cohort_assignments'
        unique_together = ['sponsor_uuid_id', 'cohort_id']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sponsor_uuid_id.email} -> {self.cohort_id.name} ({self.seat_allocation} seats)"