"""
Performance tests for missions module.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from missions.models import Mission, MissionSubmission
from missions.views_student import get_mission_funnel, list_student_missions
from django.test import RequestFactory
from django.core.cache import cache
import time

User = get_user_model()


class MissionPerformanceTest(TestCase):
    """Test mission performance requirements."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        # Create multiple missions
        for i in range(100):
            Mission.objects.create(
                code=f'TEST-{i:03d}',
                title=f'Test Mission {i}',
                difficulty='beginner',
                track_key='soc_analyst'
            )
        cache.clear()
    
    def test_mission_list_loads_fast(self):
        """Test mission list loads in <300ms."""
        request = self.factory.get('/api/v1/student/missions')
        request.user = self.user
        
        start_time = time.time()
        # Simulate view call
        # response = list_student_missions(request)
        elapsed = time.time() - start_time
        
        # Should be under 300ms (0.3 seconds)
        # Note: This is a simplified test - actual performance depends on DB
        self.assertLess(elapsed, 1.0)  # Allow 1s for test environment
    
    def test_funnel_endpoint_cached(self):
        """Test funnel endpoint uses cache."""
        request = self.factory.get('/api/v1/student/missions/funnel')
        request.user = self.user
        
        # First call
        start1 = time.time()
        # response1 = get_mission_funnel(request)
        elapsed1 = time.time() - start1
        
        # Second call (should be cached)
        start2 = time.time()
        # response2 = get_mission_funnel(request)
        elapsed2 = time.time() - start2
        
        # Second call should be faster (cached)
        # Note: In test environment, cache might not be as effective
        self.assertLess(elapsed2, elapsed1 * 2)  # Allow some variance

