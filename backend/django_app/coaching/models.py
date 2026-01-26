"""
Coaching OS models - Complete behavioral transformation engine.
Habits, Goals, Reflections, AI Coach sessions with full platform integration.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import Q
from users.models import User


class Habit(models.Model):
    """User habit for daily/weekly practice."""
    TYPE_CHOICES = [
        ('core', 'Core'),
        ('custom', 'Custom'),
    ]
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_habits',
        db_index=True
    )
    name = models.CharField(max_length=255, help_text='"Learn", "Practice", "Reflect", or custom')
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='custom',
        db_index=True
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='daily',
        help_text='Daily or weekly frequency'
    )
    streak = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current streak days'
    )
    longest_streak = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Longest streak achieved'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_habits'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Habit: {self.name} ({self.user.email})"


class HabitLog(models.Model):
    """Log entry for habit completion."""
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
        ('missed', 'Missed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='logs',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_habit_logs',
        db_index=True
    )
    date = models.DateField(db_index=True, help_text='YYYY-MM-DD')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed'
    )
    notes = models.TextField(blank=True, null=True)
    logged_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'coaching_habit_logs'
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['habit', 'date']),
            models.Index(fields=['user', 'date', 'status']),
        ]
        unique_together = [['habit', 'date']]
    
    def __str__(self):
        return f"Log: {self.habit.name} - {self.date} ({self.status})"


class Goal(models.Model):
    """User goal (daily/weekly/monthly) with mentor feedback."""
    TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_goals',
        db_index=True
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Progress percentage 0-100'
    )
    target = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Target value for progress calculation'
    )
    current = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current value toward target'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    mentor_feedback = models.TextField(
        blank=True,
        null=True,
        default='',
        help_text='Mentor feedback (7-tier only)'
    )
    subscription_tier = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Subscription tier when goal was created'
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_goals'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'due_date']),
        ]
    
    def __str__(self):
        return f"Goal: {self.title} ({self.user.email})"


class Reflection(models.Model):
    """User reflection with AI sentiment analysis and insights."""
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_reflections',
        db_index=True
    )
    date = models.DateField(db_index=True, help_text='YYYY-MM-DD')
    content = models.TextField()
    sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        null=True,
        blank=True,
        help_text='User-selected or AI-computed sentiment'
    )
    emotion_tags = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of emotion tags: ["overwhelmed", "confident"]'
    )
    ai_insights = models.TextField(
        blank=True,
        null=True,
        help_text='AI-generated insights'
    )
    word_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Word count for analytics'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_reflections'
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['sentiment']),
        ]
        unique_together = [['user', 'date']]
    
    def __str__(self):
        return f"Reflection: {self.user.email} - {self.date}"


class AICoachSession(models.Model):
    """AI Coach conversation session."""
    SESSION_TYPE_CHOICES = [
        ('habit', 'Habit'),
        ('goal', 'Goal'),
        ('reflection', 'Reflection'),
        ('mission', 'Mission'),
        ('general', 'General'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_coach_sessions',
        db_index=True
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default='general',
        db_index=True
    )
    prompt_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Number of prompts in this session'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_coach_sessions'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'session_type']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"AI Coach Session: {self.user.email} - {self.session_type}"


class AICoachMessage(models.Model):
    """Individual message in AI Coach conversation."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AICoachSession,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        db_index=True
    )
    content = models.TextField()
    context = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Context: habit_help, goal_revision, etc.'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context (habit_id, goal_id, etc.)'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'ai_coach_messages'
        indexes = [
            models.Index(fields=['session', 'created_at']),
            models.Index(fields=['role']),
        ]
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message: {self.role} - {self.session.user.email}"


# Models to replace Supabase functionality for coaching system

class StudentAnalytics(models.Model):
    """Student analytics and performance metrics."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_analytics',
        primary_key=True
    )

    # Performance metrics
    total_missions_completed = models.IntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_time_spent_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    # Track information
    track_code = models.CharField(max_length=50, null=True, blank=True)
    circle_level = models.IntegerField(default=1)

    # Learning metrics
    lessons_completed = models.IntegerField(default=0)
    modules_completed = models.IntegerField(default=0)
    recipes_completed = models.IntegerField(default=0)

    # Community engagement
    posts_count = models.IntegerField(default=0)
    replies_count = models.IntegerField(default=0)
    helpful_votes_received = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coaching_student_analytics'
        verbose_name_plural = 'Student Analytics'

    def __str__(self):
        return f"Analytics for {self.user.email}"


class UserRecipeProgress(models.Model):
    """Track user progress on recipes/micro-skills."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_recipe_progress',
        db_index=True
    )
    recipe_id = models.CharField(max_length=100, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('not_started', 'Not Started'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('mastered', 'Mastered')
        ],
        default='not_started'
    )
    rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    time_spent_minutes = models.IntegerField(default=0)
    attempts_count = models.IntegerField(default=0)
    last_attempted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'coaching_user_recipe_progress'
        unique_together = ['user', 'recipe_id']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['recipe_id', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.recipe_id}: {self.status}"


