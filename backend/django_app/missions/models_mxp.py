"""
MXP Mission Progress and Files Models
Additional models for full MXP implementation
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class MissionProgress(models.Model):
    """User mission progress tracking with subtasks."""
    STATUS_CHOICES = [
        ('locked', 'Locked'),
        ('available', 'Available'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('ai_reviewed', 'AI Reviewed'),
        ('mentor_review', 'Mentor Review'),
        ('approved', 'Approved'),
        ('failed', 'Failed'),
        ('revision_requested', 'Revision Requested'),
    ]
    
    FINAL_STATUS_CHOICES = [
        ('pass', 'Pass'),
        ('fail', 'Fail'),
        ('pending', 'Pending'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mxp_mission_progress',
        db_index=True
    )
    mission = models.ForeignKey(
        'missions.Mission',
        on_delete=models.CASCADE,
        related_name='progress_entries',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='locked',
        db_index=True
    )
    current_subtask = models.IntegerField(
        default=1,
        help_text='Current subtask number (1-indexed)'
    )
    subtasks_progress = models.JSONField(
        default=dict,
        blank=True,
        help_text='{1: {completed: true, evidence: []}, ...}'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
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
    final_status = models.CharField(
        max_length=20,
        choices=FINAL_STATUS_CHOICES,
        null=True,
        blank=True
    )
    reflection = models.TextField(blank=True, help_text='Student reflection on mission')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mission_progress'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['mission', 'status']),
            models.Index(fields=['user', 'mission']),
            models.Index(fields=['user', 'final_status']),
        ]
        unique_together = [['mission', 'user']]
    
    def __str__(self):
        return f"Progress: {self.mission.code} by {self.user.email} ({self.status})"


class MissionFile(models.Model):
    """Mission evidence files uploaded by students."""
    FILE_TYPE_CHOICES = [
        ('log', 'Log File'),
        ('screenshot', 'Screenshot'),
        ('report', 'Report'),
        ('code', 'Code'),
        ('video', 'Video'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mission_progress = models.ForeignKey(
        MissionProgress,
        on_delete=models.CASCADE,
        related_name='files',
        db_index=True
    )
    subtask_number = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Subtask number this file belongs to'
    )
    file_url = models.URLField(max_length=500, help_text='S3 or storage URL')
    file_type = models.CharField(
        max_length=50,
        choices=FILE_TYPE_CHOICES,
        default='other'
    )
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(null=True, blank=True, help_text='Size in bytes')
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional file metadata'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mission_files'
        indexes = [
            models.Index(fields=['mission_progress', 'subtask_number']),
            models.Index(fields=['mission_progress', 'uploaded_at']),
        ]
    
    def __str__(self):
        return f"File: {self.filename} (Subtask {self.subtask_number})"

