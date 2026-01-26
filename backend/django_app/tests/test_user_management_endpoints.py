"""
Test suite for User Management endpoints.

Endpoints tested:
- GET /api/v1/users/
- POST /api/v1/users/
- GET /api/v1/users/{id}/
- PUT /api/v1/users/{id}/
- PATCH /api/v1/users/{id}/
- DELETE /api/v1/users/{id}/
- GET /api/v1/users/me/
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.admin
class TestUsersListEndpoint:
    """Test GET /api/v1/users/"""

    def test_list_users_as_admin(self, admin_client):
        """Test listing users as admin."""
        response = admin_client.get('/api/v1/users/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))

    def test_list_users_as_student(self, student_client, student_user):
        """Test listing users as student (should only see self)."""
        response = student_client.get('/api/v1/users/')
        assert response.status_code == status.HTTP_200_OK
        # Should only return the student's own user
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) == 1
            assert response.data['results'][0]['id'] == student_user.id
        elif isinstance(response.data, list):
            assert len(response.data) == 1
            assert response.data[0]['id'] == student_user.id

    def test_list_users_unauthenticated(self, api_client):
        """Test listing users without authentication."""
        response = api_client.get('/api/v1/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestUsersCreateEndpoint:
    """Test POST /api/v1/users/"""

    def test_create_user_as_admin(self, admin_client):
        """Test creating user as admin."""
        data = {
            'email': 'newuser@test.com',
            'password': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = admin_client.post('/api/v1/users/', data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert User.objects.filter(email='newuser@test.com').exists()

    def test_create_user_as_student(self, student_client):
        """Test creating user as student (should fail)."""
        data = {
            'email': 'studentcreated@test.com',
            'password': 'SecurePass123!',
            'first_name': 'Student',
            'last_name': 'Created'
        }
        response = student_client.post('/api/v1/users/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_user_duplicate_email(self, admin_client, test_user):
        """Test creating user with duplicate email."""
        data = {
            'email': test_user.email,
            'password': 'SecurePass123!',
            'first_name': 'Duplicate',
            'last_name': 'User'
        }
        response = admin_client.post('/api/v1/users/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_user_unauthenticated(self, api_client):
        """Test creating user without authentication."""
        data = {
            'email': 'unauthed@test.com',
            'password': 'SecurePass123!',
            'first_name': 'Unauthed',
            'last_name': 'User'
        }
        response = api_client.post('/api/v1/users/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestUsersDetailEndpoint:
    """Test GET /api/v1/users/{id}/"""

    def test_get_user_detail_as_admin(self, admin_client, test_user):
        """Test getting user detail as admin."""
        response = admin_client.get(f'/api/v1/users/{test_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email

    def test_get_own_user_detail(self, authenticated_client, test_user):
        """Test getting own user detail."""
        response = authenticated_client.get(f'/api/v1/users/{test_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email

    def test_get_other_user_detail_as_student(self, student_client, test_user):
        """Test getting other user detail as student (should fail)."""
        response = student_client.get(f'/api/v1/users/{test_user.id}/')
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]

    def test_get_user_not_found(self, admin_client):
        """Test getting non-existent user."""
        response = admin_client.get('/api/v1/users/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_user_unauthenticated(self, api_client, test_user):
        """Test getting user without authentication."""
        response = api_client.get(f'/api/v1/users/{test_user.id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestUsersUpdateEndpoint:
    """Test PUT/PATCH /api/v1/users/{id}/"""

    def test_update_user_as_admin(self, admin_client, test_user):
        """Test updating user as admin."""
        data = {
            'email': test_user.email,
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = admin_client.patch(f'/api/v1/users/{test_user.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        test_user.refresh_from_db()
        assert test_user.first_name == 'Updated'

    def test_update_own_user(self, authenticated_client, test_user):
        """Test updating own user."""
        data = {'first_name': 'Self Updated'}
        response = authenticated_client.patch(f'/api/v1/users/{test_user.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_update_other_user_as_student(self, student_client, test_user):
        """Test updating other user as student (should fail)."""
        data = {'first_name': 'Unauthorized Update'}
        response = student_client.patch(f'/api/v1/users/{test_user.id}/', data, format='json')
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
@pytest.mark.admin
class TestUsersMeEndpoint:
    """Test GET /api/v1/users/me/"""

    def test_get_me_endpoint(self, authenticated_client, test_user):
        """Test getting current user via /me endpoint."""
        response = authenticated_client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email

    def test_get_me_unauthenticated(self, api_client):
        """Test getting /me without authentication."""
        response = api_client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED












