"""
Unit tests for mission serializers.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from missions.models import Mission, MissionSubmission, MissionArtifact, AIFeedback
from missions.serializers import (
    MissionSerializer,
    MissionSubmissionSerializer,
    MissionArtifactSerializer,
    AIFeedbackSerializer
)

User = get_user_model()


class MissionSerializerTest(TestCase):
    """Test MissionSerializer."""
    
    def setUp(self):
        self.mission = Mission.objects.create(
            code='TEST-01',
            title='Test Mission',
            description='Test description',
            difficulty='beginner',
            type='lab',
            track_key='soc_analyst',
            estimated_time_minutes=60,
            competencies=['siem'],
            requirements={}
        )
    
    def test_mission_serialization(self):
        """Test mission can be serialized."""
        serializer = MissionSerializer(self.mission)
        data = serializer.data
        self.assertEqual(data['code'], 'TEST-01')
        self.assertEqual(data['difficulty'], 'beginner')
        self.assertIn('id', data)


class MissionSubmissionSerializerTest(TestCase):
    """Test MissionSubmissionSerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.mission = Mission.objects.create(
            code='TEST-01',
            title='Test Mission',
            difficulty='beginner'
        )
        self.submission = MissionSubmission.objects.create(
            mission=self.mission,
            user=self.user,
            status='draft'
        )
    
    def test_submission_serialization(self):
        """Test submission can be serialized."""
        serializer = MissionSubmissionSerializer(self.submission)
        data = serializer.data
        self.assertEqual(data['status'], 'draft')
        self.assertIn('mission', data)
        self.assertIn('artifacts', data)

