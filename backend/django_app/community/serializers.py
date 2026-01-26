"""
Serializers for Community module.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    University, UniversityDomain, UniversityMembership, Post, Comment, Reaction,
    CommunityEvent, EventParticipant, Badge, UserBadge,
    Leaderboard, UserCommunityStats, PollVote, Follow, ModerationLog,
    # Advanced features
    Channel, ChannelMembership, StudySquad, SquadMembership,
    CommunityReputation, AISummary, CollabRoom, CollabRoomParticipant,
    CommunityContribution, EnterpriseCohort
)

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user info for posts/comments."""
    university_name = serializers.SerializerMethodField()
    current_circle = serializers.SerializerMethodField()
    badge_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar_url', 
                  'university_name', 'current_circle', 'badge_count']
    
    def get_university_name(self, obj):
        membership = obj.university_memberships.filter(is_primary=True).first()
        return membership.university.name if membership else None
    
    def get_current_circle(self, obj):
        # Integration with Profiler/Circles - placeholder
        return None
    
    def get_badge_count(self, obj):
        return obj.earned_badges.count()


class UniversityDomainSerializer(serializers.ModelSerializer):
    """University email domain for auto-mapping."""
    class Meta:
        model = UniversityDomain
        fields = ['id', 'domain', 'domain_type', 'is_active', 'auto_verify', 'default_role']


class UniversitySerializer(serializers.ModelSerializer):
    """Full university details."""
    domains = UniversityDomainSerializer(many=True, read_only=True)
    
    class Meta:
        model = University
        fields = [
            'id', 'name', 'code', 'slug', 'short_name', 'email_domains',
            'logo_url', 'banner_url', 'description', 'website',
            'country', 'city', 'region', 'location', 'timezone',
            'is_verified', 'is_active', 'allow_cross_university_posts',
            'member_count', 'post_count', 'active_student_count',
            'events_count', 'competitions_participated', 'engagement_score',
            'domains', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'member_count', 'post_count', 'active_student_count',
            'events_count', 'competitions_participated', 'engagement_score',
            'created_at', 'updated_at'
        ]


class UniversityListSerializer(serializers.ModelSerializer):
    """Compact university list."""
    class Meta:
        model = University
        fields = [
            'id', 'name', 'code', 'slug', 'short_name', 'logo_url',
            'country', 'city', 'is_verified', 'member_count', 'engagement_score'
        ]


class UniversityMembershipSerializer(serializers.ModelSerializer):
    """User's university membership."""
    university = UniversityListSerializer(read_only=True)
    university_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = UniversityMembership
        fields = [
            'id', 'university', 'university_id', 'role', 'status',
            'mapped_method', 'is_primary', 'auto_mapped', 'verified_at', 'mapped_at',
            'student_id', 'department', 'faculty', 'program',
            'year_of_study', 'graduation_year', 'joined_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'auto_mapped', 'mapped_method', 'verified_at',
            'mapped_at', 'joined_at', 'updated_at'
        ]


class ReactionSerializer(serializers.ModelSerializer):
    """Reaction on post/comment."""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ReactionCountSerializer(serializers.Serializer):
    """Aggregated reaction counts."""
    reaction_type = serializers.CharField()
    count = serializers.IntegerField()
    user_reacted = serializers.BooleanField()


