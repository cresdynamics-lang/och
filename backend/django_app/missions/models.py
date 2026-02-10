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
    
    TIER_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('mastery', 'Mastery'),
    ]
    
    TRACK_CHOICES = [
        ('defender', 'Defender'),
        ('offensive', 'Offensive'),
        ('grc', 'GRC'),
        ('innovation', 'Innovation'),
        ('leadership', 'Leadership'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, blank=True, null=True, help_text='Unique mission code like "SIEM-03"')
    track_id = models.CharField(max_length=50, blank=True, null=True, help_text='Track identifier like SOC_DEFENSE')
    track = models.CharField(max_length=20, choices=TRACK_CHOICES, blank=True, null=True, db_index=True, help_text='Track: defender/offensive/grc/innovation/leadership')
    module_id = models.UUIDField(blank=True, null=True, help_text='UUID of curriculum module')
    title = models.CharField(max_length=255)
    description = models.TextField()
    story = models.TextField(blank=True, help_text='Mission narrative/story context')
    story_narrative = models.TextField(blank=True, help_text='Alternative field for story narrative')
    objectives = models.JSONField(default=list, blank=True, help_text='Array of mission objectives/learning outcomes')
    competencies = models.JSONField(default=list, help_text='Array of competencies required/assessed')
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, blank=True, null=True, db_index=True, help_text='Tier: beginner/intermediate/advanced/mastery')
    mission_type = models.CharField(max_length=20, choices=MISSION_TYPE_CHOICES, default='intermediate')
    requires_mentor_review = models.BooleanField(default=False, help_text='Requires $7 tier mentor review')
    requires_lab_integration = models.BooleanField(default=False, help_text='Linked to external lab')
    estimated_duration_min = models.IntegerField(validators=[MinValueValidator(1)])
    time_constraint_hours = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)], help_text='Time-bound mission deadline in hours (24-168 hours)')
    skills_tags = models.JSONField(default=list, help_text='Array of skill tags')
    subtasks = models.JSONField(default=list, help_text='Array of mission subtasks with id, title, description, order_index')
    recipe_recommendations = models.JSONField(default=list, blank=True, help_text='Array of recipe slugs/IDs recommended for this mission')
    success_criteria = models.JSONField(default=dict, blank=True, help_text='Success criteria: {technical_accuracy: str, completeness: str, best_practices: str, documentation: str}')
    rubric_id = models.UUIDField(null=True, blank=True, db_index=True, help_text='UUID of rubric for scoring')
    branching_paths = models.JSONField(default=dict, blank=True, help_text='Decision points structure: {subtask_id: {decision_id: str, choices: [], consequences: {}}}')
    hints = models.JSONField(default=list, blank=True, help_text='Hints structure: [{subtask_id: int, hint_text: str, hint_level: int}]')
    # Mastery-level enhancements
    templates = models.JSONField(default=list, blank=True, help_text='Professional templates: [{type: str, url: str, description: str}]')
    ideal_path = models.JSONField(default=dict, blank=True, help_text='Ideal mission path for comparison: {subtask_id: {decision_id: str, choice_id: str, rationale: str}}')
    presentation_required = models.BooleanField(default=False, help_text='If True, mission requires presentation submission (Mastery/Capstone)')
    # Escalation events for Mastery missions
    escalation_events = models.JSONField(default=list, blank=True, help_text='Escalation events: [{subtask_id: int, event_type: str, description: str, triggers: [], consequences: {}}]')
    # Environmental cues for Mastery missions
    environmental_cues = models.JSONField(default=list, blank=True, help_text='Environmental cues: [{subtask_id: int, cue_type: str, description: str, location: str, significance: str}]')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_missions', db_column='created_by', to_field='uuid_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'missions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['track_id', 'is_active']),
            models.Index(fields=['track', 'tier', 'is_active']),
            models.Index(fields=['mission_type', 'difficulty']),
            models.Index(fields=['code']),
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


class MissionArtifact(models.Model):
    """Uploaded artifacts (files/screenshots) for mission submissions"""

    ARTIFACT_TYPE_CHOICES = [
        ('screenshot', 'Screenshot'),
        ('document', 'Document'),
        ('code', 'Code File'),
        ('log', 'Log File'),
        ('video', 'Video'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(MissionSubmission, on_delete=models.CASCADE, related_name='artifacts')
    file_url = models.URLField(max_length=500, help_text='URL to uploaded file')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, choices=ARTIFACT_TYPE_CHOICES, default='other')
    file_size = models.IntegerField(help_text='File size in bytes', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mission_artifacts'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} ({self.submission.id})"


class AIFeedback(models.Model):
    """AI-generated feedback for mission submissions"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(MissionSubmission, on_delete=models.CASCADE, related_name='ai_feedback')
    feedback_text = models.TextField(help_text='AI-generated feedback', blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    strengths = models.JSONField(default=list, help_text='Identified strengths')
    gaps = models.JSONField(default=list, help_text='Identified gaps')
    suggestions = models.JSONField(default=list, help_text='Suggested improvements')
    improvements = models.JSONField(default=list, help_text='Legacy improvements field')
    competencies_detected = models.JSONField(default=list, help_text='Competencies detected in submission')
    full_feedback = models.JSONField(default=dict, help_text='Full structured feedback')
    generated_at = models.DateTimeField(auto_now_add=True)
    model_version = models.CharField(max_length=50, blank=True, help_text='AI model version used')

    class Meta:
        db_table = 'ai_feedback'
        ordering = ['-generated_at']

    def __str__(self):
        return f"AI Feedback for {self.submission.id}"