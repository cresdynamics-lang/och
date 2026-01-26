"""
Recipe Engine models - Micro-skill delivery system.
Provides short, actionable "how-to" learning units (15-30min).
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex
from users.models import User


class Recipe(models.Model):
    """
    Recipe - A micro-skill learning unit (15-30min step-by-step procedure).
    Examples: "Write Sigma rule", "Parse logs with jq", "Setup ELK stack"
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True, help_text='e.g., "Write Basic Sigma Rule"')
    slug = models.SlugField(max_length=255, unique=True, db_index=True, help_text='URL-friendly identifier')
    summary = models.TextField(max_length=500, help_text='1-2 sentence overview')
    description = models.TextField(blank=True, help_text='Detailed "what this solves"')
    
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='beginner',
        db_index=True
    )
    estimated_minutes = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(60)],
        help_text='Estimated completion time (5-60 minutes)'
    )
    
    # Arrays for filtering/searching
    track_codes = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of track codes like ["SOCDEFENSE", "DFIR"]'
    )
    skill_codes = models.JSONField(
        default=list,
        help_text='Array of skill codes like ["SIEM_RULE_WRITING", "LOG_ANALYSIS"]'
    )
    tools_used = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of tools like ["sigma", "jq", "awk"]'
    )
    prerequisites = models.JSONField(
        default=list,
        blank=True,
        help_text='Other recipes or knowledge prerequisites'
    )
    
    # Content structure (JSONB) - Updated to match Next.js API expectations
    description = models.TextField(
        help_text='2-3 sentence summary of what this recipe teaches'
    )
    prerequisites = models.JSONField(
        default=list,
        help_text='Array of prerequisite knowledge or tools'
    )
    tools_and_environment = models.JSONField(
        default=list,
        help_text='Array of named tools, SIEMs, OS, labs, log types, etc.'
    )
    inputs = models.JSONField(
        default=list,
        help_text='What the learner needs (log locations, alert IDs, dataset paths)'
    )
    steps = models.JSONField(
        default=list,
        help_text='Array of step objects with step_number, instruction, expected_outcome, evidence_hint'
    )
    validation_checks = models.JSONField(
        default=list,
        help_text='Simple questions or checks to confirm skill execution'
    )

    # Legacy content field (keeping for backward compatibility)
    content = models.JSONField(
        default=dict,
        blank=True,
        help_text='Legacy structured content - deprecated'
    )
    validation_steps = models.JSONField(
        default=dict,
        blank=True,
        help_text='Legacy validation steps - deprecated'
    )
    
    thumbnail_url = models.URLField(blank=True, max_length=500)
    mentor_curated = models.BooleanField(default=False, db_index=True)
    is_free_sample = models.BooleanField(default=False, db_index=True, help_text='Free tier access')

    # Stats
    usage_count = models.IntegerField(default=0, db_index=True)
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_recipes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recipes'
        verbose_name = 'Recipe'
        verbose_name_plural = 'Recipes'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'usage_count']),
            models.Index(fields=['difficulty', 'is_active']),
            models.Index(fields=['is_free_sample'], name='idx_recipes_free'),
            GinIndex(fields=['track_codes']),
            GinIndex(fields=['skill_codes']),
            GinIndex(fields=['tools_used']),
        ]
        ordering = ['-usage_count', '-created_at']
    
    def __str__(self):
        return self.title


