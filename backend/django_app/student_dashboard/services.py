"""
Service layer for aggregating data from 12+ microservices.
"""
import os
import uuid
import requests
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from users.models import User
from .models import StudentDashboardCache, DashboardUpdateQueue


class DashboardAggregationService:
    """
    Aggregates data from multiple microservices into dashboard cache.
    Handles cold starts, stale data, and tier-based masking.
    """
    
    @staticmethod
    def get_or_create_cache(user: User) -> StudentDashboardCache:
        """Get or create dashboard cache for user."""
        cache, created = StudentDashboardCache.objects.get_or_create(
            user=user,
            defaults={
                'readiness_score': Decimal('0.00'),
                'time_to_ready_days': 365,
                'profile_incomplete': True,
            }
        )
        return cache
    
    @staticmethod
    def refresh_dashboard_cache(user: User, force: bool = False) -> StudentDashboardCache:
        """
        Refresh dashboard cache by aggregating data from all services.
        
        This is a placeholder that will be extended to call actual microservices.
        For now, it updates the cache with mock/computed data.
        """
        cache = DashboardAggregationService.get_or_create_cache(user)
        
        # Check if refresh is needed (stale > 15min)
        if not force:
            time_since_update = timezone.now() - cache.updated_at
            if time_since_update.total_seconds() < 900:  # 15 minutes
                return cache
        
        # TODO: Replace with actual service calls
        # For now, we'll use placeholder logic
        
        # Compute derived metrics
        cache = DashboardAggregationService._compute_derived_metrics(cache, user)
        
        # Update timestamp
        cache.updated_at = timezone.now()
        cache.last_active_at = timezone.now()
        cache.save()
        
        return cache
    
    @staticmethod
    def _compute_derived_metrics(cache: StudentDashboardCache, user: User) -> StudentDashboardCache:
        """Compute derived metrics from raw data."""
        # Portfolio health calculation
        if cache.portfolio_items_total > 0:
            cache.portfolio_health_score = Decimal(
                (cache.portfolio_items_approved / cache.portfolio_items_total) * 100
            ).quantize(Decimal('0.01'))
        
        # Profile completeness
        cache.profile_incomplete = (
            not user.email_verified or
            not user.first_name or
            not user.last_name or
            not user.country
        )
        
        return cache
    
    @staticmethod
    def queue_update(user: User, reason: str, priority: str = 'normal'):
        """Queue a dashboard update for background processing."""
        DashboardUpdateQueue.objects.create(
            user=user,
            reason=reason,
            priority=priority
        )
    
    @staticmethod
    def mask_for_tier(data: Dict[str, Any], tier: str) -> Dict[str, Any]:
        """
        Mask premium fields for free tier users.
        Returns data with premium fields set to None or "upgrade_required".
        """
        if tier in ['premium', 'starter_enhanced']:
            return data
        
        # Mask premium features
        masked = data.copy()
        
        # Mask detailed analytics
        if 'readiness' in masked:
            if 'trend_7d' in masked['readiness']:
                masked['readiness']['trend_7d'] = None
        
        # Mask mentor feedback details
        if 'needs_mentor_feedback' in masked:
            if tier == 'free':
                masked['needs_mentor_feedback'] = None
        
        return masked


class TalentScopeService:
    """TalentScope service client."""
    
    @staticmethod
    def get_readiness(user_id: int) -> Dict[str, Any]:
        """Get readiness score and metrics from TalentScope."""
        api_url = os.environ.get('TALENTSCOPE_API_URL', 'http://localhost:8002/api/v1')
        api_key = os.environ.get('TALENTSCOPE_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/talentscope/mentees/{user_id}/readiness",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'score': data.get('score', 0),
                        'time_to_ready_days': data.get('time_to_ready_days', 365),
                        'trend_7d': data.get('trend_7d'),
                        'gaps': data.get('gaps', []),
                        'skills': data.get('skills', {}),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'score': 67.4,
            'time_to_ready_days': 89,
            'trend_7d': '+2.1',
            'gaps': ['DFIR', 'Python', 'Compliance'],
            'skills': {
                'networking': 45,
                'cloud': 22,
                'python': 30,
                'dfir': 15,
            }
        }


class CoachingOSService:
    """Coaching OS service client."""
    
    @staticmethod
    def get_week_summary(user_id: int) -> Dict[str, Any]:
        """Get coaching OS week summary."""
        api_url = os.environ.get('COACHING_OS_API_URL', 'http://localhost:8003/api/v1')
        api_key = os.environ.get('COACHING_OS_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/coaching/mentees/{user_id}/week-summary",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'habit_streak': data.get('habit_streak', 0),
                        'habit_completion_pct': data.get('habit_completion_pct', 0),
                        'goals_active': data.get('goals_active', 0),
                        'goals_completed_week': data.get('goals_completed_week', 0),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'habit_streak': 5,
            'habit_completion_pct': 78.2,
            'goals_active': 3,
            'goals_completed_week': 1,
        }


class MissionsService:
    """Missions MXP service client."""
    
    @staticmethod
    def get_status(user_id: int) -> Dict[str, Any]:
        """Get missions status."""
        api_url = os.environ.get('MISSIONS_API_URL', 'http://localhost:8004/api/v1')
        api_key = os.environ.get('MISSIONS_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/missions/mentees/{user_id}/status",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'in_progress': data.get('in_progress', 0),
                        'in_review': data.get('in_review', 0),
                        'completed_total': data.get('completed_total', 0),
                        'next_recommended': data.get('next_recommended', {}),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'in_progress': 2,
            'in_review': 2,
            'completed_total': 15,
            'next_recommended': {
                'id': str(uuid.uuid4()),
                'title': 'Build SIEM dashboard',
                'difficulty': 'intermediate',
                'est_hours': 4,
            }
        }


