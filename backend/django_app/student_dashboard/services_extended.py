"""
Extended service layer for Student Dashboard.
Integrates with Profiler, Coaching OS, Curriculum, Missions, Portfolio, TalentScope, and Subscriptions.
"""
from decimal import Decimal
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count, Avg, Max
from users.models import User
from programs.models import Enrollment, Track, Cohort
from profiler.models import ProfilerSession
from coaching.models import Habit, HabitLog, Goal, Reflection
from missions.models import MissionSubmission, Mission
from subscriptions.models import UserSubscription, SubscriptionPlan
from .models import StudentDashboardCache, StudentMissionProgress, DashboardUpdateQueue


class StudentDashboardService:
    """Main service for student dashboard operations."""
    
    @staticmethod
    def get_or_create_cache(user: User) -> StudentDashboardCache:
        """Get or create dashboard cache for user."""
        cache, created = StudentDashboardCache.objects.get_or_create(
            user=user,
            defaults={
                'readiness_score': Decimal('0.00'),
                'time_to_ready_days': 365,
                'profile_incomplete': True,
                'subscription_tier': 'free',
            }
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
        """Mask premium fields for free tier users."""
        if tier in ['professional7', 'starter3']:
            return data
        
        # Mask premium features for free tier
        if 'subscription' in data:
            data['subscription']['enhanced_access_days'] = None
            data['subscription']['next_billing'] = None
        
        # Mask AI recommendations for free tier
        if 'quick_actions' in data:
            data['quick_actions'] = [
                action for action in data['quick_actions']
                if action.get('type') != 'ai_coach'
            ]
        
        return data


class ProfilerService:
    """Service for Profiler/Future-You data."""
    
    @staticmethod
    def get_future_you(user_id: int) -> Dict[str, Any]:
        """Get Future-You persona and track recommendation."""
        try:
            session = ProfilerSession.objects.filter(
                user_id=user_id,
                status='finished'
            ).order_by('-created_at').first()
            
            if session and session.futureyou_persona:
                persona_data = session.futureyou_persona
                track = None
                if session.recommended_track_id:
                    from programs.models import Track
                    track = Track.objects.filter(id=session.recommended_track_id).first()
                
                return {
                    'persona': persona_data.get('name', 'Not assessed'),
                    'archetype': persona_data.get('archetype', ''),
                    'skills_needed': persona_data.get('skills', []),
                    'alignment': float(session.track_confidence * 100) if session.track_confidence else 0,
                    'track': track.name if track else 'Not recommended',
                }
        except Exception:
            pass
        
        return {
            'persona': 'Not assessed',
            'alignment': 0,
            'track': 'Not recommended',
            'skills_needed': [],
        }


class CoachingOSService:
    """Service for Coaching OS data (habits, goals, reflections)."""
    
    @staticmethod
    def get_summary(user_id: int) -> Dict[str, Any]:
        """Get coaching summary: streak, goals, reflections."""
        try:
            # Get longest streak
            habits = Habit.objects.filter(user_id=user_id)
            max_streak = habits.aggregate(Max('streak_current'))['streak_current__max'] or 0
            
            # Get active goals
            active_goals = Goal.objects.filter(
                user_id=user_id,
                status='active'
            ).count()
            
            # Get completed goals this week
            week_start = timezone.now() - timedelta(days=7)
            completed_goals = Goal.objects.filter(
                user_id=user_id,
                status='completed',
                completed_at__gte=week_start
            ).count()
            
            # Get reflections last 7 days
            reflections_count = Reflection.objects.filter(
                user_id=user_id,
                created_at__gte=week_start
            ).count()
            
            # Calculate goals completed percentage
            total_goals = active_goals + completed_goals
            goals_completed_pct = (completed_goals / total_goals * 100) if total_goals > 0 else 0
            
            return {
                'streak': max_streak,
                'goals_active': active_goals,
                'goals_completed_pct': goals_completed_pct,
                'reflections_last_7d': reflections_count,
                'goals_completed_today': 0,  # TODO: Calculate from today's goals
                'goals_total_today': 5,  # TODO: Get from user's daily goal target
            }
        except Exception:
            return {
                'streak': 0,
                'goals_active': 0,
                'goals_completed_pct': 0,
                'reflections_last_7d': 0,
                'goals_completed_today': 0,
                'goals_total_today': 5,
            }


class CurriculumService:
    """Service for curriculum/track progress."""
    
    @staticmethod
    def get_track_progress(user_id: int) -> Dict[str, Any]:
        """Get curriculum progress with modules and recommended missions."""
        try:
            enrollment = Enrollment.objects.filter(
                user_id=user_id,
                status='active'
            ).first()
            
            if not enrollment or not enrollment.track:
                return {
                    'track': 'Not assigned',
                    'completion': 0,
                    'modules': [],
                }
            
            track = enrollment.track
            
            # Calculate completion (mock for now - should come from module completion)
            # TODO: Integrate with actual module progress tracking
            completion = 0
            
            # Get recommended missions (mock)
            modules = [
                {
                    'title': 'SIEM Fundamentals',
                    'progress': 85,
                    'status': 'completed',
                    'recommended_missions': ['SIEM-01', 'SIEM-02'],
                },
                {
                    'title': 'Incident Response',
                    'progress': 23,
                    'status': 'in_progress',
                    'next_mission': 'IR-01',
                },
            ]
            
            return {
                'track': track.name,
                'completion': completion,
                'modules': modules,
            }
        except Exception:
            return {
                'track': 'Not assigned',
                'completion': 0,
                'modules': [],
            }


class MissionsService:
    """Service for missions funnel data."""
    
    @staticmethod
    def get_student_funnel(user_id: int, status_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Get student's mission funnel with status, AI feedback, deadlines."""
        try:
            submissions = MissionSubmission.objects.filter(user_id=user_id)
            
            if status_filter:
                # Map status filter to submission statuses
                status_map = {
                    'pending': ['draft', 'submitted'],
                    'in_review': ['ai_reviewed', 'mentor_review'],
                    'approved': ['approved'],
                }
                filter_statuses = []
                for filter_status in status_filter:
                    filter_statuses.extend(status_map.get(filter_status, [filter_status]))
                submissions = submissions.filter(status__in=filter_statuses)
            
            missions_data = []
            for submission in submissions.select_related('mission'):
                mission_data = {
                    'mission_id': str(submission.mission.id),
                    'title': submission.mission.title,
                    'difficulty': submission.mission.difficulty,
                    'status': submission.status,
                    'ai_feedback': submission.ai_feedback or '',
                    'deadline': None,  # TODO: Get from mission or cohort schedule
                    'competencies': submission.mission.competencies or [],
                }
                
                # Map submission status to funnel status
                if submission.status in ['draft', 'submitted']:
                    mission_data['status'] = 'pending'
                elif submission.status in ['ai_reviewed', 'mentor_review']:
                    mission_data['status'] = 'in_review'
                elif submission.status == 'approved':
                    mission_data['status'] = 'approved'
                
                missions_data.append(mission_data)
            
            return missions_data
        except Exception:
            return []


class PortfolioService:
    """Service for portfolio health data."""
    
    @staticmethod
    def get_health(user_id: int) -> Dict[str, Any]:
        """Get portfolio health score and status."""
        # TODO: Integrate with actual portfolio service
        return {
            'health': 0,
            'items_total': 0,
            'items_approved': 0,
        }


class TalentScopeService:
    """Service for TalentScope readiness data."""
    
    @staticmethod
    def get_readiness(user_id: int) -> Dict[str, Any]:
        """Get readiness score and skill gaps."""
        # TODO: Integrate with actual TalentScope service
        return {
            'score': 0,
            'gaps': [],
            'time_to_ready_days': 365,
        }


class SubscriptionService:
    """Service for subscription and entitlements."""
    
    @staticmethod
    def get_entitlements(user_id: int) -> Dict[str, Any]:
        """Get subscription tier and enhanced access info."""
        try:
            subscription = UserSubscription.objects.filter(
                user_id=user_id,
                status='active'
            ).select_related('plan').first()
            
            if subscription:
                tier = subscription.plan.name if subscription.plan else 'free'
                enhanced_days = subscription.days_enhanced_left
                next_billing = subscription.current_period_end.date().isoformat() if subscription.current_period_end else None
                
                return {
                    'tier': tier,
                    'enhanced_days': enhanced_days,
                    'next_billing': next_billing,
                }
        except Exception:
            pass
        
        return {
            'tier': 'free',
            'enhanced_days': None,
            'next_billing': None,
        }


class AICoachService:
    """Service for AI recommendations and nudges."""
    
    @staticmethod
    def generate_next_actions(context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered next actions and nudges."""
        # TODO: Integrate with actual AI service (OpenAI/Groq)
        
        # Mock recommendations based on context
        primary = None
        nudges = []
        
        if context.get('missions_pending', 0) > 0:
            primary = {
                'mission_id': None,
                'title': 'Complete pending missions',
                'priority_reason': 'You have pending missions',
                'deadline': None,
            }
        
        if context.get('readiness', 0) < 60:
            nudges.append({
                'type': 'readiness_low',
                'action': 'Focus on skill gaps to improve readiness',
                'url': '/curriculum',
            })
        
        return {
            'primary': primary or {},
            'nudges': nudges,
        }

