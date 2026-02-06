"""
Missions serializers
"""
from rest_framework import serializers
from .models import Mission, MissionAssignment, MissionSubmission


class MissionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Mission
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


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