class CommentSerializer(serializers.ModelSerializer):
    """Comment on post."""
    author = UserMiniSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reaction_counts = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'parent', 'content', 'mentions',
            'is_edited', 'is_deleted', 'reaction_count', 'reply_count',
            'replies', 'reaction_counts', 'user_reaction',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'is_edited', 'is_deleted', 
                           'reaction_count', 'reply_count', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        if obj.parent is None:  # Only get replies for top-level comments
            replies = obj.replies.filter(is_deleted=False)[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_reaction_counts(self, obj):
        from django.db.models import Count
        counts = obj.reactions.values('reaction_type').annotate(count=Count('id'))
        return list(counts)
    
    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            return reaction.reaction_type if reaction else None
        return None


class CommentCreateSerializer(serializers.ModelSerializer):
    """Create comment."""
    class Meta:
        model = Comment
        fields = ['post', 'parent', 'content', 'mentions']


class PostSerializer(serializers.ModelSerializer):
    """Full post details."""
    author = UserMiniSerializer(read_only=True)
    university = UniversityListSerializer(read_only=True)
    university_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    pinned_by_user = UserMiniSerializer(source='pinned_by', read_only=True)
    reaction_counts = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    user_poll_vote = serializers.SerializerMethodField()
    top_comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'university', 'university_id', 'post_type',
            'title', 'content', 'media_urls', 'link_url', 'link_preview',
            'visibility', 'status', 'is_pinned', 'is_featured',
            'pinned_by_user', 'pinned_at', 'pin_expires_at',
            'tags', 'mentions',
            # Event fields
            'event_details',
            # Achievement fields
            'achievement_type', 'achievement_data',
            # Poll fields
            'poll_options', 'poll_ends_at', 'poll_multiple_choice', 'poll_total_votes',
            'user_poll_vote',
            # Stats
            'reaction_count', 'comment_count', 'share_count', 'view_count',
            'trending_score', 'reaction_counts', 'user_reaction', 'top_comments',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = [
            'id', 'author', 'reaction_count', 'comment_count', 'share_count',
            'view_count', 'trending_score', 'poll_total_votes',
            'pinned_by_user', 'pinned_at', 'created_at', 'updated_at'
        ]
    
    def get_reaction_counts(self, obj):
        from django.db.models import Count
        counts = obj.reactions.values('reaction_type').annotate(count=Count('id'))
        return list(counts)
    
    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            return reaction.reaction_type if reaction else None
        return None
    
    def get_user_poll_vote(self, obj):
        """Get the option(s) the current user voted for."""
        if obj.post_type != 'poll':
            return None
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            votes = PollVote.objects.filter(post=obj, user=request.user)
            return [v.option_id for v in votes]
        return None
    
    def get_top_comments(self, obj):
        comments = obj.comments.filter(parent=None, is_deleted=False).order_by('-reaction_count')[:3]
        return CommentSerializer(comments, many=True, context=self.context).data


class PostCreateSerializer(serializers.ModelSerializer):
    """Create post."""
    class Meta:
        model = Post
        fields = [
            'university', 'post_type', 'title', 'content', 'media_urls',
            'link_url', 'visibility', 'tags', 'mentions',
            # Event post fields
            'event_details',
            # Achievement post fields
            'achievement_type', 'achievement_data',
            # Poll post fields
            'poll_options', 'poll_ends_at', 'poll_multiple_choice'
        ]
    
    def validate(self, data):
        """Validate post type-specific fields."""
        post_type = data.get('post_type', 'text')
        
        if post_type == 'event':
            event_details = data.get('event_details', {})
            if not event_details.get('start_time'):
                raise serializers.ValidationError({
                    'event_details': 'start_time is required for event posts'
                })
        
        if post_type == 'poll':
            poll_options = data.get('poll_options', [])
            if len(poll_options) < 2:
                raise serializers.ValidationError({
                    'poll_options': 'At least 2 options required for poll posts'
                })
        
        if post_type == 'achievement':
            achievement_data = data.get('achievement_data', {})
            if not achievement_data.get('type'):
                raise serializers.ValidationError({
                    'achievement_data': 'type is required for achievement posts'
                })
        
        return data


class PostListSerializer(serializers.ModelSerializer):
    """Compact post for feed lists."""
    author = UserMiniSerializer(read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True, allow_null=True)
    university_code = serializers.CharField(source='university.code', read_only=True, allow_null=True)
    university_logo = serializers.URLField(source='university.logo_url', read_only=True, allow_null=True)
    user_reaction = serializers.SerializerMethodField()
    user_poll_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'university_name', 'university_code', 'university_logo',
            'post_type', 'title', 'content', 'media_urls',
            'visibility', 'is_pinned', 'is_featured', 'pinned_at',
            'tags',
            # Event fields (for event cards in feed)
            'event_details',
            # Achievement fields
            'achievement_type', 'achievement_data',
            # Poll fields
            'poll_options', 'poll_ends_at', 'poll_multiple_choice', 'poll_total_votes',
            'user_poll_vote',
            # Stats
            'reaction_count', 'comment_count', 'view_count',
            'user_reaction', 'created_at'
        ]
    
    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched reactions if available
            if hasattr(obj, '_prefetched_objects_cache') and 'reactions' in obj._prefetched_objects_cache:
                for reaction in obj.reactions.all():
                    if reaction.user_id == request.user.id:
                        return reaction.reaction_type
                return None
            reaction = obj.reactions.filter(user=request.user).first()
            return reaction.reaction_type if reaction else None
        return None
    
    def get_user_poll_vote(self, obj):
        """Get the option(s) the current user voted for."""
        if obj.post_type != 'poll':
            return None
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            votes = PollVote.objects.filter(post=obj, user=request.user)
            return [v.option_id for v in votes]
        return None


