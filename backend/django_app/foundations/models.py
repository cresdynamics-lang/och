"""
Tier 1 Foundations models for OCH.
Tracks user progress through the Foundations orientation tier.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class FoundationsModule(models.Model):
    """
    Foundations orientation modules (Tier 1).
    These are the orientation content items that users must complete.
    """
    MODULE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('interactive', 'Interactive'),
        ('assessment', 'Assessment'),
        ('reflection', 'Reflection'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    module_type = models.CharField(max_length=20, choices=MODULE_TYPE_CHOICES, default='video')
    
    # Content
    video_url = models.URLField(blank=True, null=True, help_text='Video URL for video modules')
    diagram_url = models.URLField(blank=True, null=True, help_text='Diagram/image URL')
    content = models.TextField(blank=True, help_text='Markdown or HTML content')
    
    # Ordering
    order = models.IntegerField(default=0, help_text='Display order')
    is_mandatory = models.BooleanField(default=True, help_text='Must be completed to finish Foundations')
    
    # Metadata
    estimated_minutes = models.IntegerField(default=10, validators=[MinValueValidator(1)])
    tags = models.JSONField(default=list, blank=True, help_text='Tags for categorization')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'foundations_modules'
        ordering = ['order']
        verbose_name = 'Foundations Module'
        verbose_name_plural = 'Foundations Modules'
    
    def __str__(self):
        return f"{self.title} ({self.module_type})"


class FoundationsProgress(models.Model):
    """
    User progress through Tier 1 Foundations.
    Tracks completion of each module and overall Foundations completion.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='foundations_progress',
        db_index=True
    )
    
    # Overall status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Module completion tracking (JSON: {module_id: {completed: bool, watch_percentage: float, completed_at: datetime}})
    modules_completed = models.JSONField(
        default=dict,
        blank=True,
        help_text='Module completion data: {module_id: {completed: bool, watch_percentage: float, completed_at: iso}}'
    )
    
    # Assessment data
    assessment_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Orientation assessment score'
    )
    assessment_attempts = models.IntegerField(default=0)
    
    # Reflection data
    goals_reflection = models.TextField(
        blank=True,
        help_text='User-submitted goals and reflection text'
    )
    value_statement = models.TextField(
        blank=True,
        help_text='Value statement from profiler (synced)'
    )
    
    # Track confirmation
    confirmed_track_key = models.CharField(
        max_length=50,
        blank=True,
        help_text='User-confirmed track (from profiler recommendation or override)'
    )
    track_override = models.BooleanField(
        default=False,
        help_text='User overrode profiler recommendation'
    )
    
    # Time tracking
    total_time_spent_minutes = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    transitioned_to_tier2_at = models.DateTimeField(null=True, blank=True)
    
    # Analytics
    drop_off_module_id = models.UUIDField(null=True, blank=True, help_text='Module where user dropped off')
    last_accessed_module_id = models.UUIDField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'foundations_progress'
        verbose_name = 'Foundations Progress'
        verbose_name_plural = 'Foundations Progress'
    
    def __str__(self):
        return f"{self.user.email} - Foundations ({self.status}, {self.completion_percentage}%)"
    
    def calculate_completion(self):
        """Calculate completion percentage based on mandatory modules."""
        mandatory_modules = FoundationsModule.objects.filter(is_mandatory=True, is_active=True)
        
        if not mandatory_modules.exists():
            return 100.0
        
        completed_count = 0
        for module in mandatory_modules:
            module_data = self.modules_completed.get(str(module.id), {})
            if module_data.get('completed', False):
                completed_count += 1
        
        percentage = (completed_count / mandatory_modules.count()) * 100
        self.completion_percentage = round(percentage, 2)
        return self.completion_percentage
    
    def is_complete(self):
        """Check if Foundations is complete (all mandatory modules + assessment + reflection)."""
        mandatory_modules = FoundationsModule.objects.filter(is_mandatory=True, is_active=True)
        
        # Check all mandatory modules are completed
        for module in mandatory_modules:
            module_data = self.modules_completed.get(str(module.id), {})
            if not module_data.get('completed', False):
                return False
        
        # Check assessment is completed (if there's an assessment module)
        assessment_modules = FoundationsModule.objects.filter(
            module_type='assessment',
            is_mandatory=True,
            is_active=True
        )
        if assessment_modules.exists() and self.assessment_score is None:
            return False
        
        # Check reflection is submitted (if there's a reflection module)
        reflection_modules = FoundationsModule.objects.filter(
            module_type='reflection',
            is_mandatory=True,
            is_active=True
        )
        if reflection_modules.exists() and not self.goals_reflection:
            return False
        
        return True
