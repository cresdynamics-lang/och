"""
Mentor models for Ongóza Cyber Hub.
Complete mentor dashboard system with student assignments and feedback tracking.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Mentor(models.Model):
    """
    Extended mentor profile with expertise, capacity, and availability.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_profile'
    )

    # Profile
    mentor_slug = models.SlugField(unique=True, max_length=100, help_text="URL-friendly identifier")
    bio = models.TextField(blank=True, null=True, help_text="Mentor biography and experience")

    # Expertise and capacity
    expertise_tracks = models.JSONField(
        default=list,
        blank=True,
        help_text='["defender", "grc", "offensive", "innovation", "leadership"]'
    )
    max_students_per_cohort = models.IntegerField(default=25, help_text="Maximum students mentor can handle")

    # Availability (Google Calendar integration)
    availability_calendar = models.JSONField(
        default=dict,
        blank=True,
        help_text='Google Calendar integration data'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentors'
        ordering = ['user__first_name', 'user__last_name']
        indexes = [
            models.Index(fields=['mentor_slug']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.mentor_slug})"

    def get_assigned_students_count(self):
        """Get current number of assigned students."""
        return self.mentor_assignments.filter(is_active=True).count()

    def get_available_capacity(self):
        """Get remaining capacity for new students."""
        return max(0, self.max_students_per_cohort - self.get_assigned_students_count())

    def is_at_capacity(self):
        """Check if mentor is at maximum capacity."""
        return self.get_assigned_students_count() >= self.max_students_per_cohort


class MentorStudentAssignment(models.Model):
    """
    Mentor-student assignments with track-specific relationships.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    mentor = models.ForeignKey(
        Mentor,
        on_delete=models.CASCADE,
        related_name='dashboard_assignments'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboard_mentor_assignments'
    )

    # Assignment details
    track_slug = models.CharField(max_length=50, help_text="Track: defender, grc, offensive, etc.")
    assigned_at = models.DateTimeField(auto_now_add=True)
    last_interaction_at = models.DateTimeField(null=True, blank=True)

    # Performance tracking
    feedback_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Average rating from student (1-5)"
    )

    # Status
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'mentor_student_assignments'
        unique_together = ['mentor', 'student', 'track_slug']
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['mentor', 'is_active']),
            models.Index(fields=['student', 'is_active']),
            models.Index(fields=['track_slug']),
            models.Index(fields=['assigned_at']),
        ]

    def __str__(self):
        return f"{self.mentor} → {self.student} ({self.track_slug})"

    def update_last_interaction(self):
        """Update last interaction timestamp."""
        self.last_interaction_at = timezone.now()
        self.save(update_fields=['last_interaction_at'])


class MentorStudentNote(models.Model):
    """
    Mentor feedback and notes on students.
    """
    NOTE_TYPES = [
        ('strength', 'Strength'),
        ('improvement', 'Improvement Area'),
        ('action_item', 'Action Item'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    mentor = models.ForeignKey(
        Mentor,
        on_delete=models.CASCADE,
        related_name='dashboard_notes'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboard_mentor_notes'
    )

    # Note details
    track_slug = models.CharField(max_length=50, null=True, blank=True)
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    content = models.TextField(help_text="Detailed feedback or note content")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mentor_student_notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mentor']),
            models.Index(fields=['student']),
            models.Index(fields=['note_type']),
            models.Index(fields=['track_slug']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.mentor} note on {self.student}: {self.note_type}"


class MentorSession(models.Model):
    """
    Scheduled 1:1 mentor sessions.
    """
    SESSION_STATUS = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    mentor = models.ForeignKey(
        Mentor,
        on_delete=models.CASCADE,
        related_name='dashboard_sessions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboard_mentor_sessions'
    )

    # Session details
    track_slug = models.CharField(max_length=50, help_text="Track being discussed")
    title = models.CharField(max_length=200, help_text="Session title/agenda")
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='scheduled')

    # Meeting details
    meeting_url = models.URLField(null=True, blank=True, help_text="Zoom/Google Meet link")
    notes = models.TextField(blank=True, null=True, help_text="Session preparation notes")

    # Outcome tracking
    completed_at = models.DateTimeField(null=True, blank=True)
    student_feedback = models.TextField(blank=True, null=True)
    mentor_feedback = models.TextField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentor_sessions'
        ordering = ['scheduled_at']
        indexes = [
            models.Index(fields=['mentor', 'scheduled_at']),
            models.Index(fields=['student', 'scheduled_at']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_at']),
        ]

    def __str__(self):
        return f"{self.mentor} ↔ {self.student} ({self.scheduled_at.date()})"

    def mark_completed(self, student_feedback=None, mentor_feedback=None):
        """Mark session as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if student_feedback:
            self.student_feedback = student_feedback
        if mentor_feedback:
            self.mentor_feedback = mentor_feedback
        self.save()

    def is_upcoming(self):
        """Check if session is upcoming."""
        return self.status in ['scheduled', 'confirmed'] and self.scheduled_at > timezone.now()

    def is_today(self):
        """Check if session is scheduled for today."""
        today = timezone.now().date()
        return self.scheduled_at.date() == today and self.is_upcoming()