class CommunityEventSerializer(serializers.ModelSerializer):
    """Full event details."""
    created_by = UserMiniSerializer(read_only=True)
    university = UniversityListSerializer(read_only=True)
    university_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    user_participation = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityEvent
        fields = [
            'id', 'created_by', 'university', 'university_id',
            'title', 'slug', 'description', 'event_type',
            'banner_url', 'thumbnail_url',
            'starts_at', 'ends_at', 'registration_deadline', 'timezone',
            'is_virtual', 'location', 'meeting_url',
            'visibility', 'status', 'max_participants',
            'prizes', 'badges_awarded', 'participant_count',
            'user_participation', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'participant_count', 'created_at', 'updated_at']
    
    def get_user_participation(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participation = obj.participants.filter(user=request.user).first()
            if participation:
                return {
                    'status': participation.status,
                    'registered_at': participation.registered_at,
                    'placement': participation.placement
                }
        return None


class CommunityEventListSerializer(serializers.ModelSerializer):
    """Compact event for lists."""
    university_name = serializers.CharField(source='university.name', read_only=True, allow_null=True)
    is_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityEvent
        fields = [
            'id', 'title', 'slug', 'event_type', 'thumbnail_url',
            'starts_at', 'ends_at', 'is_virtual', 'location',
            'visibility', 'status', 'participant_count',
            'university_name', 'is_registered'
        ]
    
    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False


class EventParticipantSerializer(serializers.ModelSerializer):
    """Event participant details."""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = EventParticipant
        fields = [
            'id', 'user', 'status', 'team_name', 'team_role',
            'placement', 'score', 'registered_at', 'checked_in_at'
        ]


class BadgeSerializer(serializers.ModelSerializer):
    """Badge details."""
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'slug', 'description', 'icon_url', 'color',
            'category', 'rarity', 'criteria', 'points', 'is_active', 'is_secret'
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    """User's earned badge."""
    badge = BadgeSerializer(read_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at', 'earned_via', 'is_featured']


class LeaderboardEntrySerializer(serializers.Serializer):
    """Single leaderboard entry."""
    rank = serializers.IntegerField()
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    user_avatar = serializers.URLField(allow_null=True)
    university_name = serializers.CharField(allow_null=True)
    score = serializers.IntegerField()
    change = serializers.IntegerField()  # Rank change since last period


class LeaderboardSerializer(serializers.ModelSerializer):
    """Leaderboard with rankings."""
    university = UniversityListSerializer(read_only=True)
    entries = serializers.SerializerMethodField()
    
    class Meta:
        model = Leaderboard
        fields = [
            'id', 'leaderboard_type', 'scope', 'university', 'track_key',
            'period_start', 'period_end', 'is_current', 'entries', 'generated_at'
        ]
    
    def get_entries(self, obj):
        # Parse rankings JSON and enrich with user data
        return obj.rankings[:50]  # Top 50


class UserCommunityStatsSerializer(serializers.ModelSerializer):
    """User's community statistics."""
    class Meta:
        model = UserCommunityStats
        fields = [
            'total_posts', 'total_comments', 'total_reactions_given',
            'total_reactions_received', 'total_badges', 'total_points',
            'current_streak_days', 'longest_streak_days',
            'events_attended', 'competitions_won',
            'global_rank', 'university_rank',
            'last_post_at', 'last_activity_at'
        ]


class FollowSerializer(serializers.ModelSerializer):
    """Follow relationship."""
    followed_user = UserMiniSerializer(read_only=True)
    followed_university = UniversityListSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = [
            'id', 'follow_type', 'followed_user', 'followed_university',
            'followed_tag', 'created_at'
        ]


class ModerationLogSerializer(serializers.ModelSerializer):
    """Moderation action log."""
    moderator = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = ModerationLog
        fields = [
            'id', 'moderator', 'action', 'target_post', 'target_comment',
            'target_user', 'reason', 'notes', 'university', 'created_at'
        ]
        read_only_fields = ['id', 'moderator', 'created_at']


class FeedQuerySerializer(serializers.Serializer):
    """Query parameters for feed endpoints."""
    feed_type = serializers.ChoiceField(
        choices=[
            'my-university', 'university',  # Home university feed (primary)
            'global',                        # Trending global feed
            'following',                     # From followed users/tags
            'competitions',                  # Events and competitions only
            'achievements',                  # Achievement posts only
        ],
        default='my-university'
    )
    post_type = serializers.ChoiceField(
        choices=['all', 'text', 'media', 'event', 'achievement', 'poll', 'announcement'],
        default='all',
        required=False
    )
    university_id = serializers.UUIDField(required=False, allow_null=True)
    # Filter by Circle/Phase for students at similar stage
    circle = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=10)
    phase = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    # Time-based filtering
    since = serializers.DateTimeField(required=False, allow_null=True)
    # Pagination
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=50)


