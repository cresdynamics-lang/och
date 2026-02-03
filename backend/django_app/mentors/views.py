"""
Mentor Dashboard API Views
Complete mentor command center with student management, scheduling, and analytics.
"""
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Avg, Count, F
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from users.permissions import IsMentor
from .models import Mentor, MentorStudentAssignment, MentorStudentNote, MentorSession
from .serializers import (
    MentorDashboardSerializer,
    MentorStudentDetailSerializer,
    MentorStudentNoteSerializer,
    MentorSessionSerializer,
    MentorSessionCreateSerializer,
)

logger = logging.getLogger(__name__)


class MentorDashboardView(APIView):
    """
    GET /api/v1/mentors/[slug]/dashboard
    Main mentor dashboard with overview, priorities, and analytics.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request, mentor_slug):
        """Get mentor dashboard data."""
        try:
            # Get mentor profile
            mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=request.user)

            # Get assigned students
            assignments = MentorStudentAssignment.objects.filter(
                mentor=mentor,
                is_active=True
            ).select_related('student')

            assigned_students = [assignment.student for assignment in assignments]

            # Calculate today's priorities (AI would enhance this)
            today_priorities = self._calculate_today_priorities(mentor, assigned_students)

            # Get schedule for today
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)

            today_sessions = MentorSession.objects.filter(
                mentor=mentor,
                scheduled_at__range=(today_start, today_end),
                status__in=['scheduled', 'confirmed']
            ).select_related('student').order_by('scheduled_at')

            # Calculate cohort analytics
            cohort_analytics = self._calculate_cohort_analytics(mentor, assigned_students)

            dashboard_data = {
                'mentor': {
                    'id': str(mentor.id),
                    'slug': mentor.mentor_slug,
                    'full_name': mentor.user.get_full_name(),
                    'bio': mentor.bio,
                    'expertise_tracks': mentor.expertise_tracks,
                    'capacity': mentor.max_students_per_cohort,
                    'assigned_students_count': len(assigned_students),
                },
                'assigned_students': assigned_students,
                'today_priorities': today_priorities,
                'today_schedule': MentorSessionSerializer(today_sessions, many=True).data,
                'cohort_analytics': cohort_analytics,
            }

            serializer = MentorDashboardSerializer(dashboard_data)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Mentor dashboard error for {mentor_slug}: {e}", exc_info=True)
            return Response(
                {'detail': 'Failed to load mentor dashboard'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _calculate_today_priorities(self, mentor, students):
        """Calculate today's priorities for the mentor."""
        priorities = []

        # 1. Quiz reviews needed
        quiz_reviews = self._get_quiz_reviews_needed(mentor, students)
        if quiz_reviews:
            priorities.append({
                'id': 'quiz_reviews',
                'type': 'quiz_reviews',
                'title': f"{len(quiz_reviews)} Quiz Reviews Needed",
                'description': f"{len(quiz_reviews)} students submitted quizzes for review",
                'priority': 1,
                'action_url': f'/mentor/{mentor.mentor_slug}/reviews',
                'items': quiz_reviews[:3],  # Show top 3
                'total_count': len(quiz_reviews)
            })

        # 2. At-risk students
        at_risk_students = self._get_at_risk_students(mentor, students)
        if at_risk_students:
            priorities.append({
                'id': 'at_risk_students',
                'type': 'at_risk_students',
                'title': f"{len(at_risk_students)} Students At Risk",
                'description': f"{len(at_risk_students)} students need immediate attention",
                'priority': 1,
                'action_url': f'/mentor/{mentor.mentor_slug}/interventions',
                'items': at_risk_students[:3],
                'total_count': len(at_risk_students)
            })

        # 3. Today's sessions
        today_sessions = self._get_today_sessions(mentor)
        if today_sessions:
            priorities.append({
                'id': 'today_sessions',
                'type': 'sessions',
                'title': f"{len(today_sessions)} Sessions Today",
                'description': f"You have {len(today_sessions)} mentoring sessions scheduled",
                'priority': 2,
                'action_url': f'/mentor/{mentor.mentor_slug}/schedule',
                'items': today_sessions,
                'total_count': len(today_sessions)
            })

        # 4. New student assignments
        new_assignments = self._get_new_assignments(mentor)
        if new_assignments:
            priorities.append({
                'id': 'new_assignments',
                'type': 'assignments',
                'title': f"{len(new_assignments)} New Student Assignments",
                'description': f"You have {len(new_assignments)} newly assigned students",
                'priority': 3,
                'action_url': f'/mentor/{mentor.mentor_slug}/students',
                'items': new_assignments[:3],
                'total_count': len(new_assignments)
            })

        return priorities

    def _get_quiz_reviews_needed(self, mentor, students):
        """Mock: Get students who submitted quizzes for review."""
        # In production, this would query the curriculum/progress system
        return [
            {
                'student_name': 'Sarah K.',
                'track': 'defender',
                'quiz_title': 'Log Analysis Fundamentals',
                'submitted_at': '2 hours ago',
                'priority': 'high'
            },
            {
                'student_name': 'James M.',
                'track': 'defender',
                'quiz_title': 'Alert Triage Quiz',
                'submitted_at': '4 hours ago',
                'priority': 'medium'
            }
        ]

    def _get_at_risk_students(self, mentor, students):
        """Mock: Get at-risk students based on progress."""
        # In production, this would use AI ReadinessScore and progress analytics
        return [
            {
                'student_name': 'James M.',
                'track': 'defender',
                'risk_level': 'high',
                'issues': ['Stuck for 14 days', 'Failed 3 quizzes', 'Low engagement'],
                'recommended_action': 'Schedule intervention session'
            }
        ]

    def _get_today_sessions(self, mentor):
        """Get today's scheduled sessions."""
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        sessions = MentorSession.objects.filter(
            mentor=mentor,
            scheduled_at__range=(today_start, today_end),
            status__in=['scheduled', 'confirmed']
        ).select_related('student')

        return [{
            'id': str(session.id),
            'student_name': session.student.get_full_name(),
            'track': session.track_slug,
            'title': session.title,
            'scheduled_at': session.scheduled_at.isoformat(),
            'duration_minutes': session.duration_minutes,
            'meeting_url': session.meeting_url,
        } for session in sessions]

    def _get_new_assignments(self, mentor):
        """Get recently assigned students."""
        # Assignments from the last 7 days
        week_ago = timezone.now() - timedelta(days=7)

        assignments = MentorStudentAssignment.objects.filter(
            mentor=mentor,
            assigned_at__gte=week_ago,
            is_active=True
        ).select_related('student')

        return [{
            'student_name': assignment.student.get_full_name(),
            'track': assignment.track_slug,
            'assigned_at': assignment.assigned_at.isoformat(),
            'welcome_needed': True
        } for assignment in assignments]

    def _calculate_cohort_analytics(self, mentor, students):
        """Calculate cohort performance analytics."""
        # Mock analytics - in production would query progress/missions/curriculum data
        return {
            'total_students': len(students),
            'tracks_distribution': {
                'defender': 12,
                'grc': 4,
                'offensive': 2,
                'innovation': 1,
                'leadership': 1
            },
            'average_completion': 68.5,
            'completion_distribution': {
                'excellent': 3,  # 85%+
                'good': 8,       # 70-84%
                'needs_attention': 6,  # 50-69%
                'at_risk': 3      # <50%
            },
            'recent_activity': {
                'missions_completed_last_7_days': 23,
                'quizzes_submitted_last_7_days': 18,
                'community_posts_last_7_days': 45
            },
            'top_performers': [
                {'name': 'Sarah K.', 'completion': 92, 'track': 'defender'},
                {'name': 'Aisha N.', 'completion': 85, 'track': 'offensive'}
            ],
            'needs_help': [
                {'name': 'James M.', 'completion': 45, 'track': 'defender', 'days_stuck': 14},
                {'name': 'David R.', 'completion': 52, 'track': 'grc', 'days_stuck': 7}
            ]
        }