class UserRecipeProgress(models.Model):
    """
    User progress tracking for recipes.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_progress'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='started',
        db_index=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='User rating 1-5'
    )
    notes = models.TextField(blank=True, help_text='Student feedback')
    time_spent_minutes = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_recipe_progress'
        verbose_name = 'User Recipe Progress'
        verbose_name_plural = 'User Recipe Progress'
        unique_together = [['user', 'recipe']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['recipe', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.recipe.title} ({self.status})"


class RecipeContextLink(models.Model):
    """
    Contextual links - Where recipes appear (missions, modules, projects, mentor sessions).
    """
    CONTEXT_TYPE_CHOICES = [
        ('mission', 'Mission'),
        ('module', 'Module'),
        ('project', 'Project'),
        ('mentor_session', 'Mentor Session'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='context_links'
    )
    
    context_type = models.CharField(
        max_length=20,
        choices=CONTEXT_TYPE_CHOICES,
        db_index=True
    )
    context_id = models.UUIDField(db_index=True, help_text='mission_id, module_id, etc')
    
    is_required = models.BooleanField(default=False, help_text='Required vs recommended')
    position_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'recipe_context_links'
        verbose_name = 'Recipe Context Link'
        verbose_name_plural = 'Recipe Context Links'
        indexes = [
            models.Index(fields=['context_type', 'context_id', 'position_order']),
            models.Index(fields=['recipe', 'context_type']),
        ]
    
    def __str__(self):
        return f"{self.recipe.title} → {self.context_type}:{self.context_id}"


class UserRecipeBookmark(models.Model):
    """
    User bookmarks for recipes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_bookmarks'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    bookmarked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_recipe_bookmarks'
        verbose_name = 'User Recipe Bookmark'
        verbose_name_plural = 'User Recipe Bookmarks'
        unique_together = [['user', 'recipe']]
        indexes = [
            models.Index(fields=['user', '-bookmarked_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} bookmarked {self.recipe.title}"


class RecipeSource(models.Model):
    """
    Recipe sources for ingestion and generation.
    """
    SOURCE_TYPE_CHOICES = [
        ('markdown_repo', 'Markdown Repository'),
        ('notion', 'Notion'),
        ('lab_api', 'Lab API'),
        ('doc_url', 'Document URL'),
        ('internal_docs', 'Internal Docs'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text='Human-readable name')
    type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        db_index=True
    )
    config = models.JSONField(
        help_text='API keys, paths, selectors, credentials'
    )
    active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recipe_sources'
        verbose_name = 'Recipe Source'
        verbose_name_plural = 'Recipe Sources'
        indexes = [
            models.Index(fields=['type', 'active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.type})"


class RecipeLLMJob(models.Model):
    """
    Background jobs for LLM recipe processing.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    SOURCE_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('llm_generated', 'LLM Generated'),
        ('external_doc', 'External Doc'),
        ('lab_platform', 'Lab Platform'),
        ('community', 'Community'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(
        RecipeSource,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='llm_jobs'
    )

    # Recipe targeting
    track_code = models.CharField(max_length=50, db_index=True)
    level = models.CharField(max_length=20, db_index=True)
    skill_code = models.CharField(max_length=100, db_index=True)

    # Content
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    input_text = models.TextField(help_text='Raw content to process')
    llm_model = models.CharField(max_length=100, default='gpt-4')

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    normalized_recipe = models.ForeignKey(
        Recipe,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='llm_jobs'
    )
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recipe_llm_jobs'
        verbose_name = 'Recipe LLM Job'
        verbose_name_plural = 'Recipe LLM Jobs'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['track_code', 'skill_code', 'level']),
            models.Index(fields=['source', 'status']),
        ]

    def __str__(self):
        return f"LLM Job: {self.track_code}/{self.skill_code} ({self.status})"


class RecipeNotification(models.Model):
    """
    Recipe-related notifications for users.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('reminder', 'Progress Reminder'),
        ('recommendation', 'Recipe Recommendation'),
        ('follow_up', 'Follow-up'),
        ('completion', 'Completion Congrats'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_notifications'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        db_index=True
    )
    payload = models.JSONField(help_text='Notification content and metadata')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recipe_notifications'
        verbose_name = 'Recipe Notification'
        verbose_name_plural = 'Recipe Notifications'
        indexes = [
            models.Index(fields=['user', 'sent_at']),
            models.Index(fields=['type', 'created_at']),
            models.Index(fields=['recipe', 'type']),
        ]

    def __str__(self):
        return f"{self.user.email}: {self.type} for {self.recipe.title}"
