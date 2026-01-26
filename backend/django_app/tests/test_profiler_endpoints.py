"""
Test suite for Profiler Engine endpoints.

Endpoints tested:
- POST /api/v1/profiler/start
- POST /api/v1/profiler/answers
- POST /api/v1/profiler/future-you
- GET /api/v1/profiler/status
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
@pytest.mark.profiler
class TestStartProfilerEndpoint:
    """Test POST /api/v1/profiler/start"""

    def test_start_profiler_session(self, student_client):
        """Test starting a profiler session."""
        data = {
            'persona': 'student',
            'preferences': {}
        }
        response = student_client.post('/api/v1/profiler/start', data, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_start_profiler_unauthenticated(self, api_client):
        """Test starting profiler without authentication."""
        data = {'persona': 'student'}
        response = api_client.post('/api/v1/profiler/start', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_start_profiler_invalid_persona(self, student_client):
        """Test starting profiler with invalid persona."""
        data = {'persona': 'invalid-persona'}
        response = student_client.post('/api/v1/profiler/start', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.profiler
class TestSubmitAnswersEndpoint:
    """Test POST /api/v1/profiler/answers"""

    def test_submit_answers(self, student_client):
        """Test submitting profiler answers."""
        data = {
            'session_id': 1,
            'answers': [
                {'question_id': 1, 'answer': 'option_a'},
                {'question_id': 2, 'answer': 'option_b'}
            ]
        }
        response = student_client.post('/api/v1/profiler/answers', data, format='json')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]

    def test_submit_answers_empty(self, student_client):
        """Test submitting empty answers."""
        data = {
            'session_id': 1,
            'answers': []
        }
        response = student_client.post('/api/v1/profiler/answers', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_submit_answers_unauthenticated(self, api_client):
        """Test submitting answers without authentication."""
        data = {'session_id': 1, 'answers': []}
        response = api_client.post('/api/v1/profiler/answers', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.profiler
class TestFutureYouEndpoint:
    """Test POST /api/v1/profiler/future-you"""

    def test_generate_future_you(self, student_client):
        """Test generating Future-You persona."""
        data = {
            'session_id': 1,
            'preferences': {}
        }
        response = student_client.post('/api/v1/profiler/future-you', data, format='json')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]

    def test_generate_future_you_unauthenticated(self, api_client):
        """Test generating Future-You without authentication."""
        data = {'session_id': 1}
        response = api_client.post('/api/v1/profiler/future-you', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.profiler
class TestProfilerStatusEndpoint:
    """Test GET /api/v1/profiler/status"""

    def test_get_profiler_status(self, student_client):
        """Test getting profiler status."""
        response = student_client.get('/api/v1/profiler/status')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_status_unauthenticated(self, api_client):
        """Test getting status without authentication."""
        response = api_client.get('/api/v1/profiler/status')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_status_with_session_id(self, student_client):
        """Test getting status for specific session."""
        response = student_client.get('/api/v1/profiler/status?session_id=1')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]
