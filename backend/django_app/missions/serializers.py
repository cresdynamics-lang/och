"""
Missions serializers
"""
from rest_framework import serializers
from .models import Mission, MissionAssignment, MissionSubmission


class MissionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.SerializerMethodField()
    assigned_cohorts = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = [
            'id', 'track_id', 'module_id', 'title', 'description', 'difficulty', 'mission_type',
            'requires_mentor_review', 'requires_lab_integration', 'estimated_duration_min',
            'skills_tags', 'subtasks', 'is_active', 'created_by', 'created_by_email',
            'created_at', 'updated_at', 'assigned_cohorts',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_email(self, obj):
        return getattr(obj.created_by, 'email', None) or ''

    def get_assigned_cohorts(self, obj):
        cohort_assignments = list(obj.assignments.filter(assignment_type='cohort'))
        if not cohort_assignments:
            return []
        cohort_map = self.context.get('cohort_map') or {}
        return [
            {'cohort_id': str(a.cohort_id), 'cohort_name': cohort_map.get(str(a.cohort_id), '—')}
            for a in cohort_assignments
        ]


class MissionAssignmentSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source='mission.title', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    assigned_by_email = serializers.CharField(source='assigned_by.email', read_only=True)
    
    class Meta:
        model = MissionAssignment
        fields = '__all__'
        read_only_fields = ['id', 'assigned_by', 'assigned_at', 'updated_at']


class MissionSubmissionSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source='assignment.mission.title', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    reviewed_by_email = serializers.CharField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = MissionSubmission
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']