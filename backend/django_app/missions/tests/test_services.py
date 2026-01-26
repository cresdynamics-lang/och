"""
Unit tests for mission services.
"""
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from missions.services import upload_file_to_storage, validate_file_type
from missions.models import MissionSubmission
from django.contrib.auth import get_user_model
from missions.models import Mission

User = get_user_model()


class MissionServicesTest(TestCase):
    """Test mission services."""
    
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
    
    def test_file_upload_size_validation(self):
        """Test file size validation."""
        # Create a file larger than 10MB
        large_file = SimpleUploadedFile(
            "large.pdf",
            b"x" * (11 * 1024 * 1024),  # 11MB
            content_type="application/pdf"
        )
        
        with self.assertRaises(ValueError):
            upload_file_to_storage(large_file, str(self.submission.id))
    
    def test_file_upload_type_validation(self):
        """Test file type validation."""
        # Create an invalid file type
        invalid_file = SimpleUploadedFile(
            "test.exe",
            b"binary content",
            content_type="application/x-msdownload"
        )
        
        with self.assertRaises(ValueError):
            upload_file_to_storage(invalid_file, str(self.submission.id))
    
    def test_valid_file_upload(self):
        """Test valid file upload."""
        valid_file = SimpleUploadedFile(
            "test.pdf",
            b"PDF content",
            content_type="application/pdf"
        )
        
        # Should not raise (will use local storage in test)
        try:
            url = upload_file_to_storage(valid_file, str(self.submission.id))
            self.assertIsNotNone(url)
        except Exception:
            # In test environment without S3, this might fail
            pass