class UserTrackProgress(models.Model):
    """Track user progress through curriculum tracks."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_track_progress'
    )

    track_code = models.CharField(max_length=50, db_index=True)
    circle_level = models.IntegerField(default=1)

    # Progress metrics
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    modules_completed = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    missions_completed = models.IntegerField(default=0)

    # Performance scores
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    highest_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Readiness metrics
    readiness_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    skills_mastered = models.JSONField(default=dict)
    weak_areas = models.JSONField(default=list)

    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'coaching_user_track_progress'

    def __str__(self):
        return f"{self.user.email} - {self.track_code} (Circle {self.circle_level})"


class UserMissionProgress(models.Model):
    """Track user progress on missions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_mission_progress',
        db_index=True
    )
    mission_id = models.UUIDField(db_index=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('not_started', 'Not Started'),
            ('in_progress', 'In Progress'),
            ('submitted', 'Submitted'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='not_started',
        db_index=True
    )

    # Performance data
    score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    max_score = models.IntegerField(default=100)
    attempts_count = models.IntegerField(default=0)
    time_spent_minutes = models.IntegerField(default=0)

    # Mission metadata
    level = models.CharField(max_length=20, db_index=True)
    skills_tagged = models.JSONField(default=list)

    # Feedback and notes
    instructor_feedback = models.TextField(blank=True)
    user_notes = models.TextField(blank=True)

    # Timestamps
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'coaching_user_mission_progress'
        unique_together = ['user', 'mission_id']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['mission_id', 'status']),
            models.Index(fields=['level', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} - Mission {self.mission_id}: {self.status}"


class CommunityActivitySummary(models.Model):
    """Summary of user community activity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='community_activity'
    )

    # Activity counts
    total_posts = models.IntegerField(default=0)
    total_replies = models.IntegerField(default=0)
    helpful_votes_given = models.IntegerField(default=0)
    helpful_votes_received = models.IntegerField(default=0)

    # Recent activity (last 30 days)
    posts_last_30_days = models.IntegerField(default=0)
    replies_last_30_days = models.IntegerField(default=0)

    # Engagement metrics
    engagement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    activity_streak_days = models.IntegerField(default=0)

    # Community roles/achievements
    badges_earned = models.JSONField(default=list)
    communities_joined = models.JSONField(default=list)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coaching_community_activity_summary'

    def __str__(self):
        return f"Community activity for {self.user.email}"


class MentorshipSession(models.Model):
    """Mentorship session records."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Participants
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_mentorship_sessions',
        db_index=True
    )
    mentor_id = models.UUIDField(null=True, blank=True)

    # Session details
    topic = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('scheduled', 'Scheduled'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
            ('no_show', 'No Show')
        ],
        default='scheduled',
        db_index=True
    )

    # Scheduling
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    actual_duration_minutes = models.IntegerField(null=True, blank=True)

    # Feedback and notes
    user_feedback = models.TextField(blank=True)
    mentor_feedback = models.TextField(blank=True)
    session_notes = models.TextField(blank=True)

    # Ratings
    user_rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    mentor_rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'coaching_mentorship_sessions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['scheduled_at']),
            models.Index(fields=['mentor_id', 'status']),
        ]

    def __str__(self):
        return f"Mentorship: {self.user.email} - {self.topic} ({self.status})"


class CoachingSession(models.Model):
    """AI coaching session records."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_sessions',
        db_index=True
    )

    # Session metadata
    trigger = models.CharField(max_length=50, db_index=True)  # 'daily', 'manual', etc.
    context = models.CharField(max_length=100, db_index=True)
    model_used = models.CharField(max_length=50, default='groq-llama')

    # AI interaction data
    advice = models.JSONField()  # The full coaching response
    complexity_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)

    # User feedback
    user_rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    user_feedback = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coaching_coaching_sessions'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['trigger', 'created_at']),
        ]

    def __str__(self):
        return f"Coaching session for {self.user.email} ({self.trigger})"
