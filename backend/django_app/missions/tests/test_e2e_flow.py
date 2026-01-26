"""
E2E tests for mission submission flow.
Tests the complete flow: start → upload → submit → AI feedback
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from missions.models import Mission, MissionSubmission, MissionArtifact, AIFeedback
from missions.tasks import process_mission_ai_review
from subscriptions.models import UserSubscription, SubscriptionPlan
import json

User = get_user_model()


class MissionE2EFlowTest(TestCase):
    """E2E test for complete mission submission flow."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='e2e@example.com',
            password='testpass123'
        )
        self.mission = Mission.objects.create(
            code='E2E-01',
            title='E2E Test Mission',
            description='Test mission for E2E flow',
            difficulty='beginner',
            track_key='soc_analyst',
            estimated_time_minutes=60,
            competencies=['siem', 'alerting']
        )
        # Create subscription
        plan = SubscriptionPlan.objects.create(
            name='starter_3',
            max_missions_monthly=10
        )
        UserSubscription.objects.create(
            user=self.user,
            plan=plan,
            status='active'
        )
        self.client.force_login(self.user)
    
    def test_complete_mission_flow(self):
        """Test complete flow: start → upload → submit → AI feedback."""
        # Step 1: Get mission detail (starts mission)
        response = self.client.get(f'/api/v1/student/missions/{self.mission.id}')
        self.assertEqual(response.status_code, 200)
        
        # Verify submission was created
        submission = MissionSubmission.objects.get(
            mission=self.mission,
            user=self.user
        )
        self.assertEqual(submission.status, 'draft')
        
        # Step 2: Upload file
        file = SimpleUploadedFile(
            "test.pdf",
            b"PDF content for mission submission",
            content_type="application/pdf"
        )
        
        upload_response = self.client.post(
            f'/api/v1/student/missions/submissions/{submission.id}/artifacts',
            {'files': [file]},
            format='multipart'
        )
        self.assertEqual(upload_response.status_code, 201)
        
        # Verify artifact created
        artifact = MissionArtifact.objects.filter(submission=submission).first()
        self.assertIsNotNone(artifact)
        self.assertEqual(artifact.kind, 'file')
        
        # Step 3: Submit for AI review
        submit_response = self.client.post(
            f'/api/v1/student/missions/{self.mission.id}/submit',
            {
                'notes': 'E2E test submission',
                'files': [file]
            },
            format='multipart'
        )
        self.assertEqual(submit_response.status_code, 201)
        
        # Verify submission status changed
        submission.refresh_from_db()
        self.assertEqual(submission.status, 'submitted')
        self.assertIsNotNone(submission.submitted_at)
        
        # Step 4: Process AI review (simulate)
        process_mission_ai_review(str(submission.id))
        
        # Verify AI feedback created
        submission.refresh_from_db()
        self.assertIsNotNone(submission.ai_feedback_detail)
        self.assertIsNotNone(submission.ai_score)
        self.assertIn(submission.status, ['ai_reviewed', 'approved'])
        
        # Verify feedback structure
        feedback = submission.ai_feedback_detail
        self.assertIsNotNone(feedback.score)
        self.assertIsInstance(feedback.strengths, list)
        self.assertIsInstance(feedback.gaps, list)
    
    def test_mission_draft_save(self):
        """Test saving mission draft."""
        # Get mission (creates draft)
        self.client.get(f'/api/v1/student/missions/{self.mission.id}')
        
        submission = MissionSubmission.objects.get(
            mission=self.mission,
            user=self.user
        )
        
        # Save draft with notes
        draft_response = self.client.post(
            f'/api/v1/student/missions/{self.mission.id}/draft',
            {
                'notes': 'Draft notes',
                'github_url': 'https://github.com/test/repo'
            },
            content_type='application/json'
        )
        self.assertEqual(draft_response.status_code, 200)
        
        # Verify draft saved
        submission.refresh_from_db()
        self.assertEqual(submission.notes, 'Draft notes')
        self.assertEqual(submission.status, 'draft')
        
        # Verify GitHub artifact created
        artifact = MissionArtifact.objects.filter(
            submission=submission,
            kind='github'
        ).first()
        self.assertIsNotNone(artifact)
        self.assertIn('github.com', artifact.url)