class MentorStudentDetailView(APIView):
    """
    GET /api/v1/mentors/[mentor_slug]/students/[student_id]
    Detailed view of a student's progress, notes, and sessions.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request, mentor_slug, student_id):
        """Get detailed student information."""
        try:
            # Verify mentor access
            mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=request.user)

            # Get student and verify assignment
            from users.models import User
            student = get_object_or_404(User, id=student_id)

            assignment = get_object_or_404(
                MentorStudentAssignment,
                mentor=mentor,
                student=student,
                is_active=True
            )

            # Get progress data (mock for now - would integrate with progress system)
            progress_data = self._get_student_progress(student, assignment.track_slug)

            # Get recent notes
            notes = MentorStudentNote.objects.filter(
                mentor=mentor,
                student=student
            ).order_by('-created_at')[:10]

            # Get session history
            sessions = MentorSession.objects.filter(
                mentor=mentor,
                student=student
            ).order_by('-scheduled_at')[:5]

            student_data = {
                'student': student,
                'assignment': assignment,
                'progress': progress_data,
                'recent_notes': notes,
                'recent_sessions': sessions,
                'mentor': mentor
            }

            serializer = MentorStudentDetailSerializer(student_data)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Mentor student detail error: {e}", exc_info=True)
            return Response(
                {'detail': 'Failed to load student details'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_student_progress(self, student, track_slug):
        """Get student's progress data."""
        # Mock progress data - in production would query curriculum progress
        return {
            'track': track_slug,
            'overall_completion': 68,
            'missions_completed': 18,
            'total_missions': 25,
            'quizzes_passed': 9,
            'total_quizzes': 12,
            'current_level': 'intermediate',
            'time_spent_hours': 45,
            'last_activity': '2 hours ago',
            'readiness_score': 72,
            'strengths': ['Log analysis', 'Network monitoring'],
            'areas_for_improvement': ['Alert triage', 'Incident response']
        }


