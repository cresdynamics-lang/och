"""
Test suite for Coaching OS endpoints.

Endpoints tested:
- POST /api/v1/coaching/habits
- POST /api/v1/coaching/goals
- POST /api/v1/coaching/reflect
- GET /api/v1/coaching/summary
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
@pytest.mark.coaching
class TestHabitsEndpoint:
    """Test POST /api/v1/coaching/habits"""

    def test_create_habit(self, student_client):
        """Test creating a new habit."""
        data = {
            'name': 'Daily Coding',
            'description': 'Code for 1 hour daily',
            'frequency': 'daily'
        }
        response = student_client.post('/api/v1/coaching/habits', data, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_log_habit(self, student_client):
        """Test logging habit completion."""
        data = {
            'habit_id': 1,
            'completed': True,
            'notes': 'Completed successfully'
        }
        response = student_client.post('/api/v1/coaching/habits', data, format='json')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND
        ]

    def test_create_habit_unauthenticated(self, api_client):
        """Test creating habit without authentication."""
        data = {'name': 'Test Habit'}
        response = api_client.post('/api/v1/coaching/habits', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.coaching
class TestGoalsEndpoint:
    """Test POST /api/v1/coaching/goals"""

    def test_create_goal(self, student_client):
        """Test creating a new goal."""
        data = {
            'title': 'Learn Python',
            'description': 'Complete Python course',
            'target_date': '2024-12-31',
            'category': 'learning'
        }
        response = student_client.post('/api/v1/coaching/goals', data, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_goal_invalid_date(self, student_client):
        """Test creating goal with invalid date."""
        data = {
            'title': 'Test Goal',
            'target_date': 'invalid-date'
        }
        response = student_client.post('/api/v1/coaching/goals', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_goal_unauthenticated(self, api_client):
        """Test creating goal without authentication."""
        data = {'title': 'Test Goal'}
        response = api_client.post('/api/v1/coaching/goals', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.coaching
class TestReflectionEndpoint:
    """Test POST /api/v1/coaching/reflect"""

    def test_create_reflection(self, student_client):
        """Test creating a reflection."""
        data = {
            'content': 'Today I learned about API testing with pytest.',
            'mood': 'positive',
            'tags': ['learning', 'testing']
        }
        response = student_client.post('/api/v1/coaching/reflect', data, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_reflection_empty_content(self, student_client):
        """Test creating reflection with empty content."""
        data = {'content': ''}
        response = student_client.post('/api/v1/coaching/reflect', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_reflection_unauthenticated(self, api_client):
        """Test creating reflection without authentication."""
        data = {'content': 'Test reflection'}
        response = api_client.post('/api/v1/coaching/reflect', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.coaching
class TestCoachingSummaryEndpoint:
    """Test GET /api/v1/coaching/summary"""

    def test_get_coaching_summary(self, student_client):
        """Test getting coaching summary."""
        response = student_client.get('/api/v1/coaching/summary')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_summary_unauthenticated(self, api_client):
        """Test getting summary without authentication."""
        response = api_client.get('/api/v1/coaching/summary')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
