"""
TalentScope models - Skill signals, behavioral signals, mentor influence, and readiness tracking.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class SkillSignal(models.Model):
    """Skill tracking signals for TalentScope analytics."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='skill_signals',
        db_index=True
    )
    skill_name = models.CharField(max_length=255, db_index=True)
    skill_category = models.CharField(max_length=100, db_index=True)
    mastery_level = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Mastery level 0-100'
    )
    hours_practiced = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    last_practiced = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=50,
        choices=[
            ('mission', 'Mission'),
            ('course', 'Course'),
            ('portfolio', 'Portfolio'),
            ('assessment', 'Assessment'),
            ('mentor_feedback', 'Mentor Feedback'),
        ],
        default='mission'
    )
    source_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ts_skill_signals'
        indexes = [
            models.Index(fields=['mentee', 'skill_category']),
            models.Index(fields=['mentee', 'created_at']),
            models.Index(fields=['skill_name', 'skill_category']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.mentee.email} - {self.skill_name}: {self.mastery_level}%"


class BehaviorSignal(models.Model):
    """Behavioral tracking signals for TalentScope analytics."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='behavior_signals',
        db_index=True
    )
    behavior_type = models.CharField(
        max_length=50,
        choices=[
            ('study_consistency', 'Study Consistency'),
            ('mission_completion', 'Mission Completion'),
            ('reflection_frequency', 'Reflection Frequency'),
            ('engagement_level', 'Engagement Level'),
            ('help_seeking', 'Help Seeking'),
            ('collaboration', 'Collaboration'),
        ],
        db_index=True
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Behavioral metric value'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context (e.g., time_of_day, duration)'
    )
    source = models.CharField(
        max_length=50,
        choices=[
            ('habit_log', 'Habit Log'),
            ('mission', 'Mission'),
            ('reflection', 'Reflection'),
            ('session', 'Mentor Session'),
            ('system', 'System Event'),
        ],
        default='system'
    )
    source_id = models.UUIDField(null=True, blank=True, db_index=True)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ts_behavior_signals'
        indexes = [
            models.Index(fields=['mentee', 'behavior_type']),
            models.Index(fields=['mentee', 'recorded_at']),
            models.Index(fields=['behavior_type', 'recorded_at']),
        ]
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.mentee.email} - {self.behavior_type}: {self.value}"


class MentorInfluence(models.Model):
    """Mentor influence tracking for correlation analysis."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_influences',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='influence_records',
        db_index=True
    )
    session_id = models.UUIDField(null=True, blank=True, db_index=True)
    submission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Submission rate percentage'
    )
    code_quality_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Code quality score 0-100'
    )
    mission_completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Mission completion rate percentage'
    )
    performance_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Overall performance score'
    )
    influence_index = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Mentor influence index 0-10'
    )
    period_start = models.DateTimeField(db_index=True)
    period_end = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ts_mentor_influence'
        indexes = [
            models.Index(fields=['mentee', 'period_start']),
            models.Index(fields=['mentor', 'period_start']),
            models.Index(fields=['mentee', 'mentor']),
        ]
        ordering = ['-period_start']
    
    def __str__(self):
        return f"{self.mentee.email} - Mentor Influence: {self.influence_index or 'N/A'}"


class ReadinessSnapshot(models.Model):
    """Full readiness snapshot including career readiness stage."""
    CAREER_STAGE_CHOICES = [
        ('exploring', 'Exploring'),
        ('building', 'Building'),
        ('emerging', 'Emerging'),
        ('ready', 'Ready'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='readiness_snapshots',
        db_index=True
    )
    core_readiness_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Core readiness score 0-100'
    )
    estimated_readiness_window = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='e.g., "3-6 months"'
    )
    learning_velocity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Learning velocity (points per month)'
    )
    career_readiness_stage = models.CharField(
        max_length=20,
        choices=CAREER_STAGE_CHOICES,
        default='exploring',
        db_index=True
    )
    job_fit_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Job fit score 0-100'
    )
    hiring_timeline_prediction = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='e.g., "4-6 months"'
    )
    breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text='Breakdown by category (technical, practical, theoretical)'
    )
    strengths = models.JSONField(
        default=list,
        blank=True,
        help_text='List of identified strengths'
    )
    weaknesses = models.JSONField(
        default=list,
        blank=True,
        help_text='List of identified weaknesses with priorities'
    )
    missing_skills = models.JSONField(
        default=list,
        blank=True,
        help_text='List of missing skills with priorities'
    )
    improvement_plan = models.JSONField(
        default=list,
        blank=True,
        help_text='Improvement plan items'
    )
    track_benchmarks = models.JSONField(
        default=dict,
        blank=True,
        help_text='Track-specific benchmark data'
    )
    snapshot_date = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ts_readiness_snapshots'
        indexes = [
            models.Index(fields=['mentee', 'snapshot_date']),
            models.Index(fields=['mentee', 'career_readiness_stage']),
            models.Index(fields=['snapshot_date']),
        ]
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"{self.mentee.email} - Readiness: {self.core_readiness_score}% ({self.career_readiness_stage})"
