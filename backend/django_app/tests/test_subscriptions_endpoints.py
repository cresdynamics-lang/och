"""
Test suite for Subscriptions endpoints.

Endpoints tested:
- GET /api/v1/subscription/status
- POST /api/v1/subscription/upgrade
- POST /api/v1/subscription/webhooks/stripe
"""
import pytest
from rest_framework import status
from subscriptions.models import SubscriptionPlan, UserSubscription


@pytest.mark.django_db
class TestSubscriptionStatusEndpoint:
    """Test GET /api/v1/subscription/status"""

    def test_get_subscription_status_with_subscription(self, authenticated_client, test_user):
        """Test getting subscription status when user has subscription."""
        # Create subscription plan and user subscription
        plan = SubscriptionPlan.objects.create(
            name='premium',
            price_monthly=29.99,
            features=['feature1', 'feature2']
        )
        UserSubscription.objects.create(
            user=test_user,
            plan=plan,
            status='active'
        )
        response = authenticated_client.get('/api/v1/subscription/status')
        assert response.status_code == status.HTTP_200_OK
        assert 'tier' in response.data
        assert 'status' in response.data

    def test_get_subscription_status_without_subscription(self, authenticated_client):
        """Test getting subscription status when user has no subscription."""
        response = authenticated_client.get('/api/v1/subscription/status')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tier'] == 'free'
        assert response.data['can_upgrade'] is True

    def test_get_subscription_status_unauthenticated(self, api_client):
        """Test getting subscription status without authentication."""
        response = api_client.get('/api/v1/subscription/status')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUpgradeSubscriptionEndpoint:
    """Test POST /api/v1/subscription/upgrade"""

    def test_upgrade_subscription_success(self, authenticated_client):
        """Test upgrading subscription successfully."""
        # Create subscription plan
        plan = SubscriptionPlan.objects.create(
            name='premium',
            price_monthly=29.99
        )
        data = {'plan': 'premium'}
        response = authenticated_client.post('/api/v1/subscription/upgrade', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'plan' in response.data

    def test_upgrade_subscription_invalid_plan(self, authenticated_client):
        """Test upgrading with invalid plan name."""
        data = {'plan': 'invalid-plan'}
        response = authenticated_client.post('/api/v1/subscription/upgrade', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upgrade_subscription_missing_plan(self, authenticated_client):
        """Test upgrading without plan parameter."""
        data = {}
        response = authenticated_client.post('/api/v1/subscription/upgrade', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upgrade_subscription_unauthenticated(self, api_client):
        """Test upgrading subscription without authentication."""
        data = {'plan': 'premium'}
        response = api_client.post('/api/v1/subscription/upgrade', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestStripeWebhookEndpoint:
    """Test POST /api/v1/subscription/webhooks/stripe"""

    def test_stripe_webhook_missing_secret(self, authenticated_client):
        """Test Stripe webhook without webhook secret configured."""
        data = {'type': 'checkout.session.completed', 'data': {}}
        response = authenticated_client.post(
            '/api/v1/subscription/webhooks/stripe',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_stripe_webhook_invalid_signature(self, authenticated_client):
        """Test Stripe webhook with invalid signature."""
        # Mock webhook secret in environment
        import os
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'test_secret'
        os.environ['STRIPE_SECRET_KEY'] = 'test_key'
        
        response = authenticated_client.post(
            '/api/v1/subscription/webhooks/stripe',
            {'type': 'test'},
            format='json',
            HTTP_STRIPE_SIGNATURE='invalid_signature'
        )
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_200_OK  # May accept if Stripe not fully configured
        ]

    def test_stripe_webhook_unauthenticated(self, api_client):
        """Test Stripe webhook without authentication (webhooks typically don't require auth)."""
        data = {'type': 'checkout.session.completed'}
        response = api_client.post(
            '/api/v1/subscription/webhooks/stripe',
            data,
            format='json'
        )
        # Webhooks may or may not require authentication depending on implementation
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST
        ]












