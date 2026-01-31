"""
Programs, Tracks, Cohorts, and Enrollment models.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class Program(models.Model):
    """Program model - top-level program definition."""
    PROGRAM_CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('leadership', 'Leadership'),
        ('mentorship', 'Mentorship'),
        ('executive', 'Executive'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=PROGRAM_CATEGORY_CHOICES, help_text='Primary category (kept for backward compatibility)')
    categories = models.JSONField(
        default=list,
        blank=True,
        help_text='List of categories: ["technical", "leadership", "mentorship", "executive"]'
    )
    description = models.TextField(blank=True)
    duration_months = models.IntegerField(validators=[MinValueValidator(1)])
    default_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='USD')
    outcomes = models.JSONField(default=list, blank=True, help_text='List of learning outcomes and goals')
    structure = models.JSONField(default=dict, blank=True, help_text='Default structure with modules and milestones')
    missions_registry_link = models.URLField(blank=True, help_text='Link to Missions/Competency registry')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'programs'
        ordering = ['-created_at']
    
    def __str__(self):
        if self.categories:
            cats = ', '.join(self.categories)
            return f"{self.name} ({cats})"
        return f"{self.name} ({self.category})"


class Track(models.Model):
    """Track model - specialization within a program."""
    TRACK_TYPE_CHOICES = [
        ('primary', 'Primary Track'),  # Defenders, Offensive, GRC, Innovation
        ('cross_track', 'Cross-Track Program'),  # Entrepreneurship, Soft Skills, etc.
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='tracks')
    name = models.CharField(max_length=200)
    key = models.CharField(max_length=100, db_index=True)
    track_type = models.CharField(max_length=20, choices=TRACK_TYPE_CHOICES, default='primary', null=True, blank=True)
    description = models.TextField(blank=True)
    competencies = models.JSONField(default=dict, blank=True)
    missions = models.JSONField(default=list, blank=True, help_text='List of mission IDs from registry')
    director = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='directed_tracks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tracks'
        unique_together = ['program', 'key']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.program.name})"


class Milestone(models.Model):
    """Milestone model - major checkpoint within a track."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0, help_text='Order within track')
    duration_weeks = models.IntegerField(validators=[MinValueValidator(1)], null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestones'
        ordering = ['track', 'order']
        unique_together = ['track', 'order']
    
    def __str__(self):
        return f"{self.name} ({self.track.name})"


class Module(models.Model):
    """Module model - content unit within a milestone."""
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('article', 'Article'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('lab', 'Lab'),
        ('workshop', 'Workshop'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='modules')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='video')
    content_url = models.URLField(blank=True, help_text='URL to content resource')
    order = models.IntegerField(default=0, help_text='Order within milestone')
    estimated_hours = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    skills = models.JSONField(default=list, blank=True, help_text='List of skills/tags: ["Risk Analysis", "Team Management"]')
    # Many-to-Many relationship for cross-track content
    applicable_tracks = models.ManyToManyField(
        Track,
        related_name='modules',
        blank=True,
        help_text='Tracks this module applies to (for cross-track content)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'modules'
        ordering = ['milestone', 'order']
        unique_together = ['milestone', 'order']
    
    def __str__(self):
        return f"{self.name} ({self.milestone.name})"


class Specialization(models.Model):
    """Specialization model - sub-track within a track."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='specializations')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    missions = models.JSONField(default=list, blank=True)
    duration_weeks = models.IntegerField(validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'specializations'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.track.name})"


class Cohort(models.Model):
    """Cohort model - instance of a track with calendar and enrollment."""
    MODE_CHOICES = [
        ('onsite', 'Onsite'),
        ('virtual', 'Virtual'),
        ('hybrid', 'Hybrid'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('running', 'Running'),
        ('closing', 'Closing'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='cohorts')
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='virtual')
    seat_cap = models.IntegerField(validators=[MinValueValidator(1)])
    mentor_ratio = models.FloatField(
        default=0.1,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text='Mentors per student ratio'
    )
    coordinator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coordinated_cohorts',
        help_text='Program coordinator for this cohort'
    )
    calendar_id = models.UUIDField(null=True, blank=True)
    calendar_template_id = models.UUIDField(null=True, blank=True, help_text='Reference to calendar template used')
    seat_pool = models.JSONField(
        default=dict,
        blank=True,
        help_text='Seat pool breakdown: {paid: count, scholarship: count, sponsored: count}'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cohorts'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} ({self.track.name})"
    
    @property
    def seat_utilization(self):
        """Calculate seat utilization percentage."""
        enrolled_count = self.enrollments.filter(status='active').count()
        return (enrolled_count / self.seat_cap * 100) if self.seat_cap > 0 else 0
    
    @property
    def completion_rate(self):
        """Calculate completion rate percentage."""
        total_enrolled = self.enrollments.filter(status__in=['active', 'completed']).count()
        completed = self.enrollments.filter(status='completed').count()
        return (completed / total_enrolled * 100) if total_enrolled > 0 else 0


class Enrollment(models.Model):
    """Enrollment model - student enrollment in a cohort."""
    ENROLLMENT_TYPE_CHOICES = [
        ('self', 'Self-enroll'),
        ('sponsor', 'Sponsor assign'),
        ('invite', 'Invite'),
        ('director', 'Director assign'),
    ]
    
    SEAT_TYPE_CHOICES = [
        ('paid', 'Paid'),
        ('scholarship', 'Scholarship'),
        ('sponsored', 'Sponsored'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('waived', 'Waived'),
    ]
    
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('withdrawn', 'Withdrawn'),
        ('completed', 'Completed'),
        ('incomplete', 'Incomplete'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='enrollments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    org = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments'
    )
    enrollment_type = models.CharField(max_length=20, choices=ENROLLMENT_TYPE_CHOICES, default='self')
    seat_type = models.CharField(max_length=20, choices=SEAT_TYPE_CHOICES, default='paid')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['cohort', 'user']
        ordering = ['-joined_at']
        constraints = [
            models.CheckConstraint(
                check=~models.Q(status='pending_payment', payment_status='paid'),
                name='pending_payment_requires_pending_payment_status'
            ),
        ]
    
    @property
    def track_key(self):
        """Get the track key from the enrollment's cohort's track."""
        if self.cohort and self.cohort.track:
            return self.cohort.track.key
        return None
    
    @property
    def track(self):
        """Get the track object from the enrollment's cohort."""
        if self.cohort:
            return self.cohort.track
        return None
    
    def __str__(self):
        return f"{self.user.email} - {self.cohort.name}"


class CalendarEvent(models.Model):
    """Calendar event model - events within a cohort calendar."""
    TYPE_CHOICES = [
        ('orientation', 'Orientation'),
        ('mentorship', 'Mentorship'),
        ('session', 'Session'),
        ('project_review', 'Project Review'),
        ('submission', 'Submission'),
        ('holiday', 'Holiday'),
        ('closure', 'Closure'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='calendar_events')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_ts = models.DateTimeField()
    end_ts = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC', help_text='Timezone for the event')
    location = models.CharField(max_length=200, blank=True)
    link = models.URLField(blank=True)
    milestone_id = models.UUIDField(null=True, blank=True, help_text='Reference to milestone if this is a milestone event')
    completion_tracked = models.BooleanField(default=False, help_text='Whether completion is tracked for this event')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'calendar_events'
        ordering = ['start_ts']
    
    def __str__(self):
        return f"{self.title} - {self.cohort.name}"


class MentorAssignment(models.Model):
    """Mentor assignment model - mentor assigned to cohort."""
    ROLE_CHOICES = [
        ('primary', 'Primary'),
        ('support', 'Support'),
        ('guest', 'Guest'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='mentor_assignments')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cohort_mentor_assignments')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='support')
    assigned_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'mentor_assignments'
        unique_together = ['cohort', 'mentor']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.mentor.email} - {self.cohort.name} ({self.role})"


class ProgramRule(models.Model):
    """Program rule model - completion criteria and auto-graduation logic."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='rules')
    rule = models.JSONField(
        default=dict,
        help_text='{criteria: {attendance_percent: 80, portfolio_approved: true, feedback_score: 4.0, payment_complete: true}, thresholds: {...}, dependencies: [...]}'
    )
    version = models.IntegerField(default=1)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'program_rules'
        ordering = ['-version', '-created_at']
    
    def __str__(self):
        return f"Rule v{self.version} - {self.program.name}"


class Waitlist(models.Model):
    """Waitlist model - FIFO queue for cohort enrollment when seats are full."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='waitlist_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='waitlist_entries')
    org = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waitlist_entries'
    )
    position = models.IntegerField(help_text='Position in queue (1-based, FIFO)')
    seat_type = models.CharField(max_length=20, choices=Enrollment.SEAT_TYPE_CHOICES, default='paid')
    enrollment_type = models.CharField(max_length=20, choices=Enrollment.ENROLLMENT_TYPE_CHOICES, default='self')
    added_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True, help_text='When user was notified of seat availability')
    promoted_at = models.DateTimeField(null=True, blank=True, help_text='When user was promoted from waitlist')
    active = models.BooleanField(default=True, help_text='False if user was promoted or removed')
    
    class Meta:
        db_table = 'waitlist'
        unique_together = ['cohort', 'user', 'active']
        ordering = ['position', 'added_at']
        indexes = [
            models.Index(fields=['cohort', 'active', 'position']),
        ]
    
    def __str__(self):
        return f"Waitlist #{self.position} - {self.user.email} - {self.cohort.name}"


class Certificate(models.Model):
    """Certificate model - issued certificates for completed enrollments."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='certificate')
    file_uri = models.URLField(blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'certificates'
        ordering = ['-issued_at']
    
    def __str__(self):
        return f"Certificate - {self.enrollment.user.email} - {self.enrollment.cohort.name}"


class MentorshipCycle(models.Model):
    """Mentorship cycle configuration for cohorts."""
    FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('bi-weekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
    ]

    PROGRAM_TYPE_CHOICES = [
        ('builders', 'Builders'),
        ('leaders', 'Leaders'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cohort = models.OneToOneField(Cohort, on_delete=models.CASCADE, related_name='mentorship_cycle')
    duration_weeks = models.PositiveIntegerField(default=12, help_text='Total duration of the mentorship cycle in weeks')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='weekly')
    milestones = models.JSONField(default=list, blank=True, help_text='List of milestone descriptions')
    goals = models.JSONField(default=list, blank=True, help_text='List of learning goals')
    program_type = models.CharField(max_length=20, choices=PROGRAM_TYPE_CHOICES, default='builders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentorship_cycles'
        ordering = ['-created_at']

    def __str__(self):
        return f"Mentorship Cycle - {self.cohort.name} ({self.program_type})"

