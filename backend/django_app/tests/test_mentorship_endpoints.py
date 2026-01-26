"""
Test suite for Mentorship endpoints.

Endpoints tested:
- GET /api/v1/mentorships/{mentee_id}/chat
- POST /api/v1/mentorships/{mentee_id}/chat
- GET /api/v1/mentorships/{mentee_id}/presence
"""
import pytest
from rest_framework import status
from mentorship.models import ChatMessage, ChatAttachment
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.mark.django_db
@pytest.mark.student
class TestChatMessagesEndpoint:
    """Test GET /api/v1/mentorships/{mentee_id}/chat"""

    def test_get_chat_messages_as_mentee(self, authenticated_client, test_user):
        """Test getting chat messages as the mentee."""
        # Create a test message
        ChatMessage.objects.create(
            mentee=test_user,
            message='Test message',
            sender_type='mentee'
        )
        response = authenticated_client.get(f'/api/v1/mentorships/{test_user.id}/chat')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_get_chat_messages_with_mentor_filter(self, authenticated_client, test_user, mentor_user):
        """Test getting chat messages filtered by mentor."""
        ChatMessage.objects.create(
            mentee=test_user,
            mentor=mentor_user,
            message='Test message',
            sender_type='mentee'
        )
        response = authenticated_client.get(
            f'/api/v1/mentorships/{test_user.id}/chat?mentor_id={mentor_user.id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_get_chat_messages_as_mentor(self, mentor_client, mentor_user, student_user):
        """Test getting chat messages as mentor."""
        ChatMessage.objects.create(
            mentee=student_user,
            mentor=mentor_user,
            message='Test message',
            sender_type='mentee'
        )
        response = mentor_client.get(f'/api/v1/mentorships/{student_user.id}/chat')
        assert response.status_code == status.HTTP_200_OK

    def test_get_chat_messages_unauthorized(self, authenticated_client, student_user):
        """Test getting chat messages for another user (should fail)."""
        response = authenticated_client.get(f'/api/v1/mentorships/{student_user.id}/chat')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_chat_messages_unauthenticated(self, api_client, test_user):
        """Test getting chat messages without authentication."""
        response = api_client.get(f'/api/v1/mentorships/{test_user.id}/chat')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_chat_messages_invalid_mentee_id(self, authenticated_client):
        """Test getting chat messages with invalid mentee ID."""
        response = authenticated_client.get('/api/v1/mentorships/invalid-id/chat')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.student
class TestSendChatMessageEndpoint:
    """Test POST /api/v1/mentorships/{mentee_id}/chat"""

    def test_send_chat_message_success(self, authenticated_client, test_user):
        """Test sending chat message successfully."""
        data = {
            'message': 'Hello, this is a test message',
            'mentor_id': None
        }
        response = authenticated_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='json'
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert ChatMessage.objects.filter(mentee=test_user).exists()

    def test_send_chat_message_with_mentor(self, authenticated_client, test_user, mentor_user, mentor_role):
        """Test sending chat message to specific mentor."""
        # Assign mentor role
        from users.models import UserRole
        UserRole.objects.create(user=mentor_user, role=mentor_role, scope='global')
        
        data = {
            'message': 'Hello mentor',
            'mentor_id': str(mentor_user.id)
        }
        response = authenticated_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='json'
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_send_chat_message_empty(self, authenticated_client, test_user):
        """Test sending empty message (should fail)."""
        data = {'message': ''}
        response = authenticated_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_send_chat_message_other_user(self, authenticated_client, student_user):
        """Test sending message as another user (should fail)."""
        data = {'message': 'Unauthorized message'}
        response = authenticated_client.post(
            f'/api/v1/mentorships/{student_user.id}/chat',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_send_chat_message_unauthenticated(self, api_client, test_user):
        """Test sending message without authentication."""
        data = {'message': 'Test message'}
        response = api_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_send_chat_message_with_file(self, authenticated_client, test_user):
        """Test sending message with file attachment."""
        file = SimpleUploadedFile("test.txt", b"file content", content_type="text/plain")
        data = {
            'message': 'Message with file',
            'attachments': [file]
        }
        response = authenticated_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='multipart'
        )
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_send_chat_message_large_file(self, authenticated_client, test_user):
        """Test sending message with file exceeding size limit."""
        # Create a file larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        file = SimpleUploadedFile("large.txt", large_content, content_type="text/plain")
        data = {
            'message': 'Message with large file',
            'attachments': [file]
        }
        response = authenticated_client.post(
            f'/api/v1/mentorships/{test_user.id}/chat',
            data,
            format='multipart'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.student
class TestMentorPresenceEndpoint:
    """Test GET /api/v1/mentorships/{mentee_id}/presence"""

    def test_get_mentor_presence_as_mentee(self, authenticated_client, test_user):
        """Test getting mentor presence as mentee."""
        response = authenticated_client.get(f'/api/v1/mentorships/{test_user.id}/presence')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_get_mentor_presence_other_user(self, authenticated_client, student_user):
        """Test getting mentor presence for another user (should fail)."""
        response = authenticated_client.get(f'/api/v1/mentorships/{student_user.id}/presence')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_mentor_presence_unauthenticated(self, api_client, test_user):
        """Test getting mentor presence without authentication."""
        response = api_client.get(f'/api/v1/mentorships/{test_user.id}/presence')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_mentor_presence_invalid_id(self, authenticated_client):
        """Test getting mentor presence with invalid ID."""
        response = authenticated_client.get('/api/v1/mentorships/invalid-id/presence')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
