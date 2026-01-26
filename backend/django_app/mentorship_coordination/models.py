"""
Mentorship Coordination Engine Models.
Connects 1K mentors to 10K mentees with work queues, sessions, and risk signals.
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class MenteeMentorAssignment(models.Model):
    """Mentor-Mentee assignment relationship."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentee_assignments',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_assignments',
        db_index=True
    )
    cohort_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    max_sessions = models.IntegerField(default=12)
    sessions_used = models.IntegerField(default=0)
    mentor_notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'menteementorassignments'
        unique_together = [['mentee', 'mentor']]
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['mentor', 'status']),
        ]
    
    def __str__(self):
        return f"{self.mentee.email} ← {self.mentor.email} ({self.status})"
    
    def save(self, *args, **kwargs):
        """Override save to auto-archive messages when mentorship closes."""
        # Check if status is changing to completed or cancelled
        if self.pk:
            try:
                old_instance = MenteeMentorAssignment.objects.get(pk=self.pk)
                old_status = old_instance.status
                new_status = self.status
                
                # If status changed to completed or cancelled, archive messages
                if old_status != new_status and new_status in ['completed', 'cancelled']:
                    from .models import MentorshipMessage
                    MentorshipMessage.objects.filter(
                        assignment=self,
                        archived=False
                    ).update(
                        archived=True,
                        archived_at=timezone.now()
                    )
            except MenteeMentorAssignment.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)


