"""
Profiler Engine models - Future-You persona generation and track recommendation.
Comprehensive profiling system with aptitude and behavioral assessments.
"""
import uuid
import json
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class ProfilerSession(models.Model):
    """Profiler session for user assessment."""
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('in_progress', 'In Progress'),
        ('aptitude_complete', 'Aptitude Complete'),
        ('behavioral_complete', 'Behavioral Complete'),
        ('current_self_complete', 'Current Self Complete'),
        ('future_you_complete', 'Future You Complete'),
        ('finished', 'Finished'),
        ('locked', 'Locked'),  # One-time attempt completed
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profiler_sessions',
        db_index=True
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='started',
        db_index=True
    )
    session_token = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text='Unique session token for Redis tracking'
    )
    current_section = models.CharField(
        max_length=50,
        default='welcome',
        help_text='Current section: welcome, instructions, aptitude, behavioral, results'
    )
    current_question_index = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    
    # Assessment data
    aptitude_responses = models.JSONField(
        default=dict,
        blank=True,
        help_text='Aptitude test responses: {question_id: answer, ...}'
    )
    behavioral_responses = models.JSONField(
        default=dict,
        blank=True,
        help_text='Behavioral test responses: {question_id: answer, ...}'
    )
    current_self_assessment = models.JSONField(
        default=dict,
        blank=True,
        help_text='{skills: {...}, behaviors: {...}, learning_style: {...}}'
    )
    futureyou_persona = models.JSONField(
        default=dict,
        blank=True,
        help_text='{name: "Cyber Sentinel", archetype: "Defender", skills: [...]}'
    )
    
    # Results and analysis
    aptitude_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Overall aptitude score 0-100'
    )
    behavioral_profile = models.JSONField(
        default=dict,
        blank=True,
        help_text='Behavioral analysis: {traits: {...}, strengths: [...], areas_for_growth: [...]}'
    )
    strengths = models.JSONField(
        default=list,
        blank=True,
        help_text='Identified strengths: ["analytical thinking", "problem solving", ...]'
    )
    recommended_track_id = models.UUIDField(null=True, blank=True, db_index=True)
    track_confidence = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text='Confidence score 0.0-1.0'
    )
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_activity = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(default=0, help_text='Total time spent in seconds')
    
    # Lock mechanism (one-time attempt)
    is_locked = models.BooleanField(default=False, db_index=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    admin_reset_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profiler_resets',
        help_text='Admin who reset this session'
    )
    
    class Meta:
        db_table = 'profilersessions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'is_locked']),
            models.Index(fields=['session_token']),
        ]
    
    def __str__(self):
        return f"Profiler Session: {self.user.email} - {self.status}"
    
    def lock(self):
        """Lock the session after completion (one-time attempt)."""
        self.is_locked = True
        self.status = 'locked'
        self.locked_at = timezone.now()
        self.completed_at = timezone.now()
        self.save()
    
    def can_resume(self):
        """Check if session can be resumed."""
        return not self.is_locked and self.status not in ['finished', 'locked']


class ProfilerQuestion(models.Model):
    """Profiling questions for aptitude and behavioral tests."""
    QUESTION_TYPES = [
        ('aptitude', 'Aptitude'),
        ('behavioral', 'Behavioral'),
    ]
    
    ANSWER_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('scale', 'Scale (1-10)'),
        ('likert', 'Likert Scale'),
        ('text', 'Text Response'),
        ('boolean', 'Yes/No'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, db_index=True)
    answer_type = models.CharField(max_length=20, choices=ANSWER_TYPES)
    question_text = models.TextField()
    question_order = models.IntegerField(default=0, db_index=True)
    
    # Options for multiple choice questions
    options = models.JSONField(
        default=list,
        blank=True,
        help_text='For multiple choice: ["Option 1", "Option 2", ...]'
    )
    
    # Scoring
    correct_answer = models.JSONField(
        null=True,
        blank=True,
        help_text='Correct answer for aptitude questions'
    )
    points = models.IntegerField(default=1, help_text='Points awarded for correct answer')
    
    # Category/tags for analysis
    category = models.CharField(max_length=100, blank=True, db_index=True)
    tags = models.JSONField(default=list, blank=True, help_text='Tags: ["networking", "problem-solving"]')
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profilerquestions'
        ordering = ['question_type', 'question_order']
        indexes = [
            models.Index(fields=['question_type', 'is_active']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.question_type}: {self.question_text[:50]}..."


class ProfilerAnswer(models.Model):
    """Individual answers in profiler session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ProfilerSession,
        on_delete=models.CASCADE,
        related_name='answers',
        db_index=True
    )
    question = models.ForeignKey(
        ProfilerQuestion,
        on_delete=models.CASCADE,
        related_name='answers',
        db_index=True,
        null=True,  # Temporarily nullable for migration, will be made required later
        blank=True
    )
    question_key = models.CharField(
        max_length=255,
        db_index=True,
        help_text='e.g., "skills.networking", "behaviors.discipline"'
    )
    answer = models.JSONField(
        help_text='Answer data: {value: 7, text: "Experienced with Wireshark"}'
    )
    is_correct = models.BooleanField(null=True, blank=True, help_text='For aptitude questions')
    points_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profileranswers'
        indexes = [
            models.Index(fields=['session', 'question']),
            models.Index(fields=['session', 'question_key']),
        ]
        unique_together = [['session', 'question']]
    
    def __str__(self):
        return f"Answer: {self.question_key} = {self.answer}"


class ProfilerResult(models.Model):
    """Comprehensive profiling results and analysis."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(
        ProfilerSession,
        on_delete=models.CASCADE,
        related_name='result',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profiler_results',
        db_index=True
    )
    
    # Overall scores
    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Overall profiling score 0-100'
    )
    aptitude_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    behavioral_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Detailed analysis
    aptitude_breakdown = models.JSONField(
        default=dict,
        help_text='Category scores: {networking: 85, security: 72, ...}'
    )
    behavioral_traits = models.JSONField(
        default=dict,
        help_text='Behavioral analysis: {leadership: 8, teamwork: 9, ...}'
    )
    
    # Recommendations
    strengths = models.JSONField(default=list, help_text='Identified strengths')
    areas_for_growth = models.JSONField(default=list, help_text='Areas for improvement')
    recommended_tracks = models.JSONField(
        default=list,
        help_text='Recommended tracks: [{track_id: "...", confidence: 0.85, reason: "..."}]'
    )
    learning_path_suggestions = models.JSONField(
        default=list,
        help_text='Suggested learning paths'
    )
    
    # OCH System Mapping
    och_mapping = models.JSONField(
        default=dict,
        help_text='Mapping to OCH system: {tier: 1, foundations: [...], tracks: [...]}'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'profilerresults'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session']),
        ]
    
    def __str__(self):
        return f"Profiler Result: {self.user.email} - Score: {self.overall_score}"
