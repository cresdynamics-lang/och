"""
Coaching OS serializers for API responses.
"""
from rest_framework import serializers
from .models import (
    Habit, HabitLog, Goal, Reflection, AICoachSession, AICoachMessage,
    StudentAnalytics, UserRecipeProgress, UserTrackProgress, UserMissionProgress,
    CommunityActivitySummary, MentorshipSession, CoachingSession
)


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = [
            'id', 'user_id', 'name', 'type', 'frequency',
            'streak', 'longest_streak', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HabitLogSerializer(serializers.ModelSerializer):
    habit = HabitSerializer(read_only=True)
    habit_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = HabitLog
        fields = [
            'id', 'habit_id', 'habit', 'user_id', 'date', 'status',
            'notes', 'logged_at'
        ]
        read_only_fields = ['id', 'logged_at']


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = [
            'id', 'user_id', 'type', 'title', 'description',
            'progress', 'target', 'current', 'status',
            'mentor_feedback', 'subscription_tier', 'due_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReflectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reflection
        fields = [
            'id', 'user_id', 'date', 'content', 'sentiment',
            'emotion_tags', 'ai_insights', 'word_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AICoachMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICoachMessage
        fields = [
            'id', 'session_id', 'role', 'content', 'context',
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AICoachSessionSerializer(serializers.ModelSerializer):
    messages = AICoachMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AICoachSession
        fields = [
            'id', 'user_id', 'session_type', 'prompt_count',
            'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Serializers for PostgreSQL-based coaching data (replacing Supabase)

class StudentAnalyticsSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = StudentAnalytics
        fields = [
            'user_id', 'user_email',
            'total_missions_completed', 'average_score', 'total_time_spent_hours',
            'track_code', 'circle_level',
            'lessons_completed', 'modules_completed', 'recipes_completed',
            'posts_count', 'replies_count', 'helpful_votes_received',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserRecipeProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = UserRecipeProgress
        fields = [
            'id', 'user_id', 'recipe_id', 'status', 'rating',
            'time_spent_minutes', 'attempts_count',
            'last_attempted_at', 'completed_at'
        ]
        read_only_fields = ['id']


class UserTrackProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = UserTrackProgress
        fields = [
            'id', 'user_id', 'track_code', 'circle_level',
            'progress_percentage', 'modules_completed', 'lessons_completed', 'missions_completed',
            'average_score', 'highest_score',
            'readiness_score', 'skills_mastered', 'weak_areas',
            'started_at', 'last_activity_at', 'completed_at'
        ]
        read_only_fields = ['id', 'started_at']


class UserMissionProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = UserMissionProgress
        fields = [
            'id', 'user_id', 'mission_id', 'status',
            'score', 'max_score', 'attempts_count', 'time_spent_minutes',
            'level', 'skills_tagged',
            'instructor_feedback', 'user_notes',
            'started_at', 'submitted_at', 'completed_at'
        ]
        read_only_fields = ['id']


class CommunityActivitySummarySerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = CommunityActivitySummary
        fields = [
            'id', 'user_id',
            'total_posts', 'total_replies', 'helpful_votes_given', 'helpful_votes_received',
            'posts_last_30_days', 'replies_last_30_days',
            'engagement_score', 'activity_streak_days',
            'badges_earned', 'communities_joined',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorshipSessionSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = MentorshipSession
        fields = [
            'id', 'user_id', 'mentor_id',
            'topic', 'description', 'status',
            'scheduled_at', 'duration_minutes', 'actual_duration_minutes',
            'user_feedback', 'mentor_feedback', 'session_notes',
            'user_rating', 'mentor_rating',
            'created_at', 'updated_at', 'started_at', 'ended_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CoachingSessionSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = CoachingSession
        fields = [
            'id', 'user_id', 'trigger', 'context', 'model_used',
            'advice', 'complexity_score',
            'user_rating', 'user_feedback',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
