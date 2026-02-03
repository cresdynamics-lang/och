"""
Mentor Dashboard Serializers
Complete serialization for mentor command center data.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Mentor, MentorStudentAssignment, MentorStudentNote, MentorSession


class MentorSerializer(serializers.ModelSerializer):
    """Basic mentor profile serializer."""
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Mentor
        fields = [
            'id', 'mentor_slug', 'full_name', 'email', 'bio',
            'expertise_tracks', 'max_students_per_cohort',
            'availability_calendar', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorStudentAssignmentSerializer(serializers.ModelSerializer):
    """Mentor-student assignment serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)

    class Meta:
        model = MentorStudentAssignment
        fields = [
            'id', 'student', 'student_name', 'student_email', 'track_slug',
            'assigned_at', 'last_interaction_at', 'feedback_rating',
            'is_active'
        ]
        read_only_fields = ['id', 'assigned_at']


class MentorStudentNoteSerializer(serializers.ModelSerializer):
    """Mentor notes on students serializer."""
    mentor_name = serializers.CharField(source='mentor.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = MentorStudentNote
        fields = [
            'id', 'mentor', 'mentor_name', 'student', 'student_name',
            'track_slug', 'note_type', 'content', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'mentor', 'mentor_name']


class MentorSessionSerializer(serializers.ModelSerializer):
    """Mentor session serializer."""
    mentor_name = serializers.CharField(source='mentor.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)

    class Meta:
        model = MentorSession
        fields = [
            'id', 'mentor', 'mentor_name', 'student', 'student_name', 'student_email',
            'track_slug', 'title', 'scheduled_at', 'duration_minutes', 'status',
            'meeting_url', 'notes', 'completed_at', 'student_feedback',
            'mentor_feedback', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating mentor sessions."""

    class Meta:
        model = MentorSession
        fields = [
            'student', 'track_slug', 'title', 'scheduled_at',
            'duration_minutes', 'meeting_url', 'notes'
        ]

    def validate_scheduled_at(self, value):
        """Validate session is in the future."""
        if value <= timezone.now():
            raise serializers.ValidationError("Session must be scheduled in the future.")
        return value


class MentorDashboardSerializer(serializers.Serializer):
    """Complete mentor dashboard data serializer."""
    mentor = MentorSerializer()
    assigned_students = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )
    today_priorities = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )
    today_schedule = MentorSessionSerializer(many=True, read_only=True)
    cohort_analytics = serializers.DictField(read_only=True)


class MentorStudentDetailSerializer(serializers.Serializer):
    """Detailed student information for mentor view."""
    student = serializers.DictField()
    assignment = MentorStudentAssignmentSerializer()
    progress = serializers.DictField()
    recent_notes = MentorStudentNoteSerializer(many=True)
    recent_sessions = MentorSessionSerializer(many=True)
    mentor = MentorSerializer()
