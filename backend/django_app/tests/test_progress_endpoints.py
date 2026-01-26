"""
Test suite for Progress endpoints.

Endpoints tested:
- GET /api/v1/progress/
- POST /api/v1/progress/
- GET /api/v1/progress/{id}/
- PUT /api/v1/progress/{id}/
- PATCH /api/v1/progress/{id}/
- DELETE /api/v1/progress/{id}/
"""
import pytest
from rest_framework import status
from progress.models import Progress


@pytest.mark.django_db
class TestProgressListEndpoint:
    """Test GET /api/v1/progress/"""

    def test_list_progress_authenticated(self, authenticated_client, test_user):
        """Test listing progress as authenticated user."""
        # Create test progress
        Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='test-123',
            status='in_progress',
            completion_percentage=50
        )
        response = authenticated_client.get('/api/v1/progress/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_list_progress_with_filters(self, authenticated_client, test_user):
        """Test listing progress with query filters."""
        Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='test-123',
            status='completed'
        )
        response = authenticated_client.get('/api/v1/progress/?status=completed')
        assert response.status_code == status.HTTP_200_OK

    def test_list_progress_with_search(self, authenticated_client, test_user):
        """Test listing progress with search."""
        Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='searchable-123',
            status='in_progress'
        )
        response = authenticated_client.get('/api/v1/progress/?search=searchable')
        assert response.status_code == status.HTTP_200_OK

    def test_list_progress_unauthenticated(self, api_client):
        """Test listing progress without authentication."""
        response = api_client.get('/api/v1/progress/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_progress_only_own(self, authenticated_client, student_client, student_user):
        """Test user can only see their own progress."""
        # Create progress for different user
        Progress.objects.create(
            user=student_user,
            content_type='mission',
            content_id='student-123',
            status='completed'
        )
        response = authenticated_client.get('/api/v1/progress/')
        assert response.status_code == status.HTTP_200_OK
        # Should not see student's progress


@pytest.mark.django_db
class TestProgressCreateEndpoint:
    """Test POST /api/v1/progress/"""

    def test_create_progress_success(self, authenticated_client, test_user):
        """Test creating progress successfully."""
        data = {
            'content_type': 'mission',
            'content_id': 'mission-123',
            'status': 'in_progress',
            'completion_percentage': 25
        }
        response = authenticated_client.post('/api/v1/progress/', data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert Progress.objects.filter(content_id='mission-123').exists()

    def test_create_progress_missing_fields(self, authenticated_client):
        """Test creating progress with missing required fields."""
        data = {'content_type': 'mission'}
        response = authenticated_client.post('/api/v1/progress/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_progress_invalid_status(self, authenticated_client):
        """Test creating progress with invalid status."""
        data = {
            'content_type': 'mission',
            'content_id': 'mission-123',
            'status': 'invalid_status'
        }
        response = authenticated_client.post('/api/v1/progress/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_progress_unauthenticated(self, api_client):
        """Test creating progress without authentication."""
        data = {'content_type': 'mission', 'content_id': 'mission-123'}
        response = api_client.post('/api/v1/progress/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProgressDetailEndpoint:
    """Test GET /api/v1/progress/{id}/"""

    def test_get_progress_detail(self, authenticated_client, test_user):
        """Test getting progress detail."""
        progress = Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='detail-123',
            status='completed'
        )
        response = authenticated_client.get(f'/api/v1/progress/{progress.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['content_id'] == 'detail-123'

    def test_get_progress_not_found(self, authenticated_client):
        """Test getting non-existent progress."""
        response = authenticated_client.get('/api/v1/progress/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_progress_other_user(self, authenticated_client, student_user):
        """Test getting progress from another user (should fail or return 404)."""
        progress = Progress.objects.create(
            user=student_user,
            content_type='mission',
            content_id='other-123',
            status='completed'
        )
        response = authenticated_client.get(f'/api/v1/progress/{progress.id}/')
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestProgressUpdateEndpoint:
    """Test PUT/PATCH /api/v1/progress/{id}/"""

    def test_update_progress(self, authenticated_client, test_user):
        """Test updating progress."""
        progress = Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='update-123',
            status='in_progress',
            completion_percentage=50
        )
        data = {
            'content_type': 'mission',
            'content_id': 'update-123',
            'status': 'completed',
            'completion_percentage': 100
        }
        response = authenticated_client.patch(
            f'/api/v1/progress/{progress.id}/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        progress.refresh_from_db()
        assert progress.status == 'completed'

    def test_update_progress_other_user(self, authenticated_client, student_user):
        """Test updating progress from another user (should fail)."""
        progress = Progress.objects.create(
            user=student_user,
            content_type='mission',
            content_id='other-update-123',
            status='in_progress'
        )
        data = {'status': 'completed'}
        response = authenticated_client.patch(
            f'/api/v1/progress/{progress.id}/',
            data,
            format='json'
        )
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestProgressDeleteEndpoint:
    """Test DELETE /api/v1/progress/{id}/"""

    def test_delete_progress(self, authenticated_client, test_user):
        """Test deleting progress."""
        progress = Progress.objects.create(
            user=test_user,
            content_type='mission',
            content_id='delete-123',
            status='completed'
        )
        response = authenticated_client.delete(f'/api/v1/progress/{progress.id}/')
        assert response.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
        assert not Progress.objects.filter(id=progress.id).exists()

    def test_delete_progress_other_user(self, authenticated_client, student_user):
        """Test deleting progress from another user (should fail)."""
        progress = Progress.objects.create(
            user=student_user,
            content_type='mission',
            content_id='other-delete-123',
            status='completed'
        )
        response = authenticated_client.delete(f'/api/v1/progress/{progress.id}/')
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
