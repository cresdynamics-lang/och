"""
Curriculum Engine models - Tracks, Modules, Lessons, Missions, and Progress tracking.

This is the "What do I do NEXT?" coordinator that drives students from content → missions → skill mastery.
Core Flow: Profiler → Track → Curriculum loads modules → "Do Mission 2.1 next" → Mission Engine → Progress updates → TalentScope signals
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class CurriculumTrack(models.Model):
    """
    Curriculum track — one of 5 main tracks (Defender, Offensive, GRC, Innovation, Leadership).
    Beginner Level: the first structured learning pathway inside OCH after Foundations.
    This tier moves the learner from orientation → competence-building. Also includes cross-track
    programs (tier 6).
    """
    TIER_CHOICES = [
        (0, 'Foundations - Profiler'),
        (1, 'Foundations'),
        (2, 'Beginner Level'),
        (3, 'Intermediate Level'),
        (4, 'Advanced Level'),
        (5, 'Mastery Level'),
        (6, 'Tier 6 - Cross-Track Programs'),
        (7, 'Tier 7 - Missions & Recipe Engine'),
        (8, 'Tier 8 - Platform Ecosystem'),
        (9, 'Tier 9 - Enterprise & National Intelligence'),
    ]

    LEVEL_CHOICES = [
        ('foundations', 'Foundations'),
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('mastery', 'Mastery'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text='e.g., "SOCDEFENSE", "CLOUDSEC"')
    slug = models.SlugField(unique=True, max_length=50, help_text="'defender', 'offensive', 'grc', 'innovation', 'leadership'")
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, help_text='Display title')
    description = models.TextField(blank=True)
    level = models.CharField(
        max_length=20, choices=LEVEL_CHOICES, default='beginner',
        help_text='Track level: foundations, beginner, intermediate, advanced, mastery'
    )
    thumbnail_url = models.URLField(blank=True, help_text='Track thumbnail image')
    order_number = models.IntegerField(default=1, help_text='Display order')

    # Tier field
    tier = models.IntegerField(
        choices=TIER_CHOICES,
        default=2,
        db_index=True,
        help_text='Academic tier (0-9). Tier 2 = Beginner Level, Tier 3 = Intermediate Level, Tier 4 = Advanced Level, Tier 5 = Mastery Level'
    )

    # Linking to programs.Track — auto-populated by sync signal
    program_track_id = models.UUIDField(null=True, blank=True, help_text='FK to programs.Track (auto-synced)')

    # Track metadata
    icon = models.CharField(max_length=50, blank=True, help_text='Icon identifier e.g., "shield", "cloud"')
    color = models.CharField(max_length=20, blank=True, default='indigo', help_text='Theme color')
    estimated_duration_weeks = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])

    # Stats (denormalized for performance)
    module_count = models.IntegerField(default=0)
    lesson_count = models.IntegerField(default=0)
    mission_count = models.IntegerField(default=0)

    # Beginner Level completion rules — admin-configurable per spec
    tier2_mini_missions_required = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(2)],
        help_text='Minimum mini-missions required to complete this Beginner track (1 or 2)'
    )
    tier2_require_mentor_approval = models.BooleanField(
        default=False,
        help_text='If True, mentor must approve before Beginner level completion'
    )
    # Intermediate Level completion rules — all mandatory modules, all missions passed, reflections, optional mentor approval
    tier3_require_mentor_approval = models.BooleanField(
        default=False,
        help_text='If True, mentor must approve before Intermediate level track completion'
    )
    # Advanced Level completion rules — all mandatory modules, all advanced missions approved, feedback cycles complete, final reflection, optional mentor approval
    tier4_require_mentor_approval = models.BooleanField(
        default=False,
        help_text='If True, mentor must approve before Advanced level track completion'
    )
    # Mastery Level completion rules — all mastery missions approved, capstone approved, reflections complete, mastery completion rubric passed, optional mentor approval
    tier5_require_mentor_approval = models.BooleanField(
        default=False,
        help_text='If True, mentor must approve before Mastery level track completion'
    )
    mastery_completion_rubric_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text='UUID of rubric for Mastery completion validation'
    )
    # Admin-configurable: sequential (unlock one by one) or flexible (all modules open)
    progression_mode = models.CharField(
        max_length=20,
        choices=[('sequential', 'Sequential'), ('flexible', 'Flexible')],
        default='sequential',
        help_text='Sequential = unlock modules in order; Flexible = all modules available'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_tracks'
        verbose_name = 'Curriculum Track'
        verbose_name_plural = 'Curriculum Tracks'
        ordering = ['tier', 'order_number', 'name']
        indexes = [
            models.Index(fields=['code', 'is_active']),
            models.Index(fields=['tier', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class CurriculumLevel(models.Model):
    """
    Level within a curriculum track (Beginner, Intermediate, Advanced, Mastery)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='levels'
    )
    slug = models.SlugField(max_length=50, help_text="'beginner', 'intermediate', 'advanced', 'mastery'")
    title = models.CharField(max_length=255, help_text='Display title')
    description = models.TextField(blank=True)
    order_number = models.IntegerField(default=0, help_text='Order within track')
    estimated_duration_hours = models.IntegerField(null=True, blank=True)
    prerequisites = models.JSONField(default=dict, blank=True, help_text='Requirements to unlock this level')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'curriculum_levels'
        verbose_name = 'Curriculum Level'
        verbose_name_plural = 'Curriculum Levels'
        unique_together = [['track', 'slug']]
        ordering = ['track', 'order_number']

    def __str__(self):
        return f"{self.track.title} - {self.title}"


