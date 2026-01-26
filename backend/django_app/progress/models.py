"""
Progress tracking models for the Ongoza CyberHub platform.
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Progress(models.Model):
    """
    Progress tracking model for user learning/activity progress.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='progress_records'
    )
    content_id = models.CharField(max_length=255)  # ID reference to content/course/module
    content_type = models.CharField(max_length=100)  # e.g., 'course', 'module', 'lesson'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    completion_percentage = models.IntegerField(default=0)
    score = models.FloatField(null=True, blank=True)
    
    # Metadata
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional data (JSON field for flexibility)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'progress'
        unique_together = ['user', 'content_id', 'content_type']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.content_type}:{self.content_id} ({self.status})"


