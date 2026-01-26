"""
Community Module Models for OCH Platform.
University-centric social layer with cross-university engagement,
gamification, and integration with Profiler, Circles, and TalentScope.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class University(models.Model):
    """
    University/Institution model for community organization.
    Students are auto-mapped based on email domain or manual assignment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    code = models.CharField(
        max_length=20, 
        unique=True, 
        db_index=True,
        help_text='Short code for matching, e.g., UON, KU, JKUAT'
    )
    short_name = models.CharField(max_length=50, blank=True, null=True)  # e.g., "MIT", "Stanford"
    
    # Email domain for auto-mapping (e.g., "stanford.edu", "mit.edu")
    email_domains = models.JSONField(
        default=list,
        help_text='List of email domains for auto-mapping, e.g., ["stanford.edu", "alumni.stanford.edu"]'
    )
    
    # University details
    logo_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    country = models.CharField(max_length=2, null=True, blank=True)  # ISO 3166-1 alpha-2
    city = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)  # State/Province
    location = models.TextField(
        blank=True, 
        null=True,
        help_text='Full address or location description'
    )
    timezone = models.CharField(max_length=50, default='Africa/Nairobi')
    
    # Community settings
    is_verified = models.BooleanField(default=False)  # Officially verified university
    is_active = models.BooleanField(default=True)
    allow_cross_university_posts = models.BooleanField(default=True)
    
    # Stats (denormalized for performance)
    member_count = models.IntegerField(default=0)
    post_count = models.IntegerField(default=0)
    active_student_count = models.IntegerField(default=0)
    events_count = models.IntegerField(default=0)
    competitions_participated = models.IntegerField(default=0)
    
    # Engagement metrics
    engagement_score = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text='Computed engagement score for university ranking'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_universities'
        verbose_name_plural = 'Universities'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'is_verified']),
            models.Index(fields=['engagement_score']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class UniversityDomain(models.Model):
    """
    Email domain mapping table for auto-assigning students to universities.
    Supports multiple domains per university (e.g., main domain, alumni domain).
    """
    DOMAIN_TYPE_CHOICES = [
        ('primary', 'Primary Domain'),
        ('student', 'Student Email'),
        ('alumni', 'Alumni Email'),
        ('staff', 'Staff Email'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='domains'
    )
    domain = models.CharField(
        max_length=100, 
        unique=True, 
        db_index=True,
        help_text='Email domain, e.g., uonbi.ac.ke, students.ku.ac.ke'
    )
    domain_type = models.CharField(
        max_length=20, 
        choices=DOMAIN_TYPE_CHOICES, 
        default='primary'
    )
    is_active = models.BooleanField(default=True)
    auto_verify = models.BooleanField(
        default=False,
        help_text='Automatically verify users registering with this domain'
    )
    default_role = models.CharField(
        max_length=20,
        default='student',
        help_text='Default role for users with this domain'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_university_domains'
        verbose_name_plural = 'University Domains'
        ordering = ['university', 'domain']
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.domain} → {self.university.code}"


class UniversityMembership(models.Model):
    """
    Student-University mapping with roles.
    Students are auto-joined based on email domain or manual assignment.
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('staff', 'Staff'),
        ('alumni', 'Alumni'),
        ('admin', 'University Admin'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('graduated', 'Graduated'),
    ]
    
    MAPPED_METHOD_CHOICES = [
        ('email_domain', 'Email Domain'),
        ('manual', 'Manual Selection'),
        ('admin', 'Admin Assignment'),
        ('import', 'Bulk Import'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='university_memberships'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Mapping metadata
    mapped_method = models.CharField(
        max_length=20, 
        choices=MAPPED_METHOD_CHOICES, 
        default='manual',
        help_text='How was this mapping created?'
    )
    is_primary = models.BooleanField(default=True)  # Primary university for this user
    auto_mapped = models.BooleanField(default=False)  # Was this auto-mapped from email domain? (legacy)
    verified_at = models.DateTimeField(null=True, blank=True)
    mapped_at = models.DateTimeField(auto_now_add=True)  # When was mapping created
    
    # Additional info
    student_id = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    faculty = models.CharField(max_length=100, blank=True, null=True)  # School/Faculty name
    program = models.CharField(max_length=150, blank=True, null=True)  # Degree program
    graduation_year = models.IntegerField(null=True, blank=True)
    year_of_study = models.IntegerField(null=True, blank=True)  # Current year (1, 2, 3, 4)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_university_memberships'
        unique_together = ['user', 'university']
        indexes = [
            models.Index(fields=['user', 'is_primary']),
            models.Index(fields=['university', 'status']),
            models.Index(fields=['role']),
            models.Index(fields=['mapped_method']),
        ]
    
    def __str__(self):
        return f"{self.user.email} @ {self.university.name} ({self.role})"


class Post(models.Model):
    """
    Community post model supporting various content types.
    """
    POST_TYPES = [
        ('text', 'Text Post'),
        ('media', 'Media Post'),
        ('event', 'Event'),
        ('achievement', 'Achievement'),
        ('poll', 'Poll'),
        ('announcement', 'Announcement'),  # Faculty/Admin only
    ]
    
    VISIBILITY_CHOICES = [
        ('university', 'University Only'),
        ('global', 'Global (All Universities)'),
        ('private', 'Private'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('hidden', 'Hidden'),
        ('deleted', 'Deleted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_posts'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='posts',
        null=True,
        blank=True,
        help_text='University this post belongs to (null for global posts)'
    )
    
    # Content
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='text')
    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    
    # Media attachments (for media posts)
    media_urls = models.JSONField(
        default=list,
        blank=True,
        help_text='List of media URLs: [{"type": "image", "url": "..."}, ...]'
    )
    
    # External links
    link_url = models.URLField(blank=True, null=True)
    link_preview = models.JSONField(
        default=dict,
        blank=True,
        help_text='Link preview data: {title, description, image}'
    )
    
    # Visibility and status
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='university')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    is_pinned = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    # Tags and mentions
    tags = models.JSONField(default=list, blank=True, help_text='Hashtags: ["hackathon", "security"]')
    mentions = models.JSONField(default=list, blank=True, help_text='Mentioned user IDs')
    
    # Event-specific fields (for event posts)
    event_details = models.JSONField(
        default=dict,
        blank=True,
        help_text='''Event details: {
            "start_time": "2025-01-15T09:00:00Z",
            "end_time": "2025-01-15T17:00:00Z",
            "location": "Virtual / Room 101",
            "modality": "online|onsite|hybrid",
            "registration_url": "https://...",
            "max_participants": 100,
            "rsvp_count": 0,
            "is_competition": true,
            "competition_type": "ctf|hackathon|quiz|webinar",
            "prizes": ["1st: $500", "2nd: $250"]
        }'''
    )
    
    # Achievement-specific fields (for achievement posts)
    achievement_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Type: circle_milestone, mission_complete, badge, certification, portfolio_item'
    )
    achievement_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='''Achievement details: {
            "type": "mission|circle|badge|certification",
            "circle_level": 3,
            "phase": 2,
            "score": 950,
            "badge_name": "DFIR Champion",
            "mission_id": "uuid",
            "portfolio_item_id": "uuid",
            "icon_url": "...",
            "color": "#ff6b35"
        }'''
    )
    
    # Poll-specific fields (for poll posts)
    poll_options = models.JSONField(
        default=list,
        blank=True,
        help_text='''Poll options: [
            {"id": "uuid", "label": "Option A", "votes": 0},
            {"id": "uuid", "label": "Option B", "votes": 0}
        ]'''
    )
    poll_ends_at = models.DateTimeField(null=True, blank=True)
    poll_multiple_choice = models.BooleanField(default=False)
    poll_total_votes = models.IntegerField(default=0)
    
    # Pinning (by faculty/admin)
    pinned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pinned_posts'
    )
    pinned_at = models.DateTimeField(null=True, blank=True)
    pin_expires_at = models.DateTimeField(null=True, blank=True)  # Auto-unpin after date
    
    # Engagement stats (denormalized for performance)
    reaction_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    share_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    trending_score = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text='Computed score for trending algorithm'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'community_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['university', 'status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['post_type', 'status']),
            models.Index(fields=['visibility', 'status', '-created_at']),
            models.Index(fields=['is_pinned', '-created_at']),
            models.Index(fields=['is_featured', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.post_type}: {self.title or self.content[:50]}..."


class Comment(models.Model):
    """
    Threaded comments on posts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_comments'
    )
    
    # For threaded comments
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    # Content
    content = models.TextField()
    mentions = models.JSONField(default=list, blank=True)
    
    # Status
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Engagement
    reaction_count = models.IntegerField(default=0)
    reply_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.post.id}"


