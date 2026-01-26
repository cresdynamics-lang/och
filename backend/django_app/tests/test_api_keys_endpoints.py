"""
Test suite for API Keys endpoints.

Endpoints tested:
- POST /api/v1/api-keys/
- DELETE /api/v1/api-keys/{id}
"""
import pytest
from rest_framework import status
from users.api_models import APIKey


@pytest.mark.django_db
@pytest.mark.admin
class TestAPIKeysCreateEndpoint:
    """Test POST /api/v1/api-keys/"""

    def test_create_api_key_as_admin(self, admin_client):
        """Test creating API key as admin."""
        data = {
            'name': 'Test API Key',
            'scopes': ['read', 'write']
        }
        response = admin_client.post('/api/v1/api-keys/', data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert 'key' in response.data or 'api_key' in response.data

    def test_create_api_key_as_student(self, student_client):
        """Test creating API key as student (should fail)."""
        data = {
            'name': 'Student API Key',
            'scopes': ['read']
        }
        response = student_client.post('/api/v1/api-keys/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_api_key_missing_name(self, admin_client):
        """Test creating API key without name."""
        data = {'scopes': ['read']}
        response = admin_client.post('/api/v1/api-keys/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_api_key_unauthenticated(self, api_client):
        """Test creating API key without authentication."""
        data = {'name': 'Unauthed Key', 'scopes': ['read']}
        response = api_client.post('/api/v1/api-keys/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.admin
class TestAPIKeysDeleteEndpoint:
    """Test DELETE /api/v1/api-keys/{id}"""

    def test_delete_api_key_as_admin(self, admin_client, admin_user):
        """Test deleting API key as admin."""
        # Create API key first
        import secrets
        key_value = secrets.token_urlsafe(32)
        api_key = APIKey.objects.create(
            user=admin_user,
            name='Test Key',
            key_type='service',
            key_prefix=key_value[:8],
            key_hash='hashed-key',
            owner_type='user'
        )
        response = admin_client.delete(f'/api/v1/api-keys/{api_key.id}')
        assert response.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]
        assert not APIKey.objects.filter(id=api_key.id).exists()

    def test_delete_api_key_as_student(self, student_client, admin_user):
        """Test deleting API key as student (should fail)."""
        # Create API key owned by admin
        import secrets
        key_value = secrets.token_urlsafe(32)
        api_key = APIKey.objects.create(
            user=admin_user,
            name='Admin Key',
            key_type='service',
            key_prefix=key_value[:8],
            key_hash='hashed-admin-key',
            owner_type='user'
        )
        response = student_client.delete(f'/api/v1/api-keys/{api_key.id}')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_api_key_not_found(self, admin_client):
        """Test deleting non-existent API key."""
        response = admin_client.delete('/api/v1/api-keys/99999')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_api_key_unauthenticated(self, api_client):
        """Test deleting API key without authentication."""
        response = api_client.delete('/api/v1/api-keys/1')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

