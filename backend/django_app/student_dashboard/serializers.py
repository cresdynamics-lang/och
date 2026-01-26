"""
Serializers for Student Dashboard API responses.
"""
from rest_framework import serializers
from .models import StudentDashboardCache, DashboardUpdateQueue


class ReadinessSerializer(serializers.Serializer):
    """Readiness metrics from TalentScope."""
    score = serializers.DecimalField(max_digits=4, decimal_places=2)
    time_to_ready = serializers.IntegerField()
    trend_7d = serializers.CharField(required=False, allow_null=True)
    gaps = serializers.ListField(child=serializers.CharField())


class PrimaryActionSerializer(serializers.Serializer):
    """Primary action for today."""
    type = serializers.CharField()
    title = serializers.CharField()
    priority = serializers.CharField()
    cta = serializers.CharField()
    est_hours = serializers.IntegerField(required=False, allow_null=True)


class SecondaryActionSerializer(serializers.Serializer):
    """Secondary actions for today."""
    type = serializers.CharField()
    title = serializers.CharField()
    streak = serializers.IntegerField(required=False, allow_null=True)


class QuickStatsSerializer(serializers.Serializer):
    """Quick stats summary."""
    habits_week = serializers.DecimalField(max_digits=4, decimal_places=2)
    missions_in_review = serializers.IntegerField()
    portfolio_health = serializers.DecimalField(max_digits=4, decimal_places=2)
    cohort_progress = serializers.DecimalField(max_digits=4, decimal_places=2)


class CohortCardSerializer(serializers.Serializer):
    """Cohort information card."""
    name = serializers.CharField()
    mentor = serializers.CharField(required=False, allow_null=True)
    next_event = serializers.DictField(required=False, allow_null=True)


class SubscriptionCardSerializer(serializers.Serializer):
    """Subscription information card."""
    tier = serializers.CharField()
    days_enhanced_left = serializers.IntegerField(required=False, allow_null=True)
    upgrade_cta = serializers.DictField(required=False, allow_null=True)


class NotificationsSerializer(serializers.Serializer):
    """Notifications summary."""
    unread = serializers.IntegerField()
    urgent = serializers.IntegerField()
    summary = serializers.ListField(child=serializers.CharField(), required=False)


class LeaderboardSerializer(serializers.Serializer):
    """Leaderboard rankings."""
    global_rank = serializers.IntegerField(required=False, allow_null=True)
    cohort_rank = serializers.IntegerField(required=False, allow_null=True)


class StudentDashboardSerializer(serializers.Serializer):
    """Complete student dashboard response."""
    readiness = ReadinessSerializer()
    today = serializers.DictField()
    quick_stats = QuickStatsSerializer()
    cards = serializers.DictField()
    notifications = NotificationsSerializer(required=False)
    leaderboard = LeaderboardSerializer(required=False)
    ai_nudge = serializers.CharField(required=False, allow_null=True)
    last_updated = serializers.DateTimeField()


class DashboardActionSerializer(serializers.Serializer):
    """Action tracking request."""
    action = serializers.CharField(required=True)
    mission_id = serializers.UUIDField(required=False, allow_null=True)
    estimated_completion = serializers.DateTimeField(required=False, allow_null=True)
    habit_id = serializers.UUIDField(required=False, allow_null=True)
    reflection_id = serializers.UUIDField(required=False, allow_null=True)