class Reaction(models.Model):
    """
    Emoji reactions on posts and comments.
    """
    REACTION_TYPES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('celebrate', '🎉'),
        ('insightful', '💡'),
        ('curious', '🤔'),
        ('fire', '🔥'),
        ('clap', '👏'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_reactions'
    )
    
    # Polymorphic target (post or comment)
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reactions'
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reactions'
    )
    
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_reactions'
        indexes = [
            models.Index(fields=['post', 'reaction_type']),
            models.Index(fields=['comment', 'reaction_type']),
            models.Index(fields=['user', 'post']),
            models.Index(fields=['user', 'comment']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'post', 'reaction_type'],
                condition=models.Q(post__isnull=False),
                name='unique_post_reaction'
            ),
            models.UniqueConstraint(
                fields=['user', 'comment', 'reaction_type'],
                condition=models.Q(comment__isnull=False),
                name='unique_comment_reaction'
            ),
        ]
    
    def __str__(self):
        target = f"post {self.post.id}" if self.post else f"comment {self.comment.id}"
        return f"{self.user.email} reacted {self.reaction_type} on {target}"


class CommunityEvent(models.Model):
    """
    Events, competitions, hackathons, webinars.
    """
    EVENT_TYPES = [
        ('competition', 'Competition'),
        ('hackathon', 'Hackathon'),
        ('webinar', 'Webinar'),
        ('workshop', 'Workshop'),
        ('meetup', 'Meetup'),
        ('ctf', 'CTF Challenge'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    VISIBILITY_CHOICES = [
        ('university', 'University Only'),
        ('global', 'Global (All Universities)'),
        ('invite_only', 'Invite Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Organizer info
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_events'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='events',
        help_text='Host university (null for global events)'
    )
    
    # Event details
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    # Media
    banner_url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    
    # Timing
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    registration_deadline = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Location (virtual or physical)
    is_virtual = models.BooleanField(default=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    meeting_url = models.URLField(blank=True, null=True)
    
    # Visibility and capacity
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='global')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    max_participants = models.IntegerField(null=True, blank=True)
    
    # Prizes and rewards
    prizes = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"place": 1, "reward": "Certificate + Badge", "value": "$500"}, ...]'
    )
    badges_awarded = models.JSONField(
        default=list,
        blank=True,
        help_text='Badges to award: ["hackathon_participant", "ctf_winner"]'
    )
    
    # Stats (denormalized)
    participant_count = models.IntegerField(default=0)
    
    # Related post (auto-created for feed)
    related_post = models.OneToOneField(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='event'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_events'
        ordering = ['starts_at']
        indexes = [
            models.Index(fields=['status', 'starts_at']),
            models.Index(fields=['university', 'status']),
            models.Index(fields=['event_type', 'status']),
            models.Index(fields=['visibility', 'status']),
        ]
    
    def __str__(self):
        return f"{self.event_type}: {self.title}"


class EventParticipant(models.Model):
    """
    Event participation tracking.
    """
    PARTICIPATION_STATUS = [
        ('registered', 'Registered'),
        ('confirmed', 'Confirmed'),
        ('attended', 'Attended'),
        ('no_show', 'No Show'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        CommunityEvent,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='event_participations'
    )
    
    status = models.CharField(max_length=20, choices=PARTICIPATION_STATUS, default='registered')
    
    # For team events
    team_name = models.CharField(max_length=100, blank=True, null=True)
    team_role = models.CharField(max_length=50, blank=True, null=True)
    
    # Results (for competitions)
    placement = models.IntegerField(null=True, blank=True)
    score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'community_event_participants'
        unique_together = ['event', 'user']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} @ {self.event.title}"


class Badge(models.Model):
    """
    Achievement badges for gamification.
    """
    CATEGORY_CHOICES = [
        ('circle', 'Circle Achievement'),
        ('mission', 'Mission Achievement'),
        ('community', 'Community Contribution'),
        ('competition', 'Competition'),
        ('streak', 'Streak'),
        ('special', 'Special'),
    ]
    
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    
    # Visual
    icon_url = models.URLField()
    color = models.CharField(max_length=7, default='#4F46E5')  # Hex color
    
    # Classification
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    
    # Earning criteria
    criteria = models.JSONField(
        default=dict,
        help_text='Criteria to earn: {type: "mission_count", value: 10}'
    )
    points = models.IntegerField(default=10)  # Points awarded
    
    # Status
    is_active = models.BooleanField(default=True)
    is_secret = models.BooleanField(default=False)  # Hidden until earned
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_badges'
        ordering = ['category', 'rarity', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['rarity']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.rarity})"