class CurriculumVideo(models.Model):
    """
    Video lessons within curriculum modules.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        'CurriculumModule',
        on_delete=models.CASCADE,
        related_name='videos'
    )
    slug = models.SlugField(max_length=100, help_text='URL-friendly identifier')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_url = models.URLField(blank=True, help_text='Video URL or placeholder')
    duration_seconds = models.IntegerField(null=True, blank=True)
    order_number = models.IntegerField(default=0, help_text='Order within module')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'curriculum_videos'
        verbose_name = 'Curriculum Video'
        verbose_name_plural = 'Curriculum Videos'
        unique_together = [['module', 'slug']]
        ordering = ['module', 'order_number']

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class CurriculumQuiz(models.Model):
    """
    Quizzes within curriculum modules.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        'CurriculumModule',
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    slug = models.SlugField(max_length=100, help_text='URL-friendly identifier')
    title = models.CharField(max_length=255)
    questions = models.JSONField(help_text='Quiz questions and answers in JSON format')
    pass_threshold = models.IntegerField(default=80, help_text='Passing percentage (0-100)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'curriculum_quizzes'
        verbose_name = 'Curriculum Quiz'
        verbose_name_plural = 'Curriculum Quizzes'
        unique_together = [['module', 'slug']]

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class StrategicSession(models.Model):
    """
    Strategic sessions held at the end of curriculum levels
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.ForeignKey(
        CurriculumLevel,
        on_delete=models.CASCADE,
        related_name='strategic_sessions'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    agenda_items = models.JSONField(default=list, blank=True, help_text='Session agenda items')
    estimated_duration_minutes = models.IntegerField(default=90)
    supporting_recipes = models.JSONField(default=list, blank=True, help_text='Recipe slugs for session')
    requires_professional = models.BooleanField(default=True, help_text='Requires professional tier')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'strategic_sessions'
        verbose_name = 'Strategic Session'
        verbose_name_plural = 'Strategic Sessions'
        ordering = ['level', 'created_at']

    def __str__(self):
        return f"{self.level.title} - {self.title}"


class UserTrackEnrollment(models.Model):
    """
    User enrollment in curriculum tracks
    """
    user_id = models.UUIDField(help_text='User UUID')
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    current_level_slug = models.CharField(max_length=50, default='beginner')
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_track_enrollments'
        verbose_name = 'User Track Enrollment'
        verbose_name_plural = 'User Track Enrollments'
        unique_together = [['user_id', 'track']]
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"User {self.user_id} - {self.track.title}"


# UserContentProgress moved after CurriculumContent

# DUPLICATE CurriculumModule class removed - using the one defined later

pass  # Placeholder to keep syntax valid

class CurriculumModule(models.Model):
    """Curriculum module within a track - hierarchical content container."""
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('capstone', 'Capstone'),
    ]
    
    ENTITLEMENT_TIER_CHOICES = [
        ('all', 'All Tiers'),
        ('starter_enhanced', 'Starter Enhanced (First 6mo)'),
        ('starter_normal', 'Starter Normal'),
        ('professional', 'Professional Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Track relationship
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='modules',
        null=True,
        blank=True,
        db_column='track_id',
        help_text='FK to CurriculumTrack'
    )
    # Keep track_key for backwards compatibility
    track_key = models.CharField(max_length=50, db_index=True, help_text='Track key like "soc_analyst"')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Module structure
    is_core = models.BooleanField(default=True, help_text='Core vs optional module')
    is_required = models.BooleanField(default=True, help_text='Required to complete track')
    order_index = models.IntegerField(default=0, help_text='Order within track')
    
    # Level and entitlements
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='beginner',
        help_text='Module difficulty level'
    )
    entitlement_tier = models.CharField(
        max_length=20,
        choices=ENTITLEMENT_TIER_CHOICES,
        default='all',
        help_text='Minimum subscription tier required'
    )
    
    # Time estimates
    estimated_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        db_column='estimated_time_minutes',
        help_text='Estimated minutes to complete'
    )

    # Supporting recipes (from specification)
    supporting_recipes = models.JSONField(
        default=list,
        blank=True,
        help_text='Recipe slugs that support this module'
    )

    # New fields for curriculum navigation system
    slug = models.SlugField(max_length=100, blank=True, help_text='URL-friendly identifier')
    is_locked_by_default = models.BooleanField(default=True, help_text='Whether module starts locked')
    
    # Competencies and skills
    competencies = models.JSONField(
        default=list,
        blank=True,
        help_text='["SIEM", "Alerting", "IR"]'
    )
    
    # Mentor notes (7-tier professional only)
    mentor_notes = models.TextField(
        blank=True,
        help_text='Mentor guidance notes (Professional tier only)'
    )
    
    # Stats (denormalized)
    lesson_count = models.IntegerField(default=0)
    mission_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'curriculummodules'
        verbose_name = 'Curriculum Module'
        verbose_name_plural = 'Curriculum Modules'
        indexes = [
            models.Index(fields=['track_key', 'order_index']),
            models.Index(fields=['track_key', 'is_core']),
            models.Index(fields=['track', 'order_index']),
            models.Index(fields=['level', 'entitlement_tier']),
        ]
        ordering = ['track_key', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.track_key})"


class Lesson(models.Model):
    """Lesson within a curriculum module - videos, guides, quizzes."""
    
    LESSON_TYPE_CHOICES = [
        ('video', 'Video'),
        ('guide', 'Guide/Article'),
        ('quiz', 'Quiz'),
        ('assessment', 'Assessment'),
        ('lab', 'Hands-on Lab'),
        ('reading', 'Reading Material'),
        ('diagram', 'Diagram/Flow'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='lessons',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Content
    content_url = models.URLField(blank=True, help_text='URL to lesson content')
    lesson_type = models.CharField(
        max_length=20,
        choices=LESSON_TYPE_CHOICES,
        default='video',
        help_text='Type of lesson content'
    )
    
    # Duration
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Duration in minutes'
    )
    
    order_index = models.IntegerField(default=0, help_text='Order within module')
    is_required = models.BooleanField(default=True, help_text='Required to complete module')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lessons'
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        indexes = [
            models.Index(fields=['module', 'order_index']),
            models.Index(fields=['lesson_type']),
        ]
        ordering = ['module', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.module.title})"


class CurriculumContent(models.Model):
    """
    Individual content items (videos or quizzes) within modules
    """
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('quiz', 'Quiz'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='content_items'
    )
    slug = models.SlugField(max_length=100, help_text='URL-friendly identifier')
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPE_CHOICES)
    video_url = models.URLField(blank=True, null=True, help_text='Video URL for video content')
    quiz_data = models.JSONField(blank=True, null=True, help_text='Quiz questions and answers')
    duration_seconds = models.IntegerField(null=True, blank=True)
    order_number = models.IntegerField(default=0, help_text='Order within module')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'curriculum_content'
        verbose_name = 'Curriculum Content'
        verbose_name_plural = 'Curriculum Content'
        unique_together = [['module', 'slug']]
        ordering = ['module', 'order_number']

    def __str__(self):
        return f"{self.module.title} - {self.title} ({self.content_type})"


class UserContentProgress(models.Model):
    """
    User progress on individual content items
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    user_id = models.UUIDField(help_text='User UUID')
    content = models.ForeignKey(
        CurriculumContent,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    quiz_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Video progress tracking (for non-skippable video player)
    video_progress_seconds = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text='Current video progress in seconds'
    )
    video_duration_seconds = models.IntegerField(
        default=0,
        help_text='Total video duration in seconds'
    )
    last_position_resume = models.BooleanField(
        default=False,
        help_text='Whether user should resume from last position'
    )

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_content_progress'
        verbose_name = 'User Content Progress'
        verbose_name_plural = 'User Content Progress'
        unique_together = [['user_id', 'content']]
        ordering = ['-updated_at']

    def __str__(self):
        return f"User {self.user_id} - {self.content.title} ({self.status})"


class ModuleMission(models.Model):
    """
    Link table between curriculum modules and missions.
    Enables module → mission execution in Missions Engine.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='module_missions',
        db_index=True
    )
    mission_id = models.UUIDField(db_index=True, help_text='FK to missions.Mission')
    
    # Mission metadata (denormalized for display)
    mission_title = models.CharField(max_length=255, blank=True)
    mission_difficulty = models.CharField(max_length=20, blank=True)
    mission_estimated_hours = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True
    )
    
    is_required = models.BooleanField(default=True, help_text='Required to complete module')
    recommended_order = models.IntegerField(default=0, help_text='Order within module missions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'module_missions'
        verbose_name = 'Module Mission'
        verbose_name_plural = 'Module Missions'
        unique_together = [['module', 'mission_id']]
        indexes = [
            models.Index(fields=['module', 'recommended_order']),
            models.Index(fields=['mission_id']),
        ]
        ordering = ['module', 'recommended_order']
    
    def __str__(self):
        return f"{self.module.title} → {self.mission_title or self.mission_id}"


class RecipeRecommendation(models.Model):
    """
    Recipe recommendations for modules - micro-skill boosters.
    Links to Recipe Engine for contextual skill gaps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='recipe_recommendations',
        db_index=True
    )
    recipe_id = models.UUIDField(db_index=True, help_text='FK to recipes.Recipe')
    
    # Recipe metadata (denormalized)
    recipe_title = models.CharField(max_length=255, blank=True)
    recipe_duration_minutes = models.IntegerField(null=True, blank=True)
    recipe_difficulty = models.CharField(max_length=20, blank=True)
    
    relevance_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text='How relevant is this recipe to the module (0-1)'
    )
    
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'curriculum_recipe_recommendations'
        verbose_name = 'Recipe Recommendation'
        verbose_name_plural = 'Recipe Recommendations'
        unique_together = [['module', 'recipe_id']]
        indexes = [
            models.Index(fields=['module', 'order_index']),
        ]
        ordering = ['module', 'order_index']
    
    def __str__(self):
        return f"{self.module.title} → Recipe: {self.recipe_title or self.recipe_id}"


