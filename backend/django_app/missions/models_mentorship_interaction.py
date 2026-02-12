"""
Mentorship Interaction Model for Mastery Tracks
Multi-phase reviews, audio/video feedback, and mentor scoring meetings.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()

# Note: Mission and CapstoneProject models are imported via string reference to avoid circular imports


class MentorshipInteraction(models.Model):
    """Mentorship interactions for Mastery missions and capstone projects"""
    
    INTERACTION_TYPE_CHOICES = [
        ('mission_review', 'Mission Review'),
        ('capstone_review', 'Capstone Review'),
        ('subtask_review', 'Subtask Review'),
        ('decision_review', 'Decision Point Review'),
        ('scoring_meeting', 'Scoring Meeting'),
        ('feedback_session', 'Feedback Session'),
        ('progress_check', 'Progress Check'),
    ]
    
    PHASE_CHOICES = [
        ('investigation', 'Investigation Phase'),
        ('decision_making', 'Decision Making Phase'),
        ('design_remediation', 'Design/Remediation Phase'),
        ('reporting', 'Reporting Phase'),
        ('presentation', 'Presentation Phase'),
        ('final', 'Final Review'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentorship_interactions_given',
        db_column='mentor_id',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentorship_interactions_received',
        db_column='mentee_id',
        db_index=True
    )
    mission = models.ForeignKey(
        'missions.Mission',
        on_delete=models.CASCADE,
        related_name='mentorship_interactions',
        null=True,
        blank=True,
        db_index=True,
        help_text='Related mission (if applicable)'
    )
    capstone_project = models.ForeignKey(
        'missions.CapstoneProject',
        on_delete=models.CASCADE,
        related_name='mentorship_interactions',
        null=True,
        blank=True,
        db_index=True,
        help_text='Related capstone project (if applicable)'
    )
    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_TYPE_CHOICES,
        db_index=True
    )
    phase = models.CharField(
        max_length=20,
        choices=PHASE_CHOICES,
        blank=True,
        null=True,
        help_text='Phase of mission/capstone being reviewed'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        db_index=True
    )
    
    # Multi-phase Review Support
    review_phase = models.IntegerField(
        default=1,
        help_text='Review phase number (1, 2, 3, etc.) for multi-phase reviews'
    )
    total_phases = models.IntegerField(
        default=1,
        help_text='Total number of review phases'
    )
    
    # Written Feedback
    written_feedback = models.TextField(
        blank=True,
        help_text='Written feedback from mentor'
    )
    feedback_per_subtask = models.JSONField(
        default=dict,
        blank=True,
        help_text='Feedback per subtask: {subtask_id: feedback_text}'
    )
    feedback_per_decision = models.JSONField(
        default=dict,
        blank=True,
        help_text='Feedback per decision point: {decision_id: feedback_text}'
    )
    
    # Audio/Video Feedback
    audio_feedback_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to audio feedback recording'
    )
    video_feedback_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to video feedback recording'
    )
    audio_duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text='Duration of audio feedback in seconds'
    )
    video_duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text='Duration of video feedback in seconds'
    )
    
    # Scoring
    rubric_scores = models.JSONField(
        default=dict,
        blank=True,
        help_text='Rubric-based scores: {criterion: score}'
    )
    subtask_scores = models.JSONField(
        default=dict,
        blank=True,
        help_text='Scores per subtask: {subtask_id: score}'
    )
    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Overall score 0-100'
    )
    
    # Scoring Meeting (Optional)
    is_scoring_meeting = models.BooleanField(
        default=False,
        help_text='If True, this is a dedicated scoring meeting'
    )
    meeting_notes = models.TextField(
        blank=True,
        help_text='Notes from scoring meeting'
    )
    meeting_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text='Duration of scoring meeting in minutes'
    )
    
    # Recommendations
    recommended_next_steps = models.JSONField(
        default=list,
        blank=True,
        help_text='Recommended next steps: [{action: str, priority: str, deadline: date}]'
    )
    recommended_recipes = models.JSONField(
        default=list,
        blank=True,
        help_text='Recommended recipes: [recipe_id or slug]'
    )
    
    # Timestamps
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Scheduled time for interaction'
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When interaction started'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='When interaction completed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mentorship_interactions'
        indexes = [
            models.Index(fields=['mentor', 'status']),
            models.Index(fields=['mentee', 'status']),
            models.Index(fields=['mission', 'status']),
            models.Index(fields=['capstone_project', 'status']),
            models.Index(fields=['interaction_type', 'status']),
            models.Index(fields=['phase', 'status']),
            models.Index(fields=['completed_at']),
        ]
    
    def __str__(self):
        return f"{self.mentor.email} → {self.mentee.email} - {self.interaction_type} ({self.status})"
    
    def is_multi_phase(self):
        """Check if this is part of a multi-phase review"""
        return self.total_phases > 1
    
    def get_next_phase(self):
        """Get the next phase number if multi-phase"""
        if self.review_phase < self.total_phases:
            return self.review_phase + 1
        return None
