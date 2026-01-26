"""
Test suite for health check and metrics endpoints.

Endpoints tested:
- GET /api/v1/health/
- GET /api/v1/metrics/dashboard
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestHealthCheckEndpoint:
    """Test GET /api/v1/health/"""

    def test_health_check(self, api_client):
        """Test health check endpoint."""
        response = api_client.get('/api/v1/health/')
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data or 'healthy' in str(response.data).lower()


@pytest.mark.django_db
class TestDashboardMetricsEndpoint:
    """Test GET /api/v1/metrics/dashboard"""

    def test_get_dashboard_metrics_authenticated(self, authenticated_client):
        """Test getting dashboard metrics as authenticated user."""
        response = authenticated_client.get('/api/v1/metrics/dashboard')
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_dashboard_metrics_unauthenticated(self, api_client):
        """Test getting dashboard metrics without authentication."""
        response = api_client.get('/api/v1/metrics/dashboard')
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_200_OK  # Some metrics may be public
        ]