class SearchQuerySerializer(serializers.Serializer):
    """Search query parameters."""
    q = serializers.CharField(required=True, min_length=2)
    search_type = serializers.ChoiceField(
        choices=['posts', 'users', 'universities', 'events', 'tags'],
        default='posts'
    )
    university_id = serializers.UUIDField(required=False, allow_null=True)
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=50)


# =============================================================================
# ADVANCED FEATURES SERIALIZERS
# =============================================================================

class ChannelSerializer(serializers.ModelSerializer):
    """Full channel details."""
    university = UniversityListSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    reputation_leader = serializers.SerializerMethodField()
    
    class Meta:
        model = Channel
        fields = [
            'id', 'university', 'name', 'slug', 'description', 'channel_type',
            'icon', 'color', 'member_limit', 'is_private', 'is_archived',
            'requires_approval', 'track_key', 'circle_level',
            'member_count', 'post_count', 'active_today',
            'created_by', 'is_member', 'user_role', 'reputation_leader',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'member_count', 'post_count', 
            'active_today', 'created_at', 'updated_at'
        ]
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None
    
    def get_reputation_leader(self, obj):
        """Get the highest reputation member in this channel."""
        # Get top member by reputation
        top_member = obj.memberships.select_related('user').order_by(
            '-user__community_reputation__total_points'
        ).first()
        if top_member:
            try:
                rep = top_member.user.community_reputation
                return {
                    'name': f"{top_member.user.first_name} {top_member.user.last_name}".strip() or top_member.user.email,
                    'avatar_url': top_member.user.avatar_url,
                    'level': rep.level,
                    'points': rep.total_points
                }
            except CommunityReputation.DoesNotExist:
                return None
        return None


class ChannelListSerializer(serializers.ModelSerializer):
    """Compact channel for lists."""
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = Channel
        fields = [
            'id', 'name', 'slug', 'channel_type', 'icon', 'color',
            'member_count', 'member_limit', 'is_private', 'is_member'
        ]
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False