class UserTrackProgress(models.Model):
    """
    User progress tracking at the track level.
    Aggregates module/lesson/mission progress for track completion %.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='track_progress',
        db_index=True
    )
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    
    # Current position
    current_module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_users',
        help_text='Current active module'
    )
    
    # Progress stats
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    modules_completed = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    missions_completed = models.IntegerField(default=0)
    
    # Time tracking
    total_time_spent_minutes = models.IntegerField(default=0)
    estimated_completion_date = models.DateField(null=True, blank=True)
    
    # Circle/Phase integration (from Profiler)
    circle_level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text='OCH Circle level (1-10)'
    )
    phase = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Phase within circle (1-5)'
    )
    
    # Gamification
    total_points = models.IntegerField(default=0)
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    total_badges = models.IntegerField(default=0)
    
    # Rankings
    university_rank = models.IntegerField(null=True, blank=True)
    global_rank = models.IntegerField(null=True, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Beginner Level specific completion tracking
    tier2_quizzes_passed = models.IntegerField(default=0, help_text='Number of quizzes passed (Beginner level)')
    tier2_mini_missions_completed = models.IntegerField(default=0, help_text='Number of mini-missions completed (Beginner level)')
    tier2_reflections_submitted = models.IntegerField(default=0, help_text='Number of reflections submitted (Beginner level)')
    tier2_mentor_approval = models.BooleanField(default=False, help_text='Mentor approval for Beginner level completion (optional)')
    tier2_completion_requirements_met = models.BooleanField(default=False, db_index=True, help_text='All Beginner level requirements met')
    # Intermediate Level completion tracking
    tier3_mentor_approval = models.BooleanField(default=False, help_text='Mentor approval for Intermediate level completion (if required)')
    tier3_completion_requirements_met = models.BooleanField(default=False, db_index=True, help_text='All Intermediate level requirements met: modules, missions passed, reflections, mentor approval if required')
    tier4_unlocked = models.BooleanField(default=False, db_index=True, help_text='User has completed an Intermediate level track and can access Advanced level')
    
    # Advanced Level completion tracking
    tier4_mentor_approval = models.BooleanField(default=False, help_text='Mentor approval for Advanced level completion (if required)')
    tier4_completion_requirements_met = models.BooleanField(default=False, db_index=True, help_text='All Advanced level requirements met: modules, advanced missions approved, feedback cycles complete, final reflection submitted')
    tier5_unlocked = models.BooleanField(default=False, db_index=True, help_text='User has completed an Advanced level track and can access Mastery level')
    
    # Mastery Level completion tracking
    tier5_mentor_approval = models.BooleanField(default=False, help_text='Mentor approval for Mastery level completion (if required)')
    tier5_completion_requirements_met = models.BooleanField(default=False, db_index=True, help_text='All Mastery level requirements met: mastery missions approved, capstone approved, reflections complete, mastery completion rubric passed')
    class Meta:
        db_table = 'user_track_progress'
        verbose_name = 'User Track Progress'
        verbose_name_plural = 'User Track Progress'
        unique_together = [['user', 'track']]
        indexes = [
            models.Index(fields=['user', 'track']),
            models.Index(fields=['track', '-completion_percentage']),
            models.Index(fields=['user', '-last_activity_at']),
            models.Index(fields=['circle_level', 'phase']),
        ]
    
    def check_tier2_completion(self, require_mentor_approval=False):
        """
        Check if Beginner Level completion requirements are met.
        
        Requirements:
        - All mandatory modules completed
        - All quizzes passed
        - Minimum number of beginner tasks/mini-missions submitted
        - Mentor approval (if required)
        
        Returns: (is_complete: bool, missing_requirements: list)
        """
        if self.track.tier != 2:
            return False, ['Not a Beginner level track']
        
        missing = []
        
        # Check all mandatory modules are completed
        mandatory_modules = CurriculumModule.objects.filter(
            track=self.track,
            is_required=True,
            is_active=True
        )
        completed_modules = UserModuleProgress.objects.filter(
            user=self.user,
            module__in=mandatory_modules,
            status='completed'
        )
        if completed_modules.count() < mandatory_modules.count():
            missing.append(f"Complete all {mandatory_modules.count()} mandatory modules")
        
        # Check quizzes passed (all quizzes in required modules)
        required_quizzes = Lesson.objects.filter(
            module__track=self.track,
            module__is_required=True,
            lesson_type='quiz',
            is_required=True
        )
        passed_quizzes = UserLessonProgress.objects.filter(
            user=self.user,
            lesson__in=required_quizzes,
            status='completed',
            quiz_score__gte=70  # 70% passing score
        )
        if passed_quizzes.count() < required_quizzes.count():
            missing.append(f"Pass all {required_quizzes.count()} quizzes (70% minimum)")
        
        # Check minimum mini-missions completed (1-2 per track config)
        min_missions_required = getattr(
            self.track, 'tier2_mini_missions_required', 1
        )
        if self.tier2_mini_missions_completed < min_missions_required:
            missing.append(f"Complete at least {min_missions_required} mini-mission(s)")
        
        # Check mentor approval if required (track-level or param)
        need_mentor = require_mentor_approval or getattr(
            self.track, 'tier2_require_mentor_approval', False
        )
        if need_mentor and not self.tier2_mentor_approval:
            missing.append("Mentor approval required")
        
        is_complete = len(missing) == 0
        self.tier2_completion_requirements_met = is_complete
        self.save(update_fields=['tier2_completion_requirements_met'])
        
        return is_complete, missing

    def check_tier3_completion(self, require_mentor_approval=None):
        """
        Check if Intermediate Level completion requirements are met.
        Requirements: mandatory modules completed; all Intermediate missions submitted and passed;
        reflections completed; mentor approval (if required).
        Returns: (is_complete: bool, missing_requirements: list)
        """
        if self.track.tier != 3:
            return False, ['Not an Intermediate level track']
        missing = []
        # 1. Mandatory modules completed
        mandatory_modules = CurriculumModule.objects.filter(
            track=self.track,
            is_required=True,
            is_active=True
        )
        completed_modules = UserModuleProgress.objects.filter(
            user=self.user,
            module__in=mandatory_modules,
            status='completed'
        )
        if completed_modules.count() < mandatory_modules.count():
            missing.append(f"Complete all {mandatory_modules.count()} mandatory modules")
        # 2. All Intermediate missions for this track submitted and passed
        try:
            from missions.models_mxp import MissionProgress
        except ImportError:
            pass
        else:
            required_mission_ids = list(
                ModuleMission.objects.filter(
                    module__track=self.track,
                    module__is_required=True,
                    is_required=True
                ).values_list('mission_id', flat=True).distinct()
            )
            if required_mission_ids:
                passed = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    final_status='pass'
                ).count()
                if passed < len(required_mission_ids):
                    missing.append(
                        f"Complete and pass all {len(required_mission_ids)} Intermediate mission(s)"
                    )
                # 3. Reflections completed where required
                for prog in MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    final_status='pass'
                ).only('reflection_required', 'reflection_submitted'):
                    if prog.reflection_required and not prog.reflection_submitted:
                        missing.append("Complete required reflection(s) for missions")
                        break
        # 4. Mentor approval (if required)
        need_mentor = require_mentor_approval if require_mentor_approval is not None else getattr(
            self.track, 'tier3_require_mentor_approval', False
        )
        if need_mentor and not self.tier3_mentor_approval:
            missing.append("Mentor approval required")
        is_complete = len(missing) == 0
        self.tier3_completion_requirements_met = is_complete
        update_fields = ['tier3_completion_requirements_met']
        if is_complete:
            self.tier4_unlocked = True
            update_fields.append('tier4_unlocked')
        self.save(update_fields=update_fields)
        return is_complete, missing

    def check_tier4_completion(self, require_mentor_approval=None):
        """
        Check if Advanced Level completion requirements are met.
        Requirements: mandatory modules completed; all Advanced missions submitted and approved;
        feedback cycles complete; final advanced reflection submitted; mentor approval (if required).
        Returns: (is_complete: bool, missing_requirements: list)
        """
        if self.track.tier != 4:
            return False, ['Not an Advanced level track']
        
        missing = []
        
        # 1. Mandatory modules completed
        mandatory_modules = CurriculumModule.objects.filter(
            track=self.track,
            is_required=True,
            is_active=True
        )
        completed_modules = UserModuleProgress.objects.filter(
            user=self.user,
            module__in=mandatory_modules,
            status='completed'
        )
        if completed_modules.count() < mandatory_modules.count():
            missing.append(f"Complete all {mandatory_modules.count()} mandatory modules")
        
        # 2. All Advanced missions for this track submitted and approved
        try:
            from missions.models_mxp import MissionProgress
            from missions.models import Mission
        except ImportError:
            pass
        else:
            # Get all advanced missions for this track
            # Match by track code (e.g., 'DEFENDER_4') or track name
            track_code_lower = self.track.code.lower() if hasattr(self.track, 'code') else None
            track_name_lower = self.track.name.lower() if hasattr(self.track, 'name') else None
            
            # Try to match track field (defender/offensive/grc/innovation/leadership)
            track_match = None
            if track_code_lower:
                # Extract track name from code (e.g., 'DEFENDER_4' -> 'defender')
                if 'defender' in track_code_lower:
                    track_match = 'defender'
                elif 'offensive' in track_code_lower:
                    track_match = 'offensive'
                elif 'grc' in track_code_lower:
                    track_match = 'grc'
                elif 'innovation' in track_code_lower:
                    track_match = 'innovation'
                elif 'leadership' in track_code_lower:
                    track_match = 'leadership'
            
            advanced_missions = Mission.objects.filter(
                tier='advanced',
                is_active=True
            )
            
            if track_match:
                advanced_missions = advanced_missions.filter(track=track_match)
            elif track_code_lower:
                # Fallback: match by track_id
                advanced_missions = advanced_missions.filter(track_id__icontains=track_code_lower)
            
            # Get required missions via ModuleMission if available
            required_mission_ids = list(
                ModuleMission.objects.filter(
                    module__track=self.track,
                    module__is_required=True,
                    is_required=True
                ).values_list('mission_id', flat=True).distinct()
            )
            
            # If no ModuleMission links, use all advanced missions for the track
            if not required_mission_ids:
                required_mission_ids = list(advanced_missions.values_list('id', flat=True))
            
            if required_mission_ids:
                # Check all missions are approved (status='approved' and final_status='pass')
                approved_missions = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    final_status='pass',
                    status='approved'
                ).count()
                
                if approved_missions < len(required_mission_ids):
                    missing.append(
                        f"Complete and get approval for all {len(required_mission_ids)} Advanced mission(s)"
                    )
                
                # 3. Feedback cycles complete (all missions have been reviewed)
                reviewed_missions = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    mentor_reviewed_at__isnull=False
                ).count()
                
                if reviewed_missions < len(required_mission_ids):
                    missing.append("Complete feedback cycles for all Advanced missions")
                
                # 4. Final advanced reflection submitted
                # Check if any advanced mission requires reflection and if it's submitted
                reflection_required = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True
                ).exists()
                
                if reflection_required:
                    reflection_submitted = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=required_mission_ids,
                        reflection_required=True,
                        reflection_submitted=True
                    ).count()
                    
                    reflection_total = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=required_mission_ids,
                        reflection_required=True
                    ).count()
                    
                    if reflection_submitted < reflection_total:
                        missing.append("Submit final advanced reflection(s) for missions")
        
        # 5. Mentor approval (if required)
        need_mentor = require_mentor_approval if require_mentor_approval is not None else getattr(
            self.track, 'tier4_require_mentor_approval', False
        )
        if need_mentor and not self.tier4_mentor_approval:
            missing.append("Mentor approval required")
        
        is_complete = len(missing) == 0
        self.tier4_completion_requirements_met = is_complete
        update_fields = ['tier4_completion_requirements_met']
        
        if is_complete:
            self.tier5_unlocked = True
            update_fields.append('tier5_unlocked')
        
        self.save(update_fields=update_fields)
        return is_complete, missing

    def check_tier5_completion(self, require_mentor_approval=None):
        """
        Check if Mastery Level completion requirements are met.
        Requirements: all Mastery missions submitted and approved; all reflections completed;
        final Capstone approved; Mastery Completion Rubric passed; mentor approval (if required).
        Returns: (is_complete: bool, missing_requirements: list)
        """
        if self.track.tier != 5:
            return False, ['Not a Mastery level track']
        
        missing = []
        
        # 1. All Mastery missions for this track submitted and approved
        try:
            from missions.models_mxp import MissionProgress
            from missions.models import Mission
        except ImportError:
            pass
        else:
            # Match by track code (e.g., 'DEFENDER_5') or track name
            track_code_lower = self.track.code.lower() if hasattr(self.track, 'code') else None
            
            # Try to match track field (defender/offensive/grc/innovation/leadership)
            track_match = None
            if track_code_lower:
                if 'defender' in track_code_lower:
                    track_match = 'defender'
                elif 'offensive' in track_code_lower:
                    track_match = 'offensive'
                elif 'grc' in track_code_lower:
                    track_match = 'grc'
                elif 'innovation' in track_code_lower:
                    track_match = 'innovation'
                elif 'leadership' in track_code_lower:
                    track_match = 'leadership'
            
            mastery_missions = Mission.objects.filter(
                tier='mastery',
                is_active=True
            )
            
            if track_match:
                mastery_missions = mastery_missions.filter(track=track_match)
            elif track_code_lower:
                mastery_missions = mastery_missions.filter(track_id__icontains=track_code_lower)
            
            # Get required missions via ModuleMission if available
            required_mission_ids = list(
                ModuleMission.objects.filter(
                    module__track=self.track,
                    module__is_required=True,
                    is_required=True
                ).values_list('mission_id', flat=True).distinct()
            )
            
            # If no ModuleMission links, use all mastery missions for the track
            if not required_mission_ids:
                required_mission_ids = list(mastery_missions.values_list('id', flat=True))
            
            if required_mission_ids:
                # Check all mastery missions are approved (status='approved' and final_status='pass')
                approved_missions = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    final_status='pass',
                    status='approved'
                ).count()
                
                if approved_missions < len(required_mission_ids):
                    missing.append(
                        f"Complete and get approval for all {len(required_mission_ids)} Mastery mission(s)"
                    )
                
                # 2. All reflections completed
                reflection_required = MissionProgress.objects.filter(
                    user=self.user,
                    mission_id__in=required_mission_ids,
                    reflection_required=True
                ).exists()
                
                if reflection_required:
                    reflection_submitted = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=required_mission_ids,
                        reflection_required=True,
                        reflection_submitted=True
                    ).count()
                    
                    reflection_total = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=required_mission_ids,
                        reflection_required=True
                    ).count()
                    
                    if reflection_submitted < reflection_total:
                        missing.append("Submit all required reflection(s) for Mastery missions")
                
                # 3. Final Capstone approved
                capstone_missions = Mission.objects.filter(
                    id__in=required_mission_ids,
                    mission_type='capstone',
                    is_active=True
                )
                
                if capstone_missions.exists():
                    capstone_ids = list(capstone_missions.values_list('id', flat=True))
                    capstone_approved = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=capstone_ids,
                        final_status='pass',
                        status='approved'
                    ).count()
                    
                    if capstone_approved < len(capstone_ids):
                        missing.append(f"Complete and get approval for Capstone project ({len(capstone_ids)} required)")
                
                # 4. Mastery Completion Rubric passed (if configured)
                completion_rubric_id = getattr(self.track, 'mastery_completion_rubric_id', None)
                if completion_rubric_id:
                    # Check if rubric scores meet threshold (this would need rubric service integration)
                    # For now, we'll check if all missions have mentor scores above a threshold
                    low_scores = MissionProgress.objects.filter(
                        user=self.user,
                        mission_id__in=required_mission_ids,
                        mentor_score__lt=70  # 70% threshold
                    ).exists()
                    
                    if low_scores:
                        missing.append("Meet Mastery Completion Rubric requirements (minimum 70% score on all missions)")
        
        # 5. Mentor approval (if required)
        need_mentor = require_mentor_approval if require_mentor_approval is not None else getattr(
            self.track, 'tier5_require_mentor_approval', False
        )
        if need_mentor and not self.tier5_mentor_approval:
            missing.append("Mentor approval required")
        
        is_complete = len(missing) == 0
        self.tier5_completion_requirements_met = is_complete
        update_fields = ['tier5_completion_requirements_met']
        
        self.save(update_fields=update_fields)
        return is_complete, missing

    def __str__(self):
        return f"{self.user.email} - {self.track.name} ({self.completion_percentage}%)"


class UserModuleProgress(models.Model):
    """User progress tracking for curriculum modules."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),  # Waiting on mission completion
    ]
    
    # Note: Keep default auto id field for backwards compatibility with existing table
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_progress',
        db_index=True
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    
    # Progress details
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    lessons_completed = models.IntegerField(default=0)
    missions_completed = models.IntegerField(default=0)
    
    # Blocking state
    is_blocked = models.BooleanField(default=False, help_text='Waiting on mission completion')
    blocked_by_mission_id = models.UUIDField(null=True, blank=True)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_module_progress'
        verbose_name = 'User Module Progress'
        verbose_name_plural = 'User Module Progress'
        unique_together = [['user', 'module']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['module', '-completion_percentage']),
            models.Index(fields=['user', 'is_blocked']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.module.title} ({self.status})"


