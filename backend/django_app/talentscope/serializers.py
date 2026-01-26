"""
Serializers for TalentScope API.
"""
from rest_framework import serializers
from .models import SkillSignal, BehaviorSignal, MentorInfluence, ReadinessSnapshot


class SkillSignalSerializer(serializers.ModelSerializer):
    """Serializer for skill signals."""
    class Meta:
        model = SkillSignal
        fields = [
            'id', 'skill_name', 'skill_category', 'mastery_level',
            'hours_practiced', 'last_practiced', 'source', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BehaviorSignalSerializer(serializers.ModelSerializer):
    """Serializer for behavior signals."""
    class Meta:
        model = BehaviorSignal
        fields = [
            'id', 'behavior_type', 'value', 'metadata',
            'source', 'recorded_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MentorInfluenceSerializer(serializers.ModelSerializer):
    """Serializer for mentor influence."""
    class Meta:
        model = MentorInfluence
        fields = [
            'id', 'mentor', 'session_id', 'submission_rate',
            'code_quality_score', 'mission_completion_rate',
            'performance_score', 'influence_index',
            'period_start', 'period_end', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReadinessSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for readiness snapshots."""
    class Meta:
        model = ReadinessSnapshot
        fields = [
            'id', 'core_readiness_score', 'estimated_readiness_window',
            'learning_velocity', 'career_readiness_stage',
            'job_fit_score', 'hiring_timeline_prediction',
            'breakdown', 'strengths', 'weaknesses', 'missing_skills',
            'improvement_plan', 'track_benchmarks', 'snapshot_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReadinessOverTimeSerializer(serializers.Serializer):
    """Serializer for readiness over time response."""
    date = serializers.DateField()
    score = serializers.DecimalField(max_digits=5, decimal_places=2)
    category = serializers.CharField(required=False)


class SkillHeatmapSerializer(serializers.Serializer):
    """Serializer for skill heatmap response."""
    skill_name = serializers.CharField()
    category = serializers.CharField()
    mastery_level = serializers.DecimalField(max_digits=5, decimal_places=2)
    last_practiced = serializers.DateTimeField(required=False, allow_null=True)


class SkillMasterySerializer(serializers.Serializer):
    """Serializer for skill mastery response."""
    skill_id = serializers.UUIDField()
    skill_name = serializers.CharField()
    category = serializers.CharField()
    mastery_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    hours_practiced = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_updated = serializers.DateTimeField()


class BehavioralTrendSerializer(serializers.Serializer):
    """Serializer for behavioral trends response."""
    date = serializers.DateField()
    missions_completed = serializers.IntegerField()
    hours_studied = serializers.DecimalField(max_digits=10, decimal_places=2)
    reflections_count = serializers.IntegerField()


class ReadinessWindowSerializer(serializers.Serializer):
    """Serializer for readiness window response."""
    label = serializers.CharField()
    estimated_date = serializers.DateField()
    confidence = serializers.ChoiceField(choices=['high', 'medium', 'low'])
    category = serializers.CharField()