class UserBadge(models.Model):
    """
    Badges earned by users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='earned_badges'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='earners'
    )
    
    # How it was earned
    earned_at = models.DateTimeField(auto_now_add=True)
    earned_via = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='mission, event, community_action, etc.'
    )
    reference_id = models.UUIDField(
        null=True,
        blank=True,
        help_text='ID of mission/event that awarded this badge'
    )
    
    # Display settings
    is_featured = models.BooleanField(default=False)  # Show on profile
    
    class Meta:
        db_table = 'community_user_badges'
        unique_together = ['user', 'badge']
        indexes = [
            models.Index(fields=['user', 'is_featured']),
            models.Index(fields=['badge', 'earned_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} earned {self.badge.name}"


class Leaderboard(models.Model):
    """
    Leaderboard snapshots for various metrics.
    """
    LEADERBOARD_TYPES = [
        ('overall', 'Overall XP'),
        ('missions', 'Missions Completed'),
        ('community', 'Community Engagement'),
        ('competitions', 'Competition Wins'),
        ('university', 'University Ranking'),
        ('weekly', 'Weekly Top Performers'),
        ('monthly', 'Monthly Top Performers'),
    ]
    
    SCOPE_CHOICES = [
        ('global', 'Global'),
        ('university', 'University'),
        ('track', 'Track'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    leaderboard_type = models.CharField(max_length=20, choices=LEADERBOARD_TYPES)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='global')
    
    # Scope reference (for university/track specific)
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboards'
    )
    track_key = models.CharField(max_length=100, null=True, blank=True)
    
    # Time period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Snapshot data
    rankings = models.JSONField(
        default=list,
        help_text='[{"rank": 1, "user_id": "...", "score": 1500, "change": 2}, ...]'
    )
    
    # University rankings (for university scope)
    university_rankings = models.JSONField(
        default=list,
        help_text='[{"rank": 1, "university_id": "...", "score": 15000, "member_count": 500}, ...]'
    )
    
    # Metadata
    is_current = models.BooleanField(default=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_leaderboards'
        ordering = ['-period_end', 'leaderboard_type']
        indexes = [
            models.Index(fields=['leaderboard_type', 'scope', 'is_current']),
            models.Index(fields=['university', 'leaderboard_type']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.leaderboard_type} - {self.scope} ({self.period_start} to {self.period_end})"


class UserCommunityStats(models.Model):
    """
    Aggregated community stats per user for quick lookups.
    Updated via signals/tasks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='community_stats'
    )
    
    # Engagement metrics
    total_posts = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    total_reactions_given = models.IntegerField(default=0)
    total_reactions_received = models.IntegerField(default=0)
    
    # Gamification
    total_badges = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    
    # Event participation
    events_attended = models.IntegerField(default=0)
    competitions_won = models.IntegerField(default=0)
    
    # Rank (updated periodically)
    global_rank = models.IntegerField(null=True, blank=True)
    university_rank = models.IntegerField(null=True, blank=True)
    
    # Last activity
    last_post_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_user_stats'
        indexes = [
            models.Index(fields=['total_points']),
            models.Index(fields=['global_rank']),
        ]
    
    def __str__(self):
        return f"Stats for {self.user.email}"