class UserLessonProgress(models.Model):
    """User progress tracking for lessons."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    # Note: Keep default auto id field for backwards compatibility with existing table
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        db_index=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    
    # Progress details
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='For video: watch percentage'
    )
    
    # Quiz/assessment results
    quiz_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    quiz_attempts = models.IntegerField(default=0)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_lesson_progress'
        verbose_name = 'User Lesson Progress'
        verbose_name_plural = 'User Lesson Progress'
        unique_together = [['user', 'lesson']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['lesson', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} ({self.status})"


class UserLessonBookmark(models.Model):
    """Bookmark / save for later — learner can bookmark lessons within a track."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_bookmarks',
        db_index=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='bookmarked_by',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_lesson_bookmarks'
        verbose_name = 'Lesson Bookmark'
        verbose_name_plural = 'Lesson Bookmarks'
        unique_together = [['user', 'lesson']]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} bookmarked {self.lesson.title}"


class CurriculumMentorFeedback(models.Model):
    """Mentor comments on specific tasks (lesson or module) for a learner."""
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_feedback_given',
        db_index=True
    )
    learner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_feedback_received',
        db_index=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='mentor_feedback',
        null=True,
        blank=True,
        db_index=True
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='mentor_feedback',
        null=True,
        blank=True,
        db_index=True
    )
    comment_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_mentor_feedback'
        verbose_name = 'Curriculum Mentor Feedback'
        verbose_name_plural = 'Curriculum Mentor Feedback'
        indexes = [
            models.Index(fields=['learner', 'lesson']),
            models.Index(fields=['learner', 'module']),
        ]

    def __str__(self):
        return f"Mentor feedback for {self.learner.email} on {self.lesson_id or self.module_id}"