class ChannelCreateSerializer(serializers.ModelSerializer):
    """Create a new channel."""
    class Meta:
        model = Channel
        fields = [
            'name', 'description', 'channel_type', 'icon', 'color',
            'member_limit', 'is_private', 'requires_approval',
            'track_key', 'circle_level'
        ]


class ChannelMembershipSerializer(serializers.ModelSerializer):
    """Channel membership details."""
    user = UserMiniSerializer(read_only=True)
    channel = ChannelListSerializer(read_only=True)
    
    class Meta:
        model = ChannelMembership
        fields = [
            'id', 'channel', 'user', 'role', 'notifications_enabled',
            'muted_until', 'last_read_at', 'unread_count', 'joined_at'
        ]


class StudySquadSerializer(serializers.ModelSerializer):
    """Full study squad details."""
    channel = ChannelListSerializer(read_only=True)
    university = UniversityListSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    members_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = StudySquad
        fields = [
            'id', 'channel', 'university', 'name', 'description', 'goal',
            'icon', 'color', 'circle_level', 'track_key',
            'min_members', 'max_members', 'is_open', 'is_active',
            'current_mission', 'missions_completed', 'total_points', 'weekly_streak',
            'member_count', 'created_by', 'is_member', 'user_role',
            'members_preview', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'member_count', 'missions_completed',
            'total_points', 'weekly_streak', 'created_at', 'updated_at'
        ]
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None
    
    def get_members_preview(self, obj):
        """Get preview of first 5 members."""
        members = obj.memberships.select_related('user')[:5]
        return [
            {
                'id': m.user.id,
                'name': f"{m.user.first_name} {m.user.last_name}".strip() or m.user.email,
                'avatar_url': m.user.avatar_url,
                'role': m.role
            }
            for m in members
        ]


class StudySquadCreateSerializer(serializers.ModelSerializer):
    """Create a new study squad."""
    channel_id = serializers.UUIDField(required=False, allow_null=True)
    
    class Meta:
        model = StudySquad
        fields = [
            'channel_id', 'name', 'description', 'goal',
            'icon', 'color', 'circle_level', 'track_key',
            'min_members', 'max_members', 'is_open'
        ]


class SquadMembershipSerializer(serializers.ModelSerializer):
    """Squad membership details."""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = SquadMembership
        fields = [
            'id', 'user', 'role', 'missions_contributed',
            'points_contributed', 'joined_at'
        ]


class CommunityReputationSerializer(serializers.ModelSerializer):
    """User's community reputation."""
    user = UserMiniSerializer(read_only=True)
    university = UniversityListSerializer(read_only=True)
    next_level_points = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityReputation
        fields = [
            'id', 'user', 'university', 'total_points', 'weekly_points',
            'monthly_points', 'level', 'badges', 'titles',
            'posts_count', 'comments_count', 'reactions_given', 'reactions_received',
            'helpful_answers', 'squads_led', 'next_level_points',
            'updated_at', 'level_up_at'
        ]
    
    def get_next_level_points(self, obj):
        """Get points needed for next level."""
        if obj.level >= 10:
            return 0
        thresholds = CommunityReputation.LEVEL_THRESHOLDS
        return thresholds.get(obj.level + 1, 0) - obj.total_points