class PortfolioService:
    """Portfolio service client."""
    
    @staticmethod
    def get_health(user_id: int) -> Dict[str, Any]:
        """Get portfolio health."""
        api_url = os.environ.get('PORTFOLIO_API_URL', 'http://localhost:8005/api/v1')
        api_key = os.environ.get('PORTFOLIO_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/portfolio/{user_id}/health",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'health_score': data.get('health_score', 0),
                        'items_total': data.get('items_total', 0),
                        'items_approved': data.get('items_approved', 0),
                        'public_profile_enabled': data.get('public_profile_enabled', False),
                        'public_profile_slug': data.get('public_profile_slug'),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'health_score': 62.1,
            'items_total': 8,
            'items_approved': 5,
            'public_profile_enabled': False,
            'public_profile_slug': None,
        }


class CohortService:
    """Cohort/Program service client."""
    
    @staticmethod
    def get_student_view(user_id: int) -> Dict[str, Any]:
        """Get cohort information for student."""
        api_url = os.environ.get('COHORT_API_URL', 'http://localhost:8006/api/v1')
        api_key = os.environ.get('COHORT_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/cohorts/students/{user_id}",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'cohort_id': data.get('cohort_id'),
                        'cohort_name': data.get('cohort_name', ''),
                        'mentor_name': data.get('mentor_name', ''),
                        'next_event': data.get('next_event', {}),
                        'completion_pct': data.get('completion_pct', 0),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'cohort_id': str(uuid.uuid4()),
            'cohort_name': 'Cyber Builders Jan 2026',
            'mentor_name': 'John Doe',
            'next_event': {
                'title': 'Mentorship Session',
                'date': '2025-12-05T14:00:00Z',
                'type': 'mentorship'
            },
            'completion_pct': 45.3,
        }


class AICoachService:
    """AI Coach service client."""
    
    @staticmethod
    def get_nudge(user_id: int) -> Dict[str, Any]:
        """Get AI coach nudge and action plan."""
        api_url = os.environ.get('AI_COACH_API_URL', 'http://localhost:8001/api/v1')
        api_key = os.environ.get('AI_COACH_API_KEY')
        openai_key = os.environ.get('OPENAI_API_KEY')
        
        # Try AI Coach API first
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/aicoach/mentees/{user_id}/daily-nudges",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'nudge': data.get('nudge', ''),
                        'action_plan': data.get('action_plan', []),
                    }
            except Exception:
                pass
        
        # Try OpenAI directly if key is available
        if openai_key:
            try:
                import openai
                openai.api_key = openai_key
                # Generate personalized nudge based on user data
                # This is a simplified version - full implementation would use user context
                response = openai.ChatCompletion.create(
                    model=os.environ.get('AI_COACH_MODEL', 'gpt-4'),
                    messages=[
                        {'role': 'system', 'content': 'You are an AI career coach for cybersecurity students.'},
                        {'role': 'user', 'content': f'Generate a brief, actionable nudge for student {user_id}.'}
                    ],
                    temperature=float(os.environ.get('AI_COACH_TEMPERATURE', '0.7')),
                    max_tokens=150
                )
                nudge = response.choices[0].message.content
                return {
                    'nudge': nudge,
                    'action_plan': [
                        {'type': 'mission', 'title': 'Build SIEM dashboard', 'priority': 'high'},
                        {'type': 'habit', 'title': 'Daily CTF', 'priority': 'medium'},
                    ]
                }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'nudge': 'Your DFIR gap is blocking SOC readiness. Prioritize the SIEM mission this week.',
            'action_plan': [
                {'type': 'mission', 'title': 'Build SIEM dashboard', 'priority': 'high'},
                {'type': 'habit', 'title': 'Daily CTF', 'priority': 'medium'},
                {'type': 'reflection', 'title': "Yesterday's learning", 'priority': 'low'},
            ]
        }


class NotificationService:
    """Notification service client."""
    
    @staticmethod
    def get_summary(user_id: int) -> Dict[str, Any]:
        """Get notifications summary."""
        api_url = os.environ.get('NOTIFICATIONS_API_URL', 'http://localhost:8007/api/v1')
        api_key = os.environ.get('NOTIFICATIONS_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/notifications/{user_id}/summary",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'unread': data.get('unread', 0),
                        'urgent': data.get('urgent', 0),
                        'summary': data.get('summary', []),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'unread': 3,
            'urgent': 1,
            'summary': [
                'Mission approved ✅',
                'Mentor comment',
                'Payment due'
            ]
        }


class LeaderboardService:
    """Leaderboard service client."""
    
    @staticmethod
    def get_rankings(user_id: int) -> Dict[str, Any]:
        """Get leaderboard rankings."""
        api_url = os.environ.get('LEADERBOARD_API_URL', 'http://localhost:8008/api/v1')
        api_key = os.environ.get('LEADERBOARD_API_KEY')
        
        if api_key and api_url:
            try:
                response = requests.get(
                    f"{api_url}/leaderboard/users/{user_id}/rankings",
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'global_rank': data.get('global_rank'),
                        'cohort_rank': data.get('cohort_rank'),
                    }
            except Exception:
                pass  # Fall through to mock data
        
        # Mock data fallback
        return {
            'global_rank': 1247,
            'cohort_rank': 23,
        }

