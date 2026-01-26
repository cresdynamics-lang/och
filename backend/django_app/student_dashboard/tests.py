"""
Tests for Student Dashboard API endpoints.
Target: 80% coverage.
"""
import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import StudentDashboardCache, DashboardUpdateQueue
from .services import DashboardAggregationService

User = get_user_model()


class StudentDashboardTestCase(TestCase):
    """Test cases for student dashboard endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='student@test.com',
            username='student',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            country='KE',
            email_verified=True,
            account_status='active',
        )
        
        # Create student role and assign to user
        from users.models import Role, UserRole
        student_role, _ = Role.objects.get_or_create(
            name='student',
            defaults={'display_name': 'Student', 'is_system_role': True}
        )
        UserRole.objects.create(
            user=self.user,
            role=student_role,
            scope='global',
            is_active=True
        )
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        # Create dashboard cache
        self.cache = StudentDashboardCache.objects.create(
            user=self.user,
            readiness_score=Decimal('67.40'),
            time_to_ready_days=89,
            habit_streak_current=5,
            habit_completion_week=Decimal('78.20'),
            missions_in_review=2,
            portfolio_health_score=Decimal('62.10'),
            cohort_completion_pct=Decimal('45.30'),
            notifications_unread=3,
            notifications_urgent=1,
        )
    
    def test_get_dashboard_authenticated(self):
        """Test GET /api/v1/student/dashboard with authentication."""
        response = self.client.get('/api/v1/student/dashboard')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('readiness', data)
        self.assertIn('today', data)
        self.assertIn('quick_stats', data)
        self.assertIn('cards', data)
        self.assertIn('notifications', data)
        self.assertIn('leaderboard', data)
        self.assertIn('last_updated', data)
        
        # Check readiness data
        self.assertEqual(float(data['readiness']['score']), 67.4)
        self.assertEqual(data['readiness']['time_to_ready'], 89)
        
        # Check quick stats
        self.assertEqual(float(data['quick_stats']['habits_week']), 78.2)
        self.assertEqual(data['quick_stats']['missions_in_review'], 2)
    
    def test_get_dashboard_unauthenticated(self):
        """Test GET /api/v1/student/dashboard without authentication."""
        self.client.credentials()
        response = self.client.get('/api/v1/student/dashboard')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_dashboard_non_student_role(self):
        """Test GET /api/v1/student/dashboard with non-student role."""
        # Create non-student user
        admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        
        response = self.client.get('/api/v1/student/dashboard')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_dashboard_query_params(self):
        """Test GET /api/v1/student/dashboard with query params."""
        # Test without notifications
        response = self.client.get('/api/v1/student/dashboard?include_notifications=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['notifications']['unread'], 0)
        
        # Test without AI nudge
        response = self.client.get('/api/v1/student/dashboard?include_ai_nudge=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsNone(data.get('ai_nudge'))
    
    def test_track_dashboard_action(self):
        """Test POST /api/v1/student/dashboard/action."""
        payload = {
            'action': 'mission_started',
            'mission_id': '123e4567-e89b-12d3-a456-426614174000',
            'estimated_completion': '2025-12-04T10:00:00Z',
        }
        response = self.client.post(
            '/api/v1/student/dashboard/action',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        
        data = response.json()
        self.assertEqual(data['status'], 'queued')
        self.assertEqual(data['action'], 'mission_started')
        
        # Check queue was created
        queue_item = DashboardUpdateQueue.objects.filter(
            user=self.user,
            reason='mission_started'
        ).first()
        self.assertIsNotNone(queue_item)
        self.assertEqual(queue_item.priority, 'normal')
    
    def test_track_dashboard_action_urgent(self):
        """Test POST /api/v1/student/dashboard/action with urgent action."""
        payload = {
            'action': 'mission_approved',
            'mission_id': '123e4567-e89b-12d3-a456-426614174000',
        }
        response = self.client.post(
            '/api/v1/student/dashboard/action',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        
        # Check queue was created with urgent priority
        queue_item = DashboardUpdateQueue.objects.filter(
            user=self.user,
            reason='mission_approved'
        ).first()
        self.assertIsNotNone(queue_item)
        self.assertEqual(queue_item.priority, 'urgent')
    
    def test_track_dashboard_action_invalid(self):
        """Test POST /api/v1/student/dashboard/action with invalid data."""
        payload = {
            'action': '',  # Invalid empty action
        }
        response = self.client.post(
            '/api/v1/student/dashboard/action',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_dashboard_aggregation_service(self):
        """Test DashboardAggregationService methods."""
        # Test get_or_create_cache
        cache = DashboardAggregationService.get_or_create_cache(self.user)
        self.assertIsNotNone(cache)
        self.assertEqual(cache.user, self.user)
        
        # Test queue_update
        DashboardAggregationService.queue_update(self.user, 'test_reason', 'high')
        queue_item = DashboardUpdateQueue.objects.filter(
            user=self.user,
            reason='test_reason'
        ).first()
        self.assertIsNotNone(queue_item)
        self.assertEqual(queue_item.priority, 'high')
        
        # Test mask_for_tier
        data = {
            'readiness': {'score': 67.4, 'trend_7d': '+2.1'},
            'needs_mentor_feedback': True,
        }
        masked = DashboardAggregationService.mask_for_tier(data, 'free')
        self.assertIsNone(masked['readiness']['trend_7d'])
    
    def test_dashboard_cache_model(self):
        """Test StudentDashboardCache model."""
        cache = StudentDashboardCache.objects.get(user=self.user)
        self.assertEqual(cache.readiness_score, Decimal('67.40'))
        self.assertEqual(cache.habit_streak_current, 5)
        
        # Test string representation
        self.assertIn(self.user.email, str(cache))
    
    def test_dashboard_update_queue_model(self):
        """Test DashboardUpdateQueue model."""
        queue_item = DashboardUpdateQueue.objects.create(
            user=self.user,
            reason='test_reason',
            priority='normal'
        )
        self.assertEqual(queue_item.user, self.user)
        self.assertEqual(queue_item.reason, 'test_reason')
        self.assertEqual(queue_item.priority, 'normal')
        self.assertIsNone(queue_item.processed_at)
        
        # Test string representation
        self.assertIn(self.user.email, str(queue_item))
        self.assertIn('test_reason', str(queue_item))
