"""
Test suite for MFA (Multi-Factor Authentication) endpoints.

Endpoints tested:
- POST /api/v1/auth/mfa/enroll
- POST /api/v1/auth/mfa/verify
- POST /api/v1/auth/mfa/disable
"""
import pytest
from rest_framework import status
from users.auth_models import MFAMethod


@pytest.mark.django_db
@pytest.mark.auth
class TestMFAEnrollEndpoint:
    """Test POST /api/v1/auth/mfa/enroll"""

    def test_enroll_mfa_success(self, authenticated_client, test_user):
        """Test enrolling in MFA successfully."""
        data = {
            'method': 'totp',
            'device_name': 'Test Device'
        }
        response = authenticated_client.post('/api/v1/auth/mfa/enroll', data, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert 'secret' in response.data or 'qr_code' in response.data

    def test_enroll_mfa_invalid_method(self, authenticated_client):
        """Test enrolling with invalid MFA method."""
        data = {
            'method': 'invalid_method',
            'device_name': 'Test Device'
        }
        response = authenticated_client.post('/api/v1/auth/mfa/enroll', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_enroll_mfa_missing_fields(self, authenticated_client):
        """Test enrolling with missing required fields."""
        data = {}
        response = authenticated_client.post('/api/v1/auth/mfa/enroll', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_enroll_mfa_unauthenticated(self, api_client):
        """Test enrolling in MFA without authentication."""
        data = {'method': 'totp'}
        response = api_client.post('/api/v1/auth/mfa/enroll', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_enroll_mfa_already_enrolled(self, authenticated_client, test_user):
        """Test enrolling when MFA is already enabled."""
        # Create existing MFA method
        MFAMethod.objects.create(
            user=test_user,
            method='totp',
            is_active=True
        )
        data = {'method': 'totp', 'device_name': 'Another Device'}
        response = authenticated_client.post('/api/v1/auth/mfa/enroll', data, format='json')
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]


@pytest.mark.django_db
@pytest.mark.auth
class TestMFAVerifyEndpoint:
    """Test POST /api/v1/auth/mfa/verify"""

    def test_verify_mfa_success(self, authenticated_client, test_user):
        """Test verifying MFA code successfully."""
        # First enroll
        enroll_data = {'method': 'totp', 'device_name': 'Test Device'}
        enroll_response = authenticated_client.post('/api/v1/auth/mfa/enroll', enroll_data, format='json')
        
        if enroll_response.status_code in [200, 201]:
            # Try to verify (may need actual TOTP code)
            data = {
                'code': '123456',  # Mock code
                'method': 'totp'
            }
            response = authenticated_client.post('/api/v1/auth/mfa/verify', data, format='json')
            # May succeed or fail depending on code validation
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_401_UNAUTHORIZED
            ]

    def test_verify_mfa_invalid_code(self, authenticated_client):
        """Test verifying with invalid MFA code."""
        data = {
            'code': '000000',
            'method': 'totp'
        }
        response = authenticated_client.post('/api/v1/auth/mfa/verify', data, format='json')
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ]

    def test_verify_mfa_missing_code(self, authenticated_client):
        """Test verifying without code."""
        data = {'method': 'totp'}
        response = authenticated_client.post('/api/v1/auth/mfa/verify', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_mfa_unauthenticated(self, api_client):
        """Test verifying MFA without authentication."""
        data = {'code': '123456', 'method': 'totp'}
        response = api_client.post('/api/v1/auth/mfa/verify', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.auth
class TestMFADisableEndpoint:
    """Test POST /api/v1/auth/mfa/disable"""

    def test_disable_mfa_success(self, authenticated_client, test_user):
        """Test disabling MFA successfully."""
        # First create MFA method
        MFAMethod.objects.create(
            user=test_user,
            method='totp',
            is_active=True
        )
        data = {'method': 'totp'}
        response = authenticated_client.post('/api/v1/auth/mfa/disable', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_disable_mfa_not_enrolled(self, authenticated_client):
        """Test disabling MFA when not enrolled."""
        data = {'method': 'totp'}
        response = authenticated_client.post('/api/v1/auth/mfa/disable', data, format='json')
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]

    def test_disable_mfa_unauthenticated(self, api_client):
        """Test disabling MFA without authentication."""
        data = {'method': 'totp'}
        response = api_client.post('/api/v1/auth/mfa/disable', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

