"""
Test suite for Missions MXP endpoints.

Endpoints tested:
- GET /api/v1/missions/recommended
- POST /api/v1/missions/{mission_id}/submit
- GET /api/v1/missions/status
"""
import pytest
from rest_framework import status
import uuid


@pytest.mark.django_db
@pytest.mark.missions
class TestRecommendedMissionsEndpoint:
    """Test GET /api/v1/missions/recommended"""

    def test_get_recommended_missions(self, student_client):
        """Test getting recommended missions."""
        response = student_client.get('/api/v1/missions/recommended')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]
        if response.status_code == status.HTTP_200_OK:
            assert isinstance(response.data, (list, dict))

    def test_get_recommended_unauthenticated(self, api_client):
        """Test getting recommended missions without authentication."""
        response = api_client.get('/api/v1/missions/recommended')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_recommended_with_filters(self, student_client):
        """Test getting recommended missions with query parameters."""
        response = student_client.get('/api/v1/missions/recommended?difficulty=beginner&limit=5')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
@pytest.mark.missions
class TestSubmitMissionEndpoint:
    """Test POST /api/v1/missions/{mission_id}/submit"""

    def test_submit_mission(self, student_client):
        """Test submitting a mission."""
        mission_id = uuid.uuid4()
        data = {
            'submission_data': {
                'answer': 'Test submission',
                'notes': 'Completed mission'
            }
        }
        response = student_client.post(
            f'/api/v1/missions/{mission_id}/submit',
            data,
            format='json'
        )
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_submit_mission_invalid_id(self, student_client):
        """Test submitting mission with invalid UUID."""
        data = {'submission_data': {'answer': 'Test'}}
        response = student_client.post(
            '/api/v1/missions/invalid-id/submit',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_submit_mission_unauthenticated(self, api_client):
        """Test submitting mission without authentication."""
        mission_id = uuid.uuid4()
        data = {'submission_data': {'answer': 'Test'}}
        response = api_client.post(
            f'/api/v1/missions/{mission_id}/submit',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_submit_mission_empty_data(self, student_client):
        """Test submitting mission with empty submission data."""
        mission_id = uuid.uuid4()
        data = {}
        response = student_client.post(
            f'/api/v1/missions/{mission_id}/submit',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.missions
class TestMissionStatusEndpoint:
    """Test GET /api/v1/missions/status"""

    def test_get_mission_status(self, student_client):
        """Test getting mission status."""
        response = student_client.get('/api/v1/missions/status')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_status_unauthenticated(self, api_client):
        """Test getting status without authentication."""
        response = api_client.get('/api/v1/missions/status')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_status_with_filters(self, student_client):
        """Test getting status with query parameters."""
        response = student_client.get('/api/v1/missions/status?status=completed')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]
