"""
Missions MXP models - Mission submissions with AI and mentor review.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class Mission(models.Model):
    """Mission template - MXP Core Model."""
    TRACK_CHOICES = [
        ('defender', 'Defender'),
        ('offensive', 'Offensive'),
        ('grc', 'GRC'),
        ('innovation', 'Innovation'),
        ('leadership', 'Leadership'),
    ]
    
    TIER_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('mastery', 'Mastery'),
        ('capstone', 'Capstone'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('novice', 'Novice'),
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('elite', 'Elite'),
    ]
    
    TYPE_CHOICES = [
        ('lab', 'Lab'),
        ('scenario', 'Scenario'),
        ('project', 'Project'),
        ('capstone', 'Capstone'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text='Mission code like "SIEM-03"')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    story = models.TextField(blank=True, help_text='Narrative context for the mission')
    objectives = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of mission objectives'
    )
    subtasks = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of subtasks with dependencies and evidence_schema'
    )
    track = models.CharField(
        max_length=20,
        choices=TRACK_CHOICES,
        db_index=True,
        help_text='Track: defender, offensive, grc, innovation, leadership'
    )
    tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        db_index=True,
        help_text='Tier: beginner, intermediate, advanced, mastery, capstone'
    )
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        db_index=True
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='lab',
        db_index=True
    )
    track_id = models.UUIDField(null=True, blank=True, db_index=True)
    track_key = models.CharField(max_length=50, blank=True, db_index=True, help_text='Track key like "soc_analyst"')
    estimated_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Estimated minutes to complete'
    )
    est_hours = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Estimated hours to complete (legacy)'
    )
    requires_mentor_review = models.BooleanField(
        default=False,
        help_text='Requires premium mentor review'
    )
    recipe_recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of recipe IDs for micro-skills'
    )
    success_criteria = models.JSONField(
        default=dict,
        blank=True,
        help_text='Rubric criteria for scoring'
    )
    competencies = models.JSONField(
        default=list,
        blank=True,
        help_text='["SIEM", "Alerting", "IR"]'
    )
    requirements = models.JSONField(
        default=dict,
        blank=True,
        help_text='Mission requirements template, file types, etc.'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'missions'
        indexes = [
            models.Index(fields=['difficulty', 'track_id']),
            models.Index(fields=['track_key', 'difficulty']),
        ]
    
    def __str__(self):
        return f"{self.code}: {self.title} ({self.difficulty})"


class MissionSubmission(models.Model):
    """User submission for a mission."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('ai_reviewed', 'AI Reviewed'),
        ('in_ai_review', 'In AI Review'),
        ('mentor_review', 'Mentor Review'),
        ('in_mentor_review', 'In Mentor Review'),
        ('approved', 'Approved'),
        ('failed', 'Failed'),
        ('rejected', 'Rejected'),
        ('revised', 'Revised'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mission_submissions',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    ai_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='AI review score 0-100'
    )
    mentor_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Mentor review score 0-100'
    )
    ai_feedback = models.TextField(blank=True)
    mentor_feedback = models.TextField(
        blank=True,
        help_text='Premium tier only'
    )
    notes = models.TextField(blank=True, help_text='Student notes to reviewer')
    portfolio_item_id = models.UUIDField(null=True, blank=True, help_text='Auto-linked on approval')
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    ai_reviewed_at = models.DateTimeField(null=True, blank=True)
    mentor_reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mission_submissions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['mission', 'status']),
            models.Index(fields=['user', 'mission']),
        ]
        unique_together = [['mission', 'user']]
    
    def __str__(self):
        return f"Submission: {self.mission.code} by {self.user.email} ({self.status})"


class MissionArtifact(models.Model):
    """Artifact (file, link, video) for mission submission."""
    KIND_CHOICES = [
        ('file', 'File'),
        ('github', 'GitHub'),
        ('notebook', 'Notebook'),
        ('video', 'Video'),
        ('screenshot', 'Screenshot'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(
        MissionSubmission,
        on_delete=models.CASCADE,
        related_name='artifacts',
        db_index=True
    )
    kind = models.CharField(
        max_length=20,
        choices=KIND_CHOICES,
        default='file',
        db_index=True,
        help_text='Type of artifact'
    )
    url = models.URLField(max_length=500, help_text='S3 signed URL, GitHub link, or video URL')
    filename = models.CharField(max_length=255, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional metadata')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mission_artifacts'
        indexes = [
            models.Index(fields=['submission', 'kind']),
            models.Index(fields=['submission', 'created_at']),
        ]
    
    def __str__(self):
        return f"Artifact: {self.kind} ({self.submission.mission.code})"


class AIFeedback(models.Model):
    """AI feedback for mission submission."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(
        MissionSubmission,
        on_delete=models.CASCADE,
        related_name='ai_feedback_detail',
        db_index=True
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='AI score 0-100'
    )
    strengths = models.JSONField(default=list, blank=True, help_text='List of strengths')
    gaps = models.JSONField(default=list, blank=True, help_text='List of gaps')
    suggestions = models.JSONField(default=list, blank=True, help_text='List of suggestions')
    competencies_detected = models.JSONField(
        default=list,
        blank=True,
        help_text='Detected competencies with levels'
    )
    full_feedback = models.JSONField(
        default=dict,
        blank=True,
        help_text='Structured feedback (correctness, missed_requirements, etc.)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_feedback'
        indexes = [
            models.Index(fields=['submission']),
        ]
    
    def __str__(self):
        return f"AI Feedback: {self.submission.mission.code} ({self.score}/100)"