class UserMissionProgress(models.Model):
    """
    User progress tracking for curriculum missions.
    Links curriculum to Missions Engine results.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_mission_progress',
        db_index=True
    )
    module_mission = models.ForeignKey(
        ModuleMission,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    
    # Mission results (from Missions Engine)
    mission_submission_id = models.UUIDField(
        null=True,
        blank=True,
        help_text='FK to missions.MissionSubmission'
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    grade = models.CharField(max_length=10, blank=True)  # A+, A, B+, etc.
    feedback = models.TextField(blank=True)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_curriculum_mission_progress'
        verbose_name = 'User Mission Progress'
        verbose_name_plural = 'User Mission Progress'
        unique_together = [['user', 'module_mission']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['module_mission', 'status']),
            models.Index(fields=['mission_submission_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.module_mission} ({self.status})"


class CurriculumActivity(models.Model):
    """
    Activity log for curriculum engagement - feeds TalentScope signals.
    """
    ACTIVITY_TYPE_CHOICES = [
        ('lesson_started', 'Lesson Started'),
        ('lesson_completed', 'Lesson Completed'),
        ('module_started', 'Module Started'),
        ('module_completed', 'Module Completed'),
        ('mission_started', 'Mission Started'),
        ('mission_submitted', 'Mission Submitted'),
        ('mission_completed', 'Mission Completed'),
        ('quiz_completed', 'Quiz Completed'),
        ('recipe_started', 'Recipe Started'),
        ('recipe_completed', 'Recipe Completed'),
        ('track_started', 'Track Started'),
        ('track_completed', 'Track Completed'),
        ('streak_milestone', 'Streak Milestone'),
        ('badge_earned', 'Badge Earned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_activities',
        db_index=True
    )
    
    activity_type = models.CharField(
        max_length=30,
        choices=ACTIVITY_TYPE_CHOICES,
        db_index=True
    )
    
    # Related entities (nullable)
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    
    # Activity metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional activity data: {score, time_spent, badge_name, etc.}'
    )
    
    # Points awarded
    points_awarded = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'curriculum_activities'
        verbose_name = 'Curriculum Activity'
        verbose_name_plural = 'Curriculum Activities'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
            models.Index(fields=['track', '-created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type} @ {self.created_at}"


# ============================================================================
# TIER 6 - CROSS-TRACK PROGRAMS MODELS
# ============================================================================

class CrossTrackSubmission(models.Model):
    """
    Submissions for Tier 6 Cross-Track Programs.
    Handles reflections, scenario-based decisions, document uploads, and portfolio items.
    """
    SUBMISSION_TYPE_CHOICES = [
        ('reflection', 'Reflection'),
        ('scenario', 'Scenario Decision'),
        ('document', 'Document Upload'),
        ('portfolio', 'Portfolio Item'),
        ('quiz', 'Quiz Submission'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cross_track_submissions',
        db_index=True
    )
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True,
        help_text='Cross-track program (tier=6)'
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='cross_track_submissions',
        null=True,
        blank=True,
        db_index=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='cross_track_submissions',
        null=True,
        blank=True,
        db_index=True
    )
    
    submission_type = models.CharField(
        max_length=20,
        choices=SUBMISSION_TYPE_CHOICES,
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    
    # Content
    content = models.TextField(blank=True, help_text='Text content for reflections, scenario responses')
    document_url = models.URLField(blank=True, help_text='URL to uploaded document (CV, portfolio item, etc.)')
    document_filename = models.CharField(max_length=255, blank=True)
    
    # Scenario-specific
    scenario_choice = models.CharField(max_length=100, blank=True, help_text='Selected choice in scenario')
    scenario_reasoning = models.TextField(blank=True, help_text='Reasoning for scenario choice')
    scenario_metadata = models.JSONField(default=dict, blank=True, help_text='Additional scenario data')
    
    # Quiz-specific
    quiz_answers = models.JSONField(default=dict, blank=True, help_text='Quiz answers')
    quiz_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Mentor feedback
    mentor_feedback = models.TextField(blank=True)
    mentor_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Mentor rating (1-5)'
    )
    mentor_reviewed_at = models.DateTimeField(null=True, blank=True)
    mentor_reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_cross_track_submissions',
        help_text='Mentor who reviewed this submission'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional submission metadata')
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'cross_track_submissions'
        verbose_name = 'Cross-Track Submission'
        verbose_name_plural = 'Cross-Track Submissions'
        indexes = [
            models.Index(fields=['user', 'track', '-created_at']),
            models.Index(fields=['track', 'submission_type', 'status']),
            models.Index(fields=['module', 'submission_type']),
            models.Index(fields=['status', '-submitted_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.track.name} - {self.submission_type} ({self.status})"


class CrossTrackProgramProgress(models.Model):
    """
    Progress tracking for Tier 6 Cross-Track Programs.
    Tracks completion status for each of the 5 cross-track programs.
    """
    PROGRAM_CATEGORIES = [
        ('entrepreneurship', 'Cyber Entrepreneurship'),
        ('soft_skills', 'Soft Skills for Cyber Careers'),
        ('career_acceleration', 'Career Acceleration'),
        ('ethics', 'Cyber Ethics & Integrity'),
        ('leadership', 'Mission Leadership'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cross_track_progress',
        db_index=True
    )
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='cross_track_progress',
        db_index=True,
        help_text='Cross-track program (tier=6)'
    )
    
    # Progress stats
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    modules_completed = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    submissions_completed = models.IntegerField(default=0, help_text='Reflections, scenarios, documents submitted')
    
    # Completion flags
    all_modules_completed = models.BooleanField(default=False)
    all_reflections_submitted = models.BooleanField(default=False)
    all_quizzes_passed = models.BooleanField(default=False)
    final_summary_submitted = models.BooleanField(default=False, help_text='Final summary activity submitted')
    is_complete = models.BooleanField(default=False, db_index=True)
    
    # Time tracking
    total_time_spent_minutes = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'cross_track_program_progress'
        verbose_name = 'Cross-Track Program Progress'
        verbose_name_plural = 'Cross-Track Program Progress'
        unique_together = [['user', 'track']]
        indexes = [
            models.Index(fields=['user', 'track']),
            models.Index(fields=['user', 'is_complete']),
            models.Index(fields=['track', '-completion_percentage']),
        ]
    
    def check_completion(self):
        """
        Check if all completion requirements are met for this cross-track program.
        """
        if self.all_modules_completed and self.all_reflections_submitted and \
           self.all_quizzes_passed and self.final_summary_submitted:
            if not self.is_complete:
                self.is_complete = True
                self.completed_at = timezone.now()
                self.save(update_fields=['is_complete', 'completed_at'])
            return True
        return False
    
    def __str__(self):
        return f"{self.user.email} - {self.track.name} ({self.completion_percentage}%)"

