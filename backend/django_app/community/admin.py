"""
Django Admin configuration for Community module.
"""
from django.contrib import admin
from .models import (
    University, UniversityDomain, UniversityMembership, Post, Comment, Reaction,
    CommunityEvent, EventParticipant, Badge, UserBadge,
    Leaderboard, UserCommunityStats, PollVote, Follow, ModerationLog,
    # Advanced features
    Channel, ChannelMembership, StudySquad, SquadMembership,
    CommunityReputation, AISummary, CollabRoom, CollabRoomParticipant,
    CommunityContribution, EnterpriseCohort
)


class UniversityDomainInline(admin.TabularInline):
    """Inline admin for university email domains."""
    model = UniversityDomain
    extra = 1
    fields = ['domain', 'domain_type', 'default_role', 'is_active', 'auto_verify']


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'short_name', 'country', 'member_count', 'engagement_score', 'is_verified', 'is_active']
    list_filter = ['is_verified', 'is_active', 'country']
    search_fields = ['name', 'code', 'short_name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['member_count', 'post_count', 'active_student_count', 'events_count', 'engagement_score', 'created_at', 'updated_at']
    inlines = [UniversityDomainInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'code', 'slug', 'short_name')
        }),
        ('Contact & Location', {
            'fields': ('website', 'country', 'city', 'region', 'location', 'timezone')
        }),
        ('Branding', {
            'fields': ('logo_url', 'banner_url', 'description')
        }),
        ('Settings', {
            'fields': ('is_verified', 'is_active', 'allow_cross_university_posts')
        }),
        ('Legacy Domains', {
            'fields': ('email_domains',),
            'classes': ('collapse',),
            'description': 'Use the Domains inline below instead for new domain mappings.'
        }),
        ('Statistics (Read-only)', {
            'fields': ('member_count', 'post_count', 'active_student_count', 'events_count', 'competitions_participated', 'engagement_score'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UniversityDomain)
class UniversityDomainAdmin(admin.ModelAdmin):
    list_display = ['domain', 'university', 'domain_type', 'default_role', 'is_active', 'auto_verify']
    list_filter = ['domain_type', 'is_active', 'auto_verify', 'default_role']
    search_fields = ['domain', 'university__name', 'university__code']
    raw_id_fields = ['university']


@admin.register(UniversityMembership)
class UniversityMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'university', 'role', 'status', 'mapped_method', 'is_primary', 'joined_at']
    list_filter = ['role', 'status', 'is_primary', 'mapped_method', 'auto_mapped']
    search_fields = ['user__email', 'university__name', 'university__code', 'student_id']
    raw_id_fields = ['user', 'university']
    readonly_fields = ['mapped_at']
    fieldsets = (
        (None, {
            'fields': ('user', 'university', 'role', 'status')
        }),
        ('Mapping Details', {
            'fields': ('mapped_method', 'is_primary', 'auto_mapped', 'verified_at', 'mapped_at')
        }),
        ('Student Info', {
            'fields': ('student_id', 'department', 'faculty', 'program', 'year_of_study', 'graduation_year')
        }),
    )


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'post_type', 'visibility', 'status', 'reaction_count', 'comment_count', 'created_at']
    list_filter = ['post_type', 'visibility', 'status', 'is_pinned', 'is_featured']
    search_fields = ['title', 'content', 'author__email']
    raw_id_fields = ['author', 'university']
    readonly_fields = ['reaction_count', 'comment_count', 'share_count', 'view_count', 'created_at', 'updated_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'post', 'reaction_count', 'is_deleted', 'created_at']
    list_filter = ['is_deleted', 'is_edited']
    search_fields = ['content', 'author__email']
    raw_id_fields = ['author', 'post', 'parent']


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'reaction_type', 'post', 'comment', 'created_at']
    list_filter = ['reaction_type']
    search_fields = ['user__email']
    raw_id_fields = ['user', 'post', 'comment']


@admin.register(CommunityEvent)
class CommunityEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'status', 'starts_at', 'ends_at', 'participant_count', 'visibility']
    list_filter = ['event_type', 'status', 'visibility', 'is_virtual']
    search_fields = ['title', 'description', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['created_by', 'university', 'related_post']
    readonly_fields = ['participant_count', 'created_at', 'updated_at']


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'status', 'placement', 'registered_at']
    list_filter = ['status']
    search_fields = ['user__email', 'event__title', 'team_name']
    raw_id_fields = ['user', 'event']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'rarity', 'points', 'is_active', 'is_secret']
    list_filter = ['category', 'rarity', 'is_active', 'is_secret']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at', 'earned_via', 'is_featured']
    list_filter = ['badge__category', 'badge__rarity', 'is_featured']
    search_fields = ['user__email', 'badge__name']
    raw_id_fields = ['user', 'badge']


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['leaderboard_type', 'scope', 'university', 'period_start', 'period_end', 'is_current']
    list_filter = ['leaderboard_type', 'scope', 'is_current']
    search_fields = ['university__name']
    raw_id_fields = ['university']


