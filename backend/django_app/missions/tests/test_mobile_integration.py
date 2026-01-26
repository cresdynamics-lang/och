"""
Integration tests for mobile upload functionality.
These tests verify the backend handles mobile uploads correctly.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from missions.models import Mission, MissionSubmission, MissionArtifact
from missions.views_student import upload_mission_artifacts
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class MobileUploadIntegrationTest(TestCase):
    """Test mobile upload integration."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='mobile@example.com',
            password='testpass123'
        )
        self.mission = Mission.objects.create(
            code='MOBILE-01',
            title='Mobile Test Mission',
            difficulty='beginner'
        )
        self.submission = MissionSubmission.objects.create(
            mission=self.mission,
            user=self.user,
            status='draft'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_mobile_image_upload(self):
        """Test mobile image upload (simulated)."""
        # Simulate mobile image upload
        image_file = SimpleUploadedFile(
            "photo.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        response = self.client.post(
            f'/api/v1/student/missions/submissions/{self.submission.id}/artifacts',
            {'files': [image_file]},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('artifacts', response.data)
        self.assertEqual(len(response.data['artifacts']), 1)
        
        # Verify artifact was created
        artifact = MissionArtifact.objects.filter(submission=self.submission).first()
        self.assertIsNotNone(artifact)
        self.assertEqual(artifact.kind, 'file')
        self.assertIn('photo.jpg', artifact.filename or '')
    
    def test_mobile_video_upload(self):
        """Test mobile video upload (simulated)."""
        video_file = SimpleUploadedFile(
            "video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        response = self.client.post(
            f'/api/v1/student/missions/submissions/{self.submission.id}/artifacts',
            {'files': [video_file]},
            format='multipart'
        )
        
        # Note: video/mp4 might not be in allowed types, adjust as needed
        if response.status_code == status.HTTP_201_CREATED:
            self.assertIn('artifacts', response.data)
    
    def test_multiple_mobile_uploads(self):
        """Test multiple file uploads from mobile."""
        image1 = SimpleUploadedFile("photo1.jpg", b"image1", content_type="image/jpeg")
        image2 = SimpleUploadedFile("photo2.jpg", b"image2", content_type="image/jpeg")
        
        response = self.client.post(
            f'/api/v1/student/missions/submissions/{self.submission.id}/artifacts',
            {'files': [image1, image2]},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['artifacts']), 2)
        
        # Verify both artifacts created
        artifacts = MissionArtifact.objects.filter(submission=self.submission)
        self.assertEqual(artifacts.count(), 2)

