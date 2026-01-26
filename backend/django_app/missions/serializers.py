"""
Serializers for Missions MXP.
"""
from rest_framework import serializers
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback


class MissionSerializer(serializers.ModelSerializer):
    """Serializer for missions."""
    
    # Explicitly define required fields for better error messages
    code = serializers.CharField(max_length=50, required=True)
    title = serializers.CharField(max_length=255, required=True)
    difficulty = serializers.ChoiceField(choices=Mission.DIFFICULTY_CHOICES, required=True)
    type = serializers.ChoiceField(choices=Mission.TYPE_CHOICES, required=False, default='lab')
    track_name = serializers.SerializerMethodField()
    program_id = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    
    # Alias field for backward compatibility
    estimated_time_minutes = serializers.IntegerField(
        source='estimated_duration_minutes',
        read_only=True,
        required=False,
        allow_null=True,
        help_text='Alias for estimated_duration_minutes (for backward compatibility)'
    )
    
    class Meta:
        model = Mission
        fields = [
            'id', 'code', 'title', 'description', 'difficulty', 'type',
            'track_id', 'track_key', 'est_hours', 'estimated_duration_minutes', 'estimated_time_minutes',
            'track_name', 'program_id', 'program_name',
            'competencies', 'requirements', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'estimated_time_minutes']
    
    def validate_code(self, value):
        """Validate mission code."""
        if not value or not value.strip():
            raise serializers.ValidationError('Mission code cannot be empty.')
        return value.strip()
    
    def validate_title(self, value):
        """Validate mission title."""
        if not value or not value.strip():
            raise serializers.ValidationError('Mission title cannot be empty.')
        return value.strip()
    
    def validate_track_id(self, value):
        """Convert empty string to None for UUID field."""
        if value == '':
            return None
        return value

    def _track_meta(self, obj):
        """Resolve track metadata from precomputed context (preferred) or None."""
        lookup = self.context.get('track_lookup') or {}
        if not getattr(obj, 'track_id', None):
            return None
        return lookup.get(str(obj.track_id))

    def get_track_name(self, obj):
        meta = self._track_meta(obj)
        return meta.get('name') if meta else None

    def get_program_id(self, obj):
        meta = self._track_meta(obj)
        return meta.get('program_id') if meta else None

    def get_program_name(self, obj):
        meta = self._track_meta(obj)
        return meta.get('program_name') if meta else None


class MissionArtifactSerializer(serializers.ModelSerializer):
    """Serializer for mission artifacts."""
    class Meta:
        model = MissionArtifact
        fields = ['id', 'kind', 'url', 'filename', 'size_bytes', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class AIFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for AI feedback."""
    class Meta:
        model = AIFeedback
        fields = [
            'id', 'score', 'strengths', 'gaps', 'suggestions',
            'competencies_detected', 'full_feedback', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MissionSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for mission submissions."""
    mission = MissionSerializer(read_only=True)
    artifacts = MissionArtifactSerializer(many=True, read_only=True)
    ai_feedback_detail = AIFeedbackSerializer(read_only=True)
    
    class Meta:
        model = MissionSubmission
        fields = [
            'id', 'mission', 'status', 'ai_score', 'mentor_score',
            'ai_feedback', 'mentor_feedback', 'notes', 'portfolio_item_id',
            'submitted_at', 'ai_reviewed_at', 'mentor_reviewed_at',
            'reviewed_at', 'created_at', 'updated_at', 'artifacts', 'ai_feedback_detail'
        ]
        read_only_fields = [
            'id', 'status', 'ai_score', 'mentor_score', 'ai_feedback',
            'mentor_feedback', 'portfolio_item_id', 'submitted_at',
            'ai_reviewed_at', 'mentor_reviewed_at', 'reviewed_at',
            'created_at', 'updated_at'
        ]


class SubmitMissionSerializer(serializers.Serializer):
    """Serializer for submitting missions."""
    notes = serializers.CharField(required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    notebook_url = serializers.URLField(required=False, allow_blank=True)
    video_url = serializers.URLField(required=False, allow_blank=True)
    # Files handled via FormData


class MissionStatusSerializer(serializers.Serializer):
    """Serializer for mission status summary."""
    in_progress = serializers.IntegerField()
    in_review = serializers.IntegerField()
    completed_total = serializers.IntegerField()
    next_recommended = serializers.DictField(required=False, allow_null=True)