class CommunityReputationPublicSerializer(serializers.ModelSerializer):
    """Public view of reputation (for profile overlays)."""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.URLField(source='user.avatar_url', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CommunityReputation
        fields = [
            'user_name', 'user_avatar', 'university_name',
            'total_points', 'weekly_points', 'level', 'badges', 'titles',
            'posts_count', 'reactions_received', 'helpful_answers', 'squads_led'
        ]
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class AISummarySerializer(serializers.ModelSerializer):
    """AI-generated summary."""
    requested_by = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = AISummary
        fields = [
            'id', 'post', 'channel', 'summary_type',
            'summary', 'key_takeaways', 'source_comment_count',
            'model_used', 'requested_by', 'created_at', 'expires_at'
        ]


class AISummaryRequestSerializer(serializers.Serializer):
    """Request AI summary for a post/channel."""
    post_id = serializers.UUIDField(required=False, allow_null=True)
    channel_id = serializers.UUIDField(required=False, allow_null=True)
    summary_type = serializers.ChoiceField(
        choices=['thread', 'daily_digest', 'weekly_recap'],
        default='thread'
    )
    
    def validate(self, data):
        if not data.get('post_id') and not data.get('channel_id'):
            raise serializers.ValidationError(
                "Either post_id or channel_id is required"
            )
        return data


class CollabRoomSerializer(serializers.ModelSerializer):
    """Full collaboration room details."""
    universities = UniversityListSerializer(many=True, read_only=True)
    event = CommunityEventListSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    is_participant = serializers.SerializerMethodField()
    user_university_score = serializers.SerializerMethodField()
    
    class Meta:
        model = CollabRoom
        fields = [
            'id', 'name', 'slug', 'description', 'room_type', 'status',
            'universities', 'mission_id', 'event',
            'starts_at', 'ends_at', 'max_participants_per_uni', 'is_public',
            'participant_count', 'results', 'created_by',
            'is_participant', 'user_university_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'participant_count', 'results',
            'created_at', 'updated_at'
        ]
    
    def get_is_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False
    
    def get_user_university_score(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participant = obj.participants.filter(user=request.user).first()
            if participant and obj.results:
                scores = obj.results.get('scores', {})
                return scores.get(str(participant.university_id), 0)
        return None


class CollabRoomListSerializer(serializers.ModelSerializer):
    """Compact collab room for lists."""
    university_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CollabRoom
        fields = [
            'id', 'name', 'slug', 'room_type', 'status',
            'starts_at', 'ends_at', 'participant_count',
            'university_count', 'is_public'
        ]
    
    def get_university_count(self, obj):
        return obj.universities.count()


class CollabRoomCreateSerializer(serializers.ModelSerializer):
    """Create collaboration room."""
    university_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=2,
        write_only=True
    )
    
    class Meta:
        model = CollabRoom
        fields = [
            'name', 'description', 'room_type', 'university_ids',
            'mission_id', 'starts_at', 'ends_at',
            'max_participants_per_uni', 'is_public'
        ]


class CollabRoomParticipantSerializer(serializers.ModelSerializer):
    """Collab room participant."""
    user = UserMiniSerializer(read_only=True)
    university = UniversityListSerializer(read_only=True)
    
    class Meta:
        model = CollabRoomParticipant
        fields = [
            'id', 'user', 'university', 'is_team_lead',
            'team_name', 'individual_score', 'joined_at'
        ]


class CommunityContributionSerializer(serializers.ModelSerializer):
    """Community contribution record."""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = CommunityContribution
        fields = [
            'id', 'user', 'contribution_type', 'points_awarded',
            'metadata', 'created_at'
        ]


class EnterpriseCohortSerializer(serializers.ModelSerializer):
    """Enterprise cohort details."""
    university = UniversityListSerializer(read_only=True)
    
    class Meta:
        model = EnterpriseCohort
        fields = [
            'id', 'name', 'description', 'university', 'enterprise_id',
            'enterprise_name', 'member_count', 'is_active', 'is_private',
            'allow_external_view', 'created_at', 'updated_at'
        ]


class AwardPointsSerializer(serializers.Serializer):
    """Award reputation points to a user."""
    user_id = serializers.UUIDField()
    points = serializers.IntegerField(min_value=1, max_value=1000)
    reason = serializers.ChoiceField(choices=[
        'joined_channel', 'created_squad', 'accepted_answer',
        'helpful_comment', 'challenge_win', 'event_host',
        'content_creation', 'bug_report', 'manual'
    ])
    metadata = serializers.DictField(required=False, default=dict)

