"""
Serializers for Profiler Engine.
"""
from rest_framework import serializers
from .models import ProfilerSession, ProfilerAnswer


class ProfilerAnswerSerializer(serializers.ModelSerializer):
    """Serializer for profiler answers."""
    class Meta:
        model = ProfilerAnswer
        fields = ['id', 'question_key', 'answer', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProfilerSessionSerializer(serializers.ModelSerializer):
    """Serializer for profiler session."""
    answers = ProfilerAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProfilerSession
        fields = [
            'id', 'status', 'current_self_assessment', 'futureyou_persona',
            'recommended_track_id', 'track_confidence', 'created_at',
            'completed_at', 'answers'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class StartProfilerSerializer(serializers.Serializer):
    """Serializer for starting profiler session."""
    pass  # No input required


class SubmitAnswersSerializer(serializers.Serializer):
    """Serializer for submitting profiler answers."""
    session_id = serializers.UUIDField(required=True)
    answers = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )


class FutureYouRequestSerializer(serializers.Serializer):
    """Serializer for generating Future-You persona."""
    session_id = serializers.UUIDField(required=True)


class ProfilerStatusSerializer(serializers.Serializer):
    """Serializer for profiler status response."""
    status = serializers.CharField()
    track_recommendation = serializers.DictField(required=False, allow_null=True)
    current_self_complete = serializers.BooleanField()
    future_you_complete = serializers.BooleanField()

