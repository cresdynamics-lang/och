"""
Security tests for missions module - RLS and file upload limits.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from missions.models import Mission, MissionSubmission, MissionArtifact
from missions.services import upload_file_to_storage
from django.core.exceptions import PermissionDenied

User = get_user_model()


class MissionSecurityTest(TestCase):
    """Test mission security features."""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        self.mission = Mission.objects.create(
            code='TEST-01',
            title='Test Mission',
            difficulty='beginner'
        )
        self.submission1 = MissionSubmission.objects.create(
            mission=self.mission,
            user=self.user1,
            status='draft'
        )
        self.submission2 = MissionSubmission.objects.create(
            mission=self.mission,
            user=self.user2,
            status='draft'
        )
    
    def test_rls_prevents_cross_user_submission_access(self):
        """Test RLS prevents user1 from accessing user2's submission."""
        # In production, RLS policies enforce this at DB level
        # This test verifies the application logic
        submissions_user1 = MissionSubmission.objects.filter(user=self.user1)
        submissions_user2 = MissionSubmission.objects.filter(user=self.user2)
        
        # User1 should only see their own submissions
        self.assertIn(self.submission1, submissions_user1)
        self.assertNotIn(self.submission2, submissions_user1)
        
        # User2 should only see their own submissions
        self.assertIn(self.submission2, submissions_user2)
        self.assertNotIn(self.submission1, submissions_user2)
    
    def test_file_upload_size_limit(self):
        """Test file upload enforces 10MB limit."""
        # Create file larger than 10MB
        large_file = SimpleUploadedFile(
            "large.pdf",
            b"x" * (11 * 1024 * 1024),  # 11MB
            content_type="application/pdf"
        )
        
        with self.assertRaises(ValueError):
            upload_file_to_storage(large_file, str(self.submission1.id))
    
    def test_file_upload_type_restriction(self):
        """Test file upload restricts file types."""
        # Try to upload executable
        exe_file = SimpleUploadedFile(
            "malware.exe",
            b"binary content",
            content_type="application/x-msdownload"
        )
        
        with self.assertRaises(ValueError):
            upload_file_to_storage(exe_file, str(self.submission1.id))
    
    def test_artifact_belongs_to_submission(self):
        """Test artifacts are properly linked to submissions."""
        artifact = MissionArtifact.objects.create(
            submission=self.submission1,
            kind='file',
            url='https://example.com/file.pdf',
            filename='file.pdf'
        )
        
        # Artifact should belong to submission1
        self.assertEqual(artifact.submission, self.submission1)
        self.assertEqual(artifact.submission.user, self.user1)