class MentorStudentNoteViewSet(ModelViewSet):
    """
    POST /api/v1/mentors/[mentor_slug]/students/[student_id]/notes/
    CRUD operations for mentor notes on students.
    """
    permission_classes = [IsAuthenticated, IsMentor]
    serializer_class = MentorStudentNoteSerializer

    def get_queryset(self):
        mentor_slug = self.kwargs.get('mentor_slug')
        student_id = self.kwargs.get('student_id')

        mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=self.request.user)

        return MentorStudentNote.objects.filter(
            mentor=mentor,
            student_id=student_id
        ).order_by('-created_at')

    def perform_create(self, serializer):
        mentor_slug = self.kwargs.get('mentor_slug')
        student_id = self.kwargs.get('student_id')

        mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=self.request.user)

        serializer.save(
            mentor=mentor,
            student_id=student_id
        )


class MentorSessionViewSet(ModelViewSet):
    """
    POST /api/v1/mentors/[mentor_slug]/schedule/
    CRUD operations for mentor sessions.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def get_serializer_class(self):
        if self.action == 'create':
            return MentorSessionCreateSerializer
        return MentorSessionSerializer

    def get_queryset(self):
        mentor_slug = self.kwargs.get('mentor_slug')
        mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=self.request.user)

        return MentorSession.objects.filter(mentor=mentor).order_by('-scheduled_at')

    def perform_create(self, serializer):
        mentor_slug = self.kwargs.get('mentor_slug')
        mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=self.request.user)

        serializer.save(mentor=mentor)


class MentorBoostView(APIView):
    """
    POST /api/v1/mentors/[mentor_slug]/boost/
    Trigger AI interventions for students or cohorts.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def post(self, request, mentor_slug):
        """Trigger boost interventions."""
        try:
            mentor = get_object_or_404(Mentor, mentor_slug=mentor_slug, user=request.user)

            boost_type = request.data.get('type')  # 'student' or 'cohort'
            target_ids = request.data.get('target_ids', [])
            track_slug = request.data.get('track_slug')

            if boost_type not in ['student', 'cohort']:
                return Response(
                    {'detail': 'Invalid boost type. Must be "student" or "cohort"'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mock boost implementation - in production would trigger AI NudgeEngine
            boost_result = self._trigger_boost(mentor, boost_type, target_ids, track_slug)

            return Response({
                'success': True,
                'boost_type': boost_type,
                'targets_boosted': len(target_ids),
                'interventions_triggered': boost_result['interventions'],
                'message': boost_result['message']
            })

        except Exception as e:
            logger.error(f"Mentor boost error: {e}", exc_info=True)
            return Response(
                {'detail': 'Failed to trigger boost interventions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _trigger_boost(self, mentor, boost_type, target_ids, track_slug):
        """Mock boost implementation."""
        interventions = []

        if boost_type == 'student':
            interventions = [
                f"Sent personalized recipe: '{track_slug} Fundamentals Review'",
                f"Scheduled 15-minute intervention session",
                f"Activated progress nudge campaign"
            ]
        elif boost_type == 'cohort':
            interventions = [
                f"Deployed track-specific recipe campaign for {len(target_ids)} students",
                f"Scheduled weekly progress check-in",
                f"Activated NudgeEngine escalation protocols"
            ]

        return {
            'interventions': interventions,
            'message': f"Successfully triggered {len(interventions)} interventions for {boost_type} boost"
        }
