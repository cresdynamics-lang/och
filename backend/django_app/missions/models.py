"""
Missions models for the director dashboard
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Mission(models.Model):
    """Mission model for curriculum assignments"""
    
    DIFFICULTY_CHOICES = [
        (1, 'Beginner'),
        (2, 'Intermediate'), 
        (3, 'Advanced'),
        (4, 'Expert'),
        (5, 'Master'),
    ]
    
    MISSION_TYPE_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('capstone', 'Capstone'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track_id = models.CharField(max_length=50, blank=True, null=True, help_text='Track identifier like SOC_DEFENSE')
    module_id = models.UUIDField(blank=True, null=True, help_text='UUID of curriculum module')
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    mission_type = models.CharField(max_length=20, choices=MISSION_TYPE_CHOICES, default='intermediate')
    requires_mentor_review = models.BooleanField(default=False, help_text='Requires $7 tier mentor review')
    requires_lab_integration = models.BooleanField(default=False, help_text='Linked to external lab')
    estimated_duration_min = models.IntegerField(validators=[MinValueValidator(1)])
    skills_tags = models.JSONField(default=list, help_text='Array of skill tags')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_missions', db_column='created_by', to_field='uuid_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'missions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['track_id', 'is_active']),
            models.Index(fields=['mission_type', 'difficulty']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.title


class MissionAssignment(models.Model):
    """Assignment of missions to cohorts or individual students"""
    
    ASSIGNMENT_TYPE_CHOICES = [
        ('cohort', 'Cohort Assignment'),
        ('individual', 'Individual Assignment'),
    ]
    
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='assignments')
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES)
    cohort_id = models.UUIDField(blank=True, null=True, help_text='Cohort UUID if cohort assignment')
    student = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='mission_assignments', db_column='student_id', to_field='uuid_id')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_missions', db_column='assigned_by', to_field='uuid_id')
    due_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mission_assignments'
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['cohort_id', 'status']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['mission', 'status']),
        ]
    
    def __str__(self):
        target = f"Cohort {self.cohort_id}" if self.cohort_id else f"Student {self.student.email}"
        return f"{self.mission.title} -> {target}"


class MissionSubmission(models.Model):
    """Student submissions for missions"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(MissionAssignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mission_submissions', db_column='student_id', to_field='uuid_id')
    content = models.TextField(help_text='Submission content/description')
    attachments = models.JSONField(default=list, help_text='Array of attachment URLs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    feedback = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions', db_column='reviewed_by', to_field='uuid_id')
    reviewed_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mission_submissions'
        ordering = ['-submitted_at', '-created_at']
        indexes = [
            models.Index(fields=['assignment', 'status']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status', 'submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.assignment.mission.title} - {self.student.email}"