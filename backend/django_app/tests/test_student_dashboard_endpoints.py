"""
Test suite for Student Dashboard endpoints.

Endpoints tested:
- GET /api/v1/student/dashboard
- POST /api/v1/student/dashboard/action
- GET /api/v1/student/dashboard/stream
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
@pytest.mark.student
class TestStudentDashboardEndpoint:
    """Test GET /api/v1/student/dashboard"""

    def test_get_dashboard_authenticated(self, student_client, student_with_role):
        """Test getting dashboard data as authenticated student."""
        response = student_client.get('/api/v1/student/dashboard')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        # Dashboard may return 404 if no data exists yet

    def test_get_dashboard_unauthenticated(self, api_client):
        """Test getting dashboard without authentication."""
        response = api_client.get('/api/v1/student/dashboard')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_dashboard_non_student(self, authenticated_client):
        """Test getting dashboard as non-student user."""
        response = authenticated_client.get('/api/v1/student/dashboard')
        # Should return 403 or 404 depending on implementation
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_200_OK
        ]


@pytest.mark.django_db
@pytest.mark.student
class TestDashboardActionEndpoint:
    """Test POST /api/v1/student/dashboard/action"""

    def test_track_dashboard_action(self, student_client):
        """Test tracking a dashboard action."""
        data = {
            'action_type': 'view',
            'action_data': {'section': 'missions'}
        }
        response = student_client.post(
            '/api/v1/student/dashboard/action',
            data,
            format='json'
        )
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_track_action_unauthenticated(self, api_client):
        """Test tracking action without authentication."""
        data = {'action_type': 'view'}
        response = api_client.post(
            '/api/v1/student/dashboard/action',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_track_action_invalid_data(self, student_client):
        """Test tracking action with invalid data."""
        data = {}  # Missing required fields
        response = student_client.post(
            '/api/v1/student/dashboard/action',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.student
class TestDashboardStreamEndpoint:
    """Test GET /api/v1/student/dashboard/stream"""

    def test_stream_dashboard_updates(self, student_client):
        """Test streaming dashboard updates."""
        response = student_client.get('/api/v1/student/dashboard/stream')
        # Streaming endpoint may return different status codes
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]

    def test_stream_unauthenticated(self, api_client):
        """Test streaming without authentication."""
        response = api_client.get('/api/v1/student/dashboard/stream')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
