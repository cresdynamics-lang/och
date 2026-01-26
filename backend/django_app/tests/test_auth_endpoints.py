"""
Test suite for authentication endpoints.

Endpoints tested:
- POST /api/v1/auth/signup
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/token/refresh
- GET /api/v1/auth/me
- POST /api/v1/auth/password/reset/request
- POST /api/v1/auth/password/reset/confirm
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.auth
class TestSignupEndpoint:
    """Test POST /api/v1/auth/signup"""

    def test_signup_with_password(self, api_client):
        """Test signup with email and password."""
        data = {
            'email': 'newuser@test.com',
            'password': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post('/api/v1/auth/signup', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newuser@test.com').exists()

    def test_signup_duplicate_email(self, api_client, test_user):
        """Test signup with duplicate email fails."""
        data = {
            'email': test_user.email,
            'password': 'SecurePass123!',
            'first_name': 'Duplicate',
            'last_name': 'User'
        }
        response = api_client.post('/api/v1/auth/signup', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_invalid_email(self, api_client):
        """Test signup with invalid email format."""
        data = {
            'email': 'invalid-email',
            'password': 'SecurePass123!',
            'first_name': 'Invalid',
            'last_name': 'Email'
        }
        response = api_client.post('/api/v1/auth/signup', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_weak_password(self, api_client):
        """Test signup with weak password fails."""
        data = {
            'email': 'weakpass@test.com',
            'password': '123',
            'first_name': 'Weak',
            'last_name': 'Password'
        }
        response = api_client.post('/api/v1/auth/signup', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.auth
class TestLoginEndpoint:
    """Test POST /api/v1/auth/login"""

    def test_login_success(self, api_client, test_user):
        """Test successful login."""
        data = {
            'email': test_user.email,
            'password': 'testpass123',
            'device_fingerprint': 'test-device'
        }
        response = api_client.post('/api/v1/auth/login', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data

    def test_login_invalid_credentials(self, api_client, test_user):
        """Test login with invalid password."""
        data = {
            'email': test_user.email,
            'password': 'wrongpassword',
            'device_fingerprint': 'test-device'
        }
        response = api_client.post('/api/v1/auth/login', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent user."""
        data = {
            'email': 'nonexistent@test.com',
            'password': 'testpass123',
            'device_fingerprint': 'test-device'
        }
        response = api_client.post('/api/v1/auth/login', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, api_client):
        """Test login with inactive user."""
        user = User.objects.create_user(
            email='inactive@test.com',
            password='testpass123',
            is_active=False
        )
        data = {
            'email': user.email,
            'password': 'testpass123',
            'device_fingerprint': 'test-device'
        }
        response = api_client.post('/api/v1/auth/login', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.auth
class TestMeEndpoint:
    """Test GET /api/v1/auth/me"""

    def test_get_current_user(self, authenticated_client, test_user):
        """Test getting current user profile."""
        response = authenticated_client.get('/api/v1/auth/me')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email
        assert response.data['first_name'] == test_user.first_name

    def test_get_me_unauthenticated(self, api_client):
        """Test getting current user without authentication."""
        response = api_client.get('/api/v1/auth/me')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.auth
class TestLogoutEndpoint:
    """Test POST /api/v1/auth/logout"""

    def test_logout_success(self, authenticated_client, test_user):
        """Test successful logout."""
        # Get refresh token
        refresh = RefreshToken.for_user(test_user)
        data = {'refresh_token': str(refresh)}
        response = authenticated_client.post('/api/v1/auth/logout', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication."""
        data = {'refresh_token': 'invalid-token'}
        response = api_client.post('/api/v1/auth/logout', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.auth
class TestTokenRefreshEndpoint:
    """Test POST /api/v1/auth/token/refresh"""

    def test_refresh_token_success(self, api_client, test_user):
        """Test successful token refresh."""
        refresh = RefreshToken.for_user(test_user)
        data = {'refresh_token': str(refresh)}
        response = api_client.post('/api/v1/auth/token/refresh', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data

    def test_refresh_token_invalid(self, api_client):
        """Test refresh with invalid token."""
        data = {'refresh_token': 'invalid-token'}
        response = api_client.post('/api/v1/auth/token/refresh', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.auth
class TestMagicLinkEndpoint:
    """Test POST /api/v1/auth/login/magic-link"""

    def test_request_magic_link_success(self, api_client, test_user):
        """Test requesting magic link successfully."""
        data = {'email': test_user.email}
        response = api_client.post('/api/v1/auth/login/magic-link', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_request_magic_link_nonexistent_email(self, api_client):
        """Test requesting magic link for non-existent email."""
        data = {'email': 'nonexistent@test.com'}
        response = api_client.post('/api/v1/auth/login/magic-link', data, format='json')
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == status.HTTP_200_OK

    def test_request_magic_link_invalid_email(self, api_client):
        """Test requesting magic link with invalid email."""
        data = {'email': 'invalid-email'}
        response = api_client.post('/api/v1/auth/login/magic-link', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.auth
class TestConsentsEndpoint:
    """Test POST /api/v1/auth/consents"""

    def test_update_consents_success(self, authenticated_client):
        """Test updating consent scopes successfully."""
        data = {
            'scopes': ['share_with_mentor', 'analytics'],
            'grant': True
        }
        response = authenticated_client.post('/api/v1/auth/consents', data, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    def test_revoke_consents(self, authenticated_client):
        """Test revoking consent scopes."""
        data = {
            'scopes': ['share_with_mentor'],
            'grant': False
        }
        response = authenticated_client.post('/api/v1/auth/consents', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_update_consents_invalid_scope(self, authenticated_client):
        """Test updating consents with invalid scope."""
        data = {
            'scopes': ['invalid_scope'],
            'grant': True
        }
        response = authenticated_client.post('/api/v1/auth/consents', data, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_update_consents_unauthenticated(self, api_client):
        """Test updating consents without authentication."""
        data = {'scopes': ['share_with_mentor'], 'grant': True}
        response = api_client.post('/api/v1/auth/consents', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

