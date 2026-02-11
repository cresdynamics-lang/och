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
        to_field='uuid_id',
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
    
    # Telemetry fields
    technical_exposure_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Technical exposure score 0-100'
    )
    work_style_cluster = models.CharField(
        max_length=50,
        blank=True,
        help_text='Work style cluster: "collaborative", "independent", "balanced", etc.'
    )
    scenario_choices = models.JSONField(
        default=list,
        blank=True,
        help_text='Scenario preference choices: [{question_id: "...", selected_option: "A", ...}]'
    )
    difficulty_selection = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ('novice', 'Novice'),
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('elite', 'Elite'),
        ],
        help_text='User-selected difficulty level'
    )
    track_alignment_percentages = models.JSONField(
        default=dict,
        blank=True,
        help_text='Percentage alignment per track: {"defender": 85.5, "offensive": 72.3, ...}'
    )
    result_accepted = models.BooleanField(
        null=True,
        blank=True,
        help_text='Whether user accepted the profiler result (True) or overrode it (False)'
    )
    result_accepted_at = models.DateTimeField(null=True, blank=True, help_text='When result was accepted/overridden')
    foundations_transition_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Timestamp when user transitioned from Profiler to Foundations'
    )
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_activity = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(default=0, help_text='Total time spent in seconds')
    time_spent_per_module = models.JSONField(
        default=dict,
        blank=True,
        help_text='Time spent per module in seconds: {"identity_value": 120, "cyber_aptitude": 300, ...}'
    )
    
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
    
    # Anti-cheat fields
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of session start'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string for device fingerprinting'
    )
    device_fingerprint = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
        help_text='Device/browser fingerprint hash'
    )
    response_times = models.JSONField(
        default=list,
        blank=True,
        help_text='Response times in ms for each question: [{question_id: "...", time_ms: 1234}]'
    )
    suspicious_patterns = models.JSONField(
        default=list,
        blank=True,
        help_text='Detected suspicious patterns: ["too_fast", "identical_responses", ...]'
    )
    anti_cheat_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Anti-cheat confidence score (0-100, higher = more suspicious)'
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


class ProfilerRetakeRequest(models.Model):
    """Request for retaking the profiler assessment (requires admin approval)."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),  # Retake completed
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profiler_retake_requests',
        db_index=True
    )
    original_session = models.ForeignKey(
        ProfilerSession,
        on_delete=models.CASCADE,
        related_name='retake_requests',
        null=True,
        blank=True,
        help_text='Original session that was locked'
    )
    reason = models.TextField(help_text='User-provided reason for retake request')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    
    # Admin fields
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profiler_retake_reviews',
        help_text='Admin who reviewed this request'
    )
    admin_notes = models.TextField(
        blank=True,
        help_text='Admin notes on approval/rejection'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # New session after approval
    new_session = models.ForeignKey(
        ProfilerSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='retake_from_request',
        help_text='New session created after approval'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profilerretakerequests'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Retake Request: {self.user.email} - {self.status}"
    
    def approve(self, admin_user, notes=''):
        """Approve retake request."""
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.admin_notes = notes
        self.reviewed_at = timezone.now()
        self.save()
    
    def reject(self, admin_user, notes=''):
        """Reject retake request."""
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.admin_notes = notes
        self.reviewed_at = timezone.now()
        self.save()
