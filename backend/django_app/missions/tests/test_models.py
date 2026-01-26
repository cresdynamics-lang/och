"""
Unit tests for mission models.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from missions.models import Mission, MissionSubmission, MissionArtifact, AIFeedback
import uuid

User = get_user_model()


class MissionModelTest(TestCase):
    """Test Mission model."""
    
    def setUp(self):
        self.mission = Mission.objects.create(
            code='TEST-01',
            title='Test Mission',
            description='Test description',
            difficulty='beginner',
            type='lab',
            track_key='soc_analyst',
            estimated_time_minutes=60,
            competencies=['siem', 'alerting'],
            requirements={'objectives': ['Learn SIEM basics']}
        )
    
    def test_mission_creation(self):
        """Test mission can be created."""
        self.assertEqual(self.mission.code, 'TEST-01')
        self.assertEqual(self.mission.difficulty, 'beginner')
        self.assertIsNotNone(self.mission.id)
    
    def test_mission_str(self):
        """Test mission string representation."""
        self.assertIn('TEST-01', str(self.mission))


class MissionSubmissionModelTest(TestCase):
    """Test MissionSubmission model."""
    
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
    
    def test_submission_creation(self):
        """Test submission can be created."""
        self.assertEqual(self.submission.status, 'draft')
        self.assertEqual(self.submission.user, self.user)
        self.assertEqual(self.submission.mission, self.mission)
    
    def test_submission_unique_together(self):
        """Test unique constraint on mission+user."""
        # Should not be able to create duplicate
        with self.assertRaises(Exception):
            MissionSubmission.objects.create(
                mission=self.mission,
                user=self.user,
                status='submitted'
            )


class MissionArtifactModelTest(TestCase):
    """Test MissionArtifact model."""
    
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
    
    def test_artifact_creation(self):
        """Test artifact can be created."""
        artifact = MissionArtifact.objects.create(
            submission=self.submission,
            kind='file',
            url='https://example.com/file.pdf',
            filename='file.pdf',
            size_bytes=1024
        )
        self.assertEqual(artifact.kind, 'file')
        self.assertEqual(artifact.submission, self.submission)


class AIFeedbackModelTest(TestCase):
    """Test AIFeedback model."""
    
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
            status='submitted'
        )
    
    def test_ai_feedback_creation(self):
        """Test AI feedback can be created."""
        feedback = AIFeedback.objects.create(
            submission=self.submission,
            score=85.5,
            strengths=['Good analysis', 'Clear documentation'],
            gaps=['Missing correlation'],
            suggestions=['Add more context']
        )
        self.assertEqual(float(feedback.score), 85.5)
        self.assertEqual(len(feedback.strengths), 2)