@admin.register(UserCommunityStats)
class UserCommunityStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_points', 'total_badges', 'global_rank', 'university_rank', 'current_streak_days']
    search_fields = ['user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'option_id', 'voted_at']
    raw_id_fields = ['user', 'post']


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'follow_type', 'followed_user', 'followed_university', 'followed_tag', 'created_at']
    list_filter = ['follow_type']
    search_fields = ['follower__email', 'followed_user__email', 'followed_university__name', 'followed_tag']
    raw_id_fields = ['follower', 'followed_user', 'followed_university']


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'moderator', 'target_user', 'university', 'created_at']
    list_filter = ['action', 'university']
    search_fields = ['moderator__email', 'target_user__email', 'reason']
    raw_id_fields = ['moderator', 'target_post', 'target_comment', 'target_user', 'university']
    readonly_fields = ['created_at']


# =============================================================================
# ADVANCED FEATURES - Admin Registration
# =============================================================================

class ChannelMembershipInline(admin.TabularInline):
    model = ChannelMembership
    extra = 0
    raw_id_fields = ['user']


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'university', 'channel_type', 'member_count', 'is_private', 'is_archived', 'created_at']
    list_filter = ['channel_type', 'is_private', 'is_archived', 'university']
    search_fields = ['name', 'slug', 'description', 'university__name']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['university', 'created_by']
    readonly_fields = ['member_count', 'post_count', 'active_today', 'created_at', 'updated_at']
    inlines = [ChannelMembershipInline]


@admin.register(ChannelMembership)
class ChannelMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'channel', 'role', 'joined_at', 'notifications_enabled']
    list_filter = ['role', 'notifications_enabled']
    search_fields = ['user__email', 'channel__name']
    raw_id_fields = ['user', 'channel']


class SquadMembershipInline(admin.TabularInline):
    model = SquadMembership
    extra = 0
    raw_id_fields = ['user']


@admin.register(StudySquad)
class StudySquadAdmin(admin.ModelAdmin):
    list_display = ['name', 'university', 'circle_level', 'member_count', 'total_points', 'is_open', 'is_active']
    list_filter = ['circle_level', 'is_open', 'is_active', 'university']
    search_fields = ['name', 'description', 'goal']
    raw_id_fields = ['university', 'channel', 'created_by']
    readonly_fields = ['member_count', 'missions_completed', 'total_points', 'weekly_streak', 'created_at', 'updated_at']
    inlines = [SquadMembershipInline]


@admin.register(SquadMembership)
class SquadMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'squad', 'role', 'missions_contributed', 'points_contributed', 'joined_at']
    list_filter = ['role']
    search_fields = ['user__email', 'squad__name']
    raw_id_fields = ['user', 'squad']


@admin.register(CommunityReputation)
class CommunityReputationAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'total_points', 'weekly_points', 'squads_led', 'helpful_answers', 'university']
    list_filter = ['level', 'university']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user', 'university']
    readonly_fields = ['updated_at', 'level_up_at']


@admin.register(AISummary)
class AISummaryAdmin(admin.ModelAdmin):
    list_display = ['id', 'summary_type', 'post', 'channel', 'source_comment_count', 'model_used', 'created_at']
    list_filter = ['summary_type', 'model_used']
    search_fields = ['summary']
    raw_id_fields = ['post', 'channel', 'requested_by']
    readonly_fields = ['created_at']


class CollabRoomParticipantInline(admin.TabularInline):
    model = CollabRoomParticipant
    extra = 0
    raw_id_fields = ['user', 'university']


@admin.register(CollabRoom)
class CollabRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'status', 'participant_count', 'starts_at', 'ends_at']
    list_filter = ['room_type', 'status', 'is_public']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['event', 'created_by']
    filter_horizontal = ['universities']
    readonly_fields = ['participant_count', 'created_at', 'updated_at']
    inlines = [CollabRoomParticipantInline]


@admin.register(CollabRoomParticipant)
class CollabRoomParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'university', 'is_team_lead', 'individual_score', 'joined_at']
    list_filter = ['is_team_lead', 'university']
    search_fields = ['user__email', 'room__name', 'team_name']
    raw_id_fields = ['user', 'room', 'university']


@admin.register(CommunityContribution)
class CommunityContributionAdmin(admin.ModelAdmin):
    list_display = ['user', 'contribution_type', 'points_awarded', 'created_at']
    list_filter = ['contribution_type']
    search_fields = ['user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at']


@admin.register(EnterpriseCohort)
class EnterpriseCohortAdmin(admin.ModelAdmin):
    list_display = ['name', 'enterprise_name', 'university', 'member_count', 'is_active', 'is_private']
    list_filter = ['is_active', 'is_private', 'allow_external_view', 'university']
    search_fields = ['name', 'enterprise_name', 'description']
    raw_id_fields = ['university']
    readonly_fields = ['member_count', 'created_at', 'updated_at']

