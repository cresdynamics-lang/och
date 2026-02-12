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
        db_column='user_id',
        to_field='uuid_id',
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
    reflection_required = models.BooleanField(default=False, help_text='Mission requires reflection submission')
    reflection_submitted = models.BooleanField(default=False, help_text='Reflection has been submitted')
    decision_paths = models.JSONField(default=dict, blank=True, help_text='User decisions: {decision_id: choice_id, timestamp: iso}')
    time_per_stage = models.JSONField(default=dict, blank=True, help_text='Time spent per subtask: {subtask_id: minutes_spent}')
    hints_used = models.JSONField(default=list, blank=True, help_text='Hints accessed: [{subtask_id: int, hint_level: int, timestamp: iso}]')
    tools_used = models.JSONField(default=list, blank=True, help_text='Tools used during mission: [tool_name]')
    drop_off_stage = models.IntegerField(null=True, blank=True, help_text='Subtask number where user dropped off')
    subtask_scores = models.JSONField(default=dict, blank=True, help_text='Mentor scores per subtask: {subtask_id: score}')
    mentor_recommended_recipes = models.JSONField(default=list, blank=True, help_text='Recipes recommended by mentor: [recipe_id or slug]')
    mentor_reviewed_at = models.DateTimeField(null=True, blank=True, help_text='When mentor completed review')
    # Mastery-level enhancements
    presentation_submitted = models.BooleanField(default=False, help_text='Presentation has been submitted (Mastery/Capstone)')
    presentation_url = models.URLField(blank=True, null=True, max_length=500, help_text='URL to presentation (video, slides, etc.)')
    mentor_feedback_audio_url = models.URLField(blank=True, null=True, max_length=500, help_text='URL to mentor audio feedback')
    mentor_feedback_video_url = models.URLField(blank=True, null=True, max_length=500, help_text='URL to mentor video feedback')
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
    
    def check_subtask_unlockable(self, subtask_id):
        """
        Check if a subtask can be unlocked based on dependencies.
        
        Args:
            subtask_id: The ID or order_index of the subtask to check
            
        Returns:
            dict: {
                'unlockable': bool,
                'reason': str (if not unlockable),
                'dependencies': list of subtask IDs that must be completed first
            }
        """
        if not self.mission.subtasks:
            return {'unlockable': True, 'reason': None, 'dependencies': []}
        
        # Find the subtask in the mission's subtasks array
        subtask = None
        for st in self.mission.subtasks:
            if isinstance(st, dict):
                # Check by id or order_index
                if st.get('id') == subtask_id or st.get('order_index') == subtask_id:
                    subtask = st
                    break
        
        if not subtask:
            return {'unlockable': False, 'reason': 'Subtask not found', 'dependencies': []}
        
        # Check if subtask has dependencies
        dependencies = subtask.get('dependencies', [])
        if not dependencies:
            return {'unlockable': True, 'reason': None, 'dependencies': []}
        
        # Check if all dependencies are completed
        completed_subtasks = self.subtasks_progress or {}
        missing_dependencies = []
        
        for dep_id in dependencies:
            # Check if dependency subtask is completed
            dep_completed = False
            for st_id, st_progress in completed_subtasks.items():
                if isinstance(st_progress, dict):
                    # Match by id or order_index
                    if (str(st_id) == str(dep_id) or 
                        st_progress.get('subtask_id') == dep_id or
                        st_progress.get('order_index') == dep_id):
                        if st_progress.get('completed', False):
                            dep_completed = True
                            break
            
            if not dep_completed:
                missing_dependencies.append(dep_id)
        
        if missing_dependencies:
            return {
                'unlockable': False,
                'reason': f'Complete subtasks {missing_dependencies} first',
                'dependencies': missing_dependencies
            }
        
        return {'unlockable': True, 'reason': None, 'dependencies': []}
    
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