class PollVote(models.Model):
    """
    User votes on poll posts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='poll_votes'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='poll_votes'
    )
    option_id = models.IntegerField()  # Index in poll_options array
    voted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_poll_votes'
        unique_together = ['post', 'user', 'option_id']
        indexes = [
            models.Index(fields=['post', 'option_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} voted on {self.post.id}"


class Follow(models.Model):
    """
    User following relationships and topic subscriptions.
    """
    FOLLOW_TYPES = [
        ('user', 'User'),
        ('university', 'University'),
        ('tag', 'Topic/Tag'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following'
    )
    
    follow_type = models.CharField(max_length=20, choices=FOLLOW_TYPES)
    
    # Target (one of these will be set based on follow_type)
    followed_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='followers'
    )
    followed_university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='followers'
    )
    followed_tag = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_follows'
        indexes = [
            models.Index(fields=['follower', 'follow_type']),
            models.Index(fields=['followed_user']),
            models.Index(fields=['followed_university']),
            models.Index(fields=['followed_tag']),
        ]
    
    def __str__(self):
        if self.follow_type == 'user':
            return f"{self.follower.email} follows {self.followed_user.email}"
        elif self.follow_type == 'university':
            return f"{self.follower.email} follows {self.followed_university.name}"
        else:
            return f"{self.follower.email} follows #{self.followed_tag}"


# =============================================================================
# ADVANCED FEATURES - Phase 2 Models
# =============================================================================

class Channel(models.Model):
    """
    Topic Channels - Sub-communities within universities.
    Examples: #DFIR-Track, #Cloud-Security, #CTF-Team, #Study-Groups
    """
    CHANNEL_TYPES = [
        ('track', 'Track Channel'),
        ('project', 'Project Channel'),
        ('interest', 'Interest Group'),
        ('study_group', 'Study Group'),
        ('official', 'Official Announcements'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='channels'
    )
    
    # Channel info
    name = models.CharField(max_length=100)  # "DFIR Squad", "Cloud Security"
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, null=True)
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES, default='interest')
    
    # Visual
    icon = models.CharField(max_length=10, default='#')  # Emoji or character
    color = models.CharField(max_length=7, default='#4F46E5')  # Hex color
    
    # Settings
    member_limit = models.IntegerField(default=50)  # Squad size caps
    is_private = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    requires_approval = models.BooleanField(default=False)
    
    # Track/Circle association
    track_key = models.CharField(max_length=100, null=True, blank=True)
    circle_level = models.IntegerField(null=True, blank=True)
    
    # Stats (denormalized)
    member_count = models.IntegerField(default=0)
    post_count = models.IntegerField(default=0)
    active_today = models.IntegerField(default=0)
    
    # Creator
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_channels'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_channels'
        unique_together = ['university', 'slug']
        ordering = ['-member_count', 'name']
        indexes = [
            models.Index(fields=['university', 'channel_type']),
            models.Index(fields=['university', 'is_private', 'is_archived']),
            models.Index(fields=['track_key']),
            models.Index(fields=['circle_level']),
        ]
    
    def __str__(self):
        return f"#{self.name} ({self.university.code})"


class ChannelMembership(models.Model):
    """
    User membership in channels.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='channel_memberships'
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    
    # Notification settings
    notifications_enabled = models.BooleanField(default=True)
    muted_until = models.DateTimeField(null=True, blank=True)
    
    # Activity
    last_read_at = models.DateTimeField(null=True, blank=True)
    unread_count = models.IntegerField(default=0)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_channel_memberships'
        unique_together = ['channel', 'user']
        indexes = [
            models.Index(fields=['user', 'channel']),
            models.Index(fields=['channel', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.email} in #{self.channel.name}"


class StudySquad(models.Model):
    """
    Study Squads - Micro-cohorts within channels for focused collaboration.
    4-8 members with shared learning goals.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='squads',
        null=True,
        blank=True
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='squads'
    )
    
    # Squad info
    name = models.CharField(max_length=100)  # "Circle 3 DFIR Warriors"
    description = models.TextField(blank=True, null=True)
    goal = models.TextField(blank=True, null=True)  # "Complete 5 missions this week"
    
    # Visual
    icon = models.CharField(max_length=10, default='👥')
    color = models.CharField(max_length=7, default='#8B5CF6')
    
    # Focus
    circle_level = models.IntegerField(null=True, blank=True)
    track_key = models.CharField(max_length=100, null=True, blank=True)
    
    # Settings
    min_members = models.IntegerField(default=4)
    max_members = models.IntegerField(default=8)
    is_open = models.BooleanField(default=True)  # Open for new members
    is_active = models.BooleanField(default=True)
    
    # Progress tracking
    current_mission = models.UUIDField(null=True, blank=True)  # FK to mission
    missions_completed = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    weekly_streak = models.IntegerField(default=0)
    
    # Stats
    member_count = models.IntegerField(default=0)
    
    # Creator
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_squads'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_study_squads'
        ordering = ['-total_points', '-member_count']
        indexes = [
            models.Index(fields=['university', 'is_active']),
            models.Index(fields=['circle_level', 'track_key']),
            models.Index(fields=['is_open', 'member_count']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.member_count}/{self.max_members})"


class SquadMembership(models.Model):
    """
    User membership in study squads.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('leader', 'Leader'),
        ('co_leader', 'Co-Leader'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    squad = models.ForeignKey(
        StudySquad,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='squad_memberships'
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    
    # Contribution tracking
    missions_contributed = models.IntegerField(default=0)
    points_contributed = models.IntegerField(default=0)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_squad_memberships'
        unique_together = ['squad', 'user']
        indexes = [
            models.Index(fields=['user', 'squad']),
            models.Index(fields=['squad', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.email} in {self.squad.name} ({self.role})"


class CommunityReputation(models.Model):
    """
    Reputation System - Points, levels, and badges for community engagement.
    """
    LEVEL_THRESHOLDS = {
        1: 0,
        2: 100,
        3: 300,
        4: 600,
        5: 1000,
        6: 1500,
        7: 2200,
        8: 3000,
        9: 4000,
        10: 5500,
    }
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='community_reputation'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reputation_records'
    )
    
    # Points system
    total_points = models.IntegerField(default=0)
    weekly_points = models.IntegerField(default=0)
    monthly_points = models.IntegerField(default=0)
    
    # Level (1-10)
    level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    
    # Badges earned (list of badge slugs)
    badges = models.JSONField(default=list)
    
    # Special roles/titles
    titles = models.JSONField(
        default=list,
        help_text='Special titles: ["community_mentor", "top_contributor", "ama_host"]'
    )
    
    # Activity stats
    posts_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    reactions_given = models.IntegerField(default=0)
    reactions_received = models.IntegerField(default=0)
    helpful_answers = models.IntegerField(default=0)
    squads_led = models.IntegerField(default=0)
    
    # Timestamps
    updated_at = models.DateTimeField(auto_now=True)
    level_up_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'community_reputation'
        ordering = ['-total_points']
        indexes = [
            models.Index(fields=['level', '-total_points']),
            models.Index(fields=['university', '-total_points']),
            models.Index(fields=['-weekly_points']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - Level {self.level} ({self.total_points} pts)"
    
    def calculate_level(self):
        """Calculate level based on total points."""
        for level in range(10, 0, -1):
            if self.total_points >= self.LEVEL_THRESHOLDS[level]:
                return level
        return 1


class AISummary(models.Model):
    """
    AI-generated summaries for long threads/discussions.
    """
    SUMMARY_TYPES = [
        ('thread', 'Thread Summary'),
        ('daily_digest', 'Daily Digest'),
        ('weekly_recap', 'Weekly Recap'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Target
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ai_summaries'
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ai_summaries'
    )
    
    summary_type = models.CharField(max_length=20, choices=SUMMARY_TYPES, default='thread')
    
    # Content
    summary = models.TextField()
    key_takeaways = models.JSONField(default=list)  # Bullet points
    
    # Metadata
    source_comment_count = models.IntegerField(default=0)
    model_used = models.CharField(max_length=50, default='gpt-4')
    
    # User who requested it (optional)
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requested_summaries'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'community_ai_summaries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['channel', 'summary_type']),
        ]
    
    def __str__(self):
        target = self.post or self.channel
        return f"AI Summary for {target}"


class CollabRoom(models.Model):
    """
    Cross-University Collaboration Rooms for inter-university challenges.
    """
    ROOM_TYPES = [
        ('ctf', 'CTF Challenge'),
        ('hackathon', 'Hackathon'),
        ('project', 'Project Collaboration'),
        ('debate', 'Debate/Discussion'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Room info
    name = models.CharField(max_length=200)  # "UoN vs Strathmore CTF"
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    
    # Participating universities
    universities = models.ManyToManyField(
        University,
        related_name='collab_rooms'
    )
    
    # Linked challenge/mission
    mission_id = models.UUIDField(null=True, blank=True)
    event = models.ForeignKey(
        CommunityEvent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collab_rooms'
    )
    
    # Timing
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    
    # Settings
    max_participants_per_uni = models.IntegerField(default=50)
    is_public = models.BooleanField(default=True)
    
    # Stats
    participant_count = models.IntegerField(default=0)
    
    # Results
    results = models.JSONField(
        default=dict,
        help_text='{"winner_university_id": "...", "scores": {...}}'
    )
    
    # Creator
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_collab_rooms'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_collab_rooms'
        ordering = ['-starts_at']
        indexes = [
            models.Index(fields=['status', 'starts_at']),
            models.Index(fields=['room_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.room_type})"


class CollabRoomParticipant(models.Model):
    """
    Participants in cross-university collaboration rooms.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        CollabRoom,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='collab_participations'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='collab_participants'
    )
    
    # Role
    is_team_lead = models.BooleanField(default=False)
    team_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Scores
    individual_score = models.IntegerField(default=0)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_collab_participants'
        unique_together = ['room', 'user']
        indexes = [
            models.Index(fields=['room', 'university']),
            models.Index(fields=['user', 'room']),
        ]
    
    def __str__(self):
        return f"{self.user.email} in {self.room.name}"


class CommunityContribution(models.Model):
    """
    Track community contributions for TalentScope signals.
    """
    CONTRIBUTION_TYPES = [
        ('accepted_answer', 'Accepted Answer'),
        ('helpful_comment', 'Helpful Comment'),
        ('squad_leader', 'Squad Leadership'),
        ('challenge_win', 'Challenge Win'),
        ('event_host', 'Event Host'),
        ('mentor_session', 'Mentor Session'),
        ('content_creation', 'Content Creation'),
        ('bug_report', 'Bug Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_contributions'
    )
    
    contribution_type = models.CharField(max_length=30, choices=CONTRIBUTION_TYPES)
    points_awarded = models.IntegerField(default=0)
    
    # Reference to what triggered this contribution
    metadata = models.JSONField(
        default=dict,
        help_text='{"post_id": "...", "squad_id": "...", "event_id": "..."}'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_contributions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'contribution_type']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['contribution_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email}: {self.contribution_type} (+{self.points_awarded})"


class EnterpriseCohort(models.Model):
    """
    Enterprise Cohort Views for company-specific communities.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Cohort info
    name = models.CharField(max_length=200)  # "KCB Bank SOC Team"
    description = models.TextField(blank=True, null=True)
    
    # Associations
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enterprise_cohorts'
    )
    enterprise_id = models.UUIDField(null=True, blank=True)  # FK to enterprises table
    enterprise_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Members (list of user IDs)
    members = models.JSONField(default=list)
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_private = models.BooleanField(default=True)
    allow_external_view = models.BooleanField(default=False)
    
    # Stats
    member_count = models.IntegerField(default=0)
    
    # Admin
    admin_users = models.JSONField(default=list)  # List of admin user IDs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_enterprise_cohorts'
        ordering = ['name']
        indexes = [
            models.Index(fields=['enterprise_id', 'is_active']),
            models.Index(fields=['university', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.member_count} members)"


class ModerationLog(models.Model):
    """
    Audit log for moderation actions.
    """
    ACTION_TYPES = [
        ('hide_post', 'Hide Post'),
        ('delete_post', 'Delete Post'),
        ('hide_comment', 'Hide Comment'),
        ('delete_comment', 'Delete Comment'),
        ('warn_user', 'Warn User'),
        ('suspend_user', 'Suspend User'),
        ('pin_post', 'Pin Post'),
        ('unpin_post', 'Unpin Post'),
        ('feature_post', 'Feature Post'),
        ('unfeature_post', 'Unfeature Post'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    moderator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='moderation_actions'
    )
    action = models.CharField(max_length=30, choices=ACTION_TYPES)
    
    # Target
    target_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    target_comment = models.ForeignKey(
        Comment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_moderation_actions'
    )
    
    reason = models.TextField()
    notes = models.TextField(blank=True, null=True)
    
    # Context
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderation_logs'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'community_moderation_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['moderator', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['university', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.moderator.email if self.moderator else 'System'}"