class MentorSession(models.Model):
    """Mentor-mentee session scheduling."""
    TYPE_CHOICES = [
        ('one_on_one', 'One-on-One'),
        ('group', 'Group'),
        ('capstone_review', 'Capstone Review'),
        ('goal_review', 'Goal Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        MenteeMentorAssignment,
        on_delete=models.CASCADE,
        related_name='sessions',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentee_sessions',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_sessions',
        db_index=True
    )
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    zoom_url = models.URLField(blank=True, help_text='Meeting link (Zoom, Google Meet, etc.)')
    recording_url = models.URLField(blank=True, help_text='Session recording URL')
    transcript_url = models.URLField(blank=True, help_text='Session transcript URL')
    calendar_event_id = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True, help_text='Basic session notes')
    structured_notes = models.JSONField(default=dict, blank=True, help_text='Structured notes with takeaways, action items, etc.')
    outcomes = models.JSONField(default=dict, blank=True)  # {"action_items": [], "new_goals": []}
    attended = models.BooleanField(default=False)
    cancelled = models.BooleanField(default=False, help_text='Session was cancelled')
    cancellation_reason = models.TextField(blank=True, help_text='Reason for cancellation')
    no_show_reason = models.TextField(blank=True)
    is_closed = models.BooleanField(default=False, help_text='Session closed - notes locked')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mentorsessions'
        indexes = [
            models.Index(fields=['mentor', 'start_time']),
            models.Index(fields=['mentee', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.mentee.email} ({self.start_time})"


class MentorWorkQueue(models.Model):
    """Mentor work queue for reviews, feedback, and tasks."""
    TYPE_CHOICES = [
        ('mission_review', 'Mission Review'),
        ('goal_feedback', 'Goal Feedback'),
        ('session_notes', 'Session Notes'),
        ('risk_flag', 'Risk Flag'),
    ]
    
    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='work_queue_items',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_work_items',
        db_index=True
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    reference_id = models.UUIDField(null=True, blank=True)  # mission_id, goal_id, etc
    sla_hours = models.IntegerField(default=48)  # Service Level Agreement
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mentorworkqueue'
        indexes = [
            models.Index(fields=['mentor', 'status']),
            models.Index(fields=['due_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.mentee.email} ({self.status})"


class MentorFlag(models.Model):
    """Risk signals and flags for mentees."""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='raised_flags',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='risk_flags',
        db_index=True
    )
    reason = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    director_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mentorflags'
        indexes = [
            models.Index(fields=['mentee']),
            models.Index(fields=['mentor']),
            models.Index(fields=['resolved']),
        ]
    
    def __str__(self):
        return f"{self.mentee.email} - {self.reason[:50]} ({self.severity})"


class SessionFeedback(models.Model):
    """Mentee feedback on mentorship sessions (Two-Way Feedback System)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        MentorSession,
        on_delete=models.CASCADE,
        related_name='feedback_records',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='session_feedback_given',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='session_feedback_received',
        db_index=True
    )
    # Overall rating (1-5 stars)
    overall_rating = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text='Overall session rating (1-5)'
    )
    # Detailed ratings
    mentor_engagement = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text='Mentor engagement level (1-5)'
    )
    mentor_preparation = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text='Mentor preparation level (1-5)'
    )
    session_value = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text='Session value/helpfulness (1-5)'
    )
    # Text feedback
    strengths = models.TextField(blank=True, help_text='What went well')
    areas_for_improvement = models.TextField(blank=True, help_text='Areas for improvement')
    additional_comments = models.TextField(blank=True, help_text='Additional comments')
    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sessionfeedback'
        indexes = [
            models.Index(fields=['session', 'mentee']),
            models.Index(fields=['mentor']),
            models.Index(fields=['submitted_at']),
        ]
        unique_together = [['session', 'mentee']]  # One feedback per mentee per session
    
    def __str__(self):
        return f"Feedback from {self.mentee.email} on {self.session.title} ({self.overall_rating}/5)"


class SessionAttendance(models.Model):
    """Session attendance tracking with join/leave timestamps."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        MentorSession,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='session_attendances',
        db_index=True
    )
    attended = models.BooleanField(default=False)
    joined_at = models.DateTimeField(null=True, blank=True, help_text='When mentee joined the session')
    left_at = models.DateTimeField(null=True, blank=True, help_text='When mentee left the session')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sessionattendance'
        unique_together = [['session', 'mentee']]
        indexes = [
            models.Index(fields=['session', 'attended']),
            models.Index(fields=['mentee', 'session']),
        ]
    
    def __str__(self):
        return f"{self.mentee.email} - {self.session.title} ({'Attended' if self.attended else 'Absent'})"


class SessionNotes(models.Model):
    """Structured session notes with takeaways and action items."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(
        MentorSession,
        on_delete=models.CASCADE,
        related_name='session_notes_detail',
        db_index=True
    )
    key_takeaways = models.JSONField(default=list, blank=True, help_text='List of key takeaways')
    action_items = models.JSONField(default=list, blank=True, help_text='List of action items with assignees')
    discussion_points = models.TextField(blank=True, help_text='Main discussion points')
    next_steps = models.TextField(blank=True, help_text='Recommended next steps')
    mentor_reflections = models.TextField(blank=True, help_text='Mentor reflections on the session')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sessionnotes'
        indexes = [
            models.Index(fields=['session']),
        ]
    
    def __str__(self):
        return f"Notes for {self.session.title}"


def upload_message_attachment(instance, filename):
    """Upload path for message attachments."""
    return f'mentorship/messages/{instance.message_id}/{filename}'


class MentorshipMessage(models.Model):
    """In-app messaging between mentor and mentee within SMP."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message_id = models.CharField(max_length=100, unique=True, db_index=True, help_text='Unique message identifier')
    assignment = models.ForeignKey(
        MenteeMentorAssignment,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
        help_text='Mentor-mentee assignment this message belongs to'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_mentorship_messages',
        db_index=True,
        help_text='User who sent the message'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_mentorship_messages',
        db_index=True,
        help_text='User who receives the message'
    )
    subject = models.CharField(max_length=200, blank=True, help_text='Message subject (optional)')
    body = models.TextField(help_text='Message content')
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    archived = models.BooleanField(default=False, db_index=True, help_text='Message archived after mentorship closure')
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mentorshipmessages'
        indexes = [
            models.Index(fields=['assignment', 'created_at']),
            models.Index(fields=['sender', 'recipient', 'archived']),
            models.Index(fields=['is_read', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Message from {self.sender.email} to {self.recipient.email} ({self.message_id})"
    
    def save(self, *args, **kwargs):
        if not self.message_id:
            # Generate message_id if not set (use UUID if id not available yet)
            if self.id:
                self.message_id = str(self.id)
            else:
                self.message_id = str(uuid.uuid4())
        super().save(*args, **kwargs)


class MessageAttachment(models.Model):
    """File attachments for mentorship messages."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        MentorshipMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
        db_index=True
    )
    file = models.FileField(upload_to=upload_message_attachment, help_text='Attached file')
    filename = models.CharField(max_length=255, help_text='Original filename')
    file_size = models.IntegerField(help_text='File size in bytes')
    content_type = models.CharField(max_length=100, help_text='MIME type')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messageattachments'
        indexes = [
            models.Index(fields=['message']),
        ]
    
    def __str__(self):
        return f"Attachment: {self.filename} ({self.message.message_id})"


class NotificationLog(models.Model):
    """Audit log for all notifications sent (Email/SMS reminders, milestones, etc.)."""
    TYPE_CHOICES = [
        ('session_reminder', 'Session Reminder'),
        ('feedback_reminder', 'Feedback Reminder'),
        ('milestone_achieved', 'Milestone Achieved'),
        ('session_cancelled', 'Session Cancelled'),
        ('session_rescheduled', 'Session Rescheduled'),
        ('assignment_started', 'Assignment Started'),
        ('assignment_completed', 'Assignment Completed'),
        ('custom', 'Custom Notification'),
    ]
    
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
        ('push', 'Push Notification'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_id = models.CharField(max_length=100, unique=True, db_index=True, help_text='Unique notification identifier')
    assignment = models.ForeignKey(
        MenteeMentorAssignment,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        db_index=True,
        help_text='Mentor-mentee assignment (if applicable)'
    )
    session = models.ForeignKey(
        MentorSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        help_text='Related session (if applicable)'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notification_logs',
        db_index=True,
        help_text='User who receives the notification'
    )
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, db_index=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField(help_text='Notification message content')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True, help_text='When notification was sent')
    delivered_at = models.DateTimeField(null=True, blank=True, help_text='When notification was delivered')
    error_message = models.TextField(blank=True, help_text='Error message if notification failed')
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional metadata (template_id, provider, etc.)')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'notificationlogs'
        indexes = [
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type', 'status']),
            models.Index(fields=['assignment', 'created_at']),
            models.Index(fields=['session', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} to {self.recipient.email} ({self.status})"
    
    def save(self, *args, **kwargs):
        if not self.notification_id:
            self.notification_id = str(self.id)
        super().save(*args, **kwargs)
