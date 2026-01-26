"""
Views for Mentorship Coordination Engine.
"""
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Count, F
from django.contrib.auth import get_user_model
from datetime import timedelta
import json
import uuid

from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag, SessionAttendance, SessionFeedback, MentorshipMessage, MessageAttachment, NotificationLog
from .serializers import (
    MenteeMentorAssignmentSerializer,
    MentorSessionSerializer,
    MentorWorkQueueSerializer,
    MentorFlagSerializer,
    CreateSessionSerializer,
    CreateGroupSessionSerializer,
    MissionReviewSerializer,
    CreateFlagSerializer,
    MentorshipMessageSerializer,
    NotificationLogSerializer,
    CreateNotificationSerializer
)
from missions.models import MissionSubmission
from student_dashboard.services import DashboardAggregationService
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def get_current_mentor(user):
    """Verify user is a mentor (either via is_mentor flag or active mentor role)."""
    # Fast path: explicit mentor flag
    if getattr(user, 'is_mentor', False):
        return user

    # Fallback: active role record
    try:
        from users.models import UserRole
        has_mentor_role = UserRole.objects.filter(
            user=user,
            role__name='mentor',
            is_active=True
        ).exists()
        if has_mentor_role:
            return user
    except Exception:
        # If role system isn't available, keep legacy behavior
        pass

    raise Exception("User is not a mentor")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_session_feedback(request, session_id):
    """
    POST /api/v1/sessions/{session_id}/feedback
    Submit mentee feedback on a mentorship session (Two-Way Feedback System).
    """
    try:
        session = MentorSession.objects.get(id=session_id, type='group')
    except MentorSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify the mentee was part of this session
    mentee_id = str(request.user.id)
    attendance = SessionAttendance.objects.filter(
        session=session,
        mentee_id=mentee_id
    ).first()
    
    if not attendance:
        return Response(
            {'error': 'You can only provide feedback for sessions you attended'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data or {}
    
    # Validate required fields
    required_fields = ['overall_rating', 'mentor_engagement', 'mentor_preparation', 'session_value']
    for field in required_fields:
        if field not in data:
            return Response(
                {'error': f'Missing required field: {field}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(data[field], int) or data[field] < 1 or data[field] > 5:
            return Response(
                {'error': f'{field} must be an integer between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create or update feedback (one feedback per mentee per session)
    feedback, created = SessionFeedback.objects.update_or_create(
        session=session,
        mentee_id=mentee_id,
        defaults={
            'mentor': session.mentor,
            'overall_rating': data['overall_rating'],
            'mentor_engagement': data['mentor_engagement'],
            'mentor_preparation': data['mentor_preparation'],
            'session_value': data['session_value'],
            'strengths': data.get('strengths', ''),
            'areas_for_improvement': data.get('areas_for_improvement', ''),
            'additional_comments': data.get('additional_comments', ''),
        }
    )
    
    logger.info(f"{'Created' if created else 'Updated'} feedback for session {session_id} from mentee {mentee_id}")
    
    return Response({
        'id': str(feedback.id),
        'session_id': str(session.id),
        'mentee_id': str(feedback.mentee.id),
        'mentee_name': feedback.mentee.get_full_name() or feedback.mentee.email,
        'overall_rating': feedback.overall_rating,
        'mentor_engagement': feedback.mentor_engagement,
        'mentor_preparation': feedback.mentor_preparation,
        'session_value': feedback.session_value,
        'strengths': feedback.strengths,
        'areas_for_improvement': feedback.areas_for_improvement,
        'additional_comments': feedback.additional_comments,
        'submitted_at': feedback.submitted_at.isoformat(),
        'updated_at': feedback.updated_at.isoformat(),
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_feedback(request, session_id):
    """
    GET /api/v1/sessions/{session_id}/feedback
    Get feedback for a session (mentors can see all feedback, mentees can see their own).
    """
    try:
        session = MentorSession.objects.get(id=session_id, type='group')
    except MentorSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user_id = str(request.user.id)
    
    # Mentors can see all feedback, mentees can only see their own
    if str(session.mentor.id) == user_id:
        # Mentor viewing - get all feedback
        feedback_list = SessionFeedback.objects.filter(session=session).select_related('mentee')
    else:
        # Mentee viewing - get only their feedback
        feedback_list = SessionFeedback.objects.filter(session=session, mentee_id=user_id).select_related('mentee')
    
    feedback_data = []
    for feedback in feedback_list:
        feedback_data.append({
            'id': str(feedback.id),
            'session_id': str(session.id),
            'mentee_id': str(feedback.mentee.id),
            'mentee_name': feedback.mentee.get_full_name() or feedback.mentee.email,
            'overall_rating': feedback.overall_rating,
            'mentor_engagement': feedback.mentor_engagement,
            'mentor_preparation': feedback.mentor_preparation,
            'session_value': feedback.session_value,
            'strengths': feedback.strengths,
            'areas_for_improvement': feedback.areas_for_improvement,
            'additional_comments': feedback.additional_comments,
            'submitted_at': feedback.submitted_at.isoformat(),
            'updated_at': feedback.updated_at.isoformat(),
        })
    
    return Response({
        'session_id': str(session.id),
        'feedback': feedback_data,
        'count': len(feedback_data),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_feedback_summary(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/feedback-summary
    Get feedback summary for a mentor (average ratings, total feedback count).
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own feedback summary'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        mentor = get_current_mentor(request.user)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all feedback for this mentor's sessions
    feedback_stats = SessionFeedback.objects.filter(
        mentor=mentor
    ).aggregate(
        total_feedback=Count('id'),
        avg_overall_rating=Avg('overall_rating'),
        avg_engagement=Avg('mentor_engagement'),
        avg_preparation=Avg('mentor_preparation'),
        avg_value=Avg('session_value'),
    )
    
    return Response({
        'mentor_id': str(mentor.id),
        'total_feedback_count': feedback_stats['total_feedback'] or 0,
        'average_overall_rating': round(float(feedback_stats['avg_overall_rating'] or 0), 2),
        'average_engagement': round(float(feedback_stats['avg_engagement'] or 0), 2),
        'average_preparation': round(float(feedback_stats['avg_preparation'] or 0), 2),
        'average_value': round(float(feedback_stats['avg_value'] or 0), 2),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_flags(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/flags
    Get flags raised by this mentor.

    Optional query params:
    - status: open|closed (maps to resolved flag)
    - severity: low|medium|high|critical
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own flags'},
            status=status.HTTP_403_FORBIDDEN
        )

    mentor = get_current_mentor(request.user)

    qs = MentorFlag.objects.filter(mentor=mentor)

    status_filter = request.query_params.get('status')
    if status_filter:
        sf = status_filter.strip().lower()
        if sf in ['open', 'active', 'pending']:
            qs = qs.filter(resolved=False)
        elif sf in ['closed', 'resolved', 'done']:
            qs = qs.filter(resolved=True)

    severity = request.query_params.get('severity')
    if severity:
        qs = qs.filter(severity=severity)

    qs = qs.order_by('-created_at')
    serializer = MentorFlagSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def _mentor_can_view_mentee(mentor, mentee) -> bool:
    """
    Mentors can view a mentee if:
    - there's an active direct mentor<->mentee assignment, OR
    - the mentor is assigned (active) to any cohort the mentee is actively enrolled in.
    """
    if MenteeMentorAssignment.objects.filter(mentor=mentor, mentee=mentee, status='active').exists():
        return True

    try:
        from programs.models import Enrollment, MentorAssignment
        mentee_cohort_ids = Enrollment.objects.filter(
            user=mentee,
            status='active'
        ).values_list('cohort_id', flat=True)
        if not mentee_cohort_ids:
            return False
        return MentorAssignment.objects.filter(
            mentor=mentor,
            cohort_id__in=mentee_cohort_ids,
            active=True
        ).exists()
    except Exception:
        # If programs app isn't available, fall back to direct assignment only
        return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentee_talentscope(request, mentor_id, mentee_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees/{mentee_id}/talentscope
    TalentScope mentor view for a specific mentee.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own mentor analytics'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response({'error': 'Mentee not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _mentor_can_view_mentee(mentor, mentee):
        return Response({'error': 'Mentee not assigned to this mentor'}, status=status.HTTP_403_FORBIDDEN)

    # Pull TalentScope models if available
    try:
        from talentscope.models import SkillSignal, BehaviorSignal, ReadinessSnapshot
    except Exception:
        SkillSignal = None
        BehaviorSignal = None
        ReadinessSnapshot = None

    # Latest readiness snapshot (source of truth for advanced fields)
    latest_snapshot = None
    if ReadinessSnapshot is not None:
        latest_snapshot = ReadinessSnapshot.objects.filter(mentee=mentee).order_by('-snapshot_date').first()

    # Skills heatmap (skill_name -> mastery_level)
    skills_heatmap = {}
    if SkillSignal is not None:
        latest_by_skill = {}
        for s in SkillSignal.objects.filter(mentee=mentee).order_by('-created_at')[:500]:
            if s.skill_name not in latest_by_skill:
                latest_by_skill[s.skill_name] = s
        skills_heatmap = {k: float(v.mastery_level) for k, v in latest_by_skill.items()}

    # Behavioral trends (last 30 days)
    today = timezone.now().date()
    start = today - timedelta(days=29)
    days = [start + timedelta(days=i) for i in range(30)]
    trend_map = {d.isoformat(): {'missions_completed': 0, 'hours_studied': 0.0, 'reflections_count': 0} for d in days}

    # Missions completed (approved)
    for row in MissionSubmission.objects.filter(
        user=mentee,
        status='approved',
        created_at__date__gte=start,
        created_at__date__lte=today
    ).values('created_at__date').annotate(c=Count('id')):
        day = row['created_at__date'].isoformat()
        trend_map[day]['missions_completed'] = int(row['c'])

    if BehaviorSignal is not None:
        # hours_studied: sum of study_consistency values
        for row in BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type='study_consistency',
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).values('recorded_at__date').annotate(total=Count('id'), sum_val=F('recorded_at__date')):
            # We can't sum DecimalField with this limited import set in this file; do a simple per-row loop instead.
            pass

        # fallback simple aggregation in python (safe, small window)
        for sig in BehaviorSignal.objects.filter(
            mentee=mentee,
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).only('behavior_type', 'value', 'recorded_at')[:2000]:
            day = sig.recorded_at.date().isoformat()
            if day not in trend_map:
                continue
            if sig.behavior_type == 'study_consistency':
                trend_map[day]['hours_studied'] += float(sig.value)
            if sig.behavior_type == 'reflection_frequency':
                trend_map[day]['reflections_count'] += 1

    behavioral_trends = [
        {'date': d, **vals} for d, vals in sorted(trend_map.items(), key=lambda x: x[0])
    ]

    # Readiness over time
    readiness_over_time = []
    if ReadinessSnapshot is not None:
        for snap in ReadinessSnapshot.objects.filter(mentee=mentee).order_by('snapshot_date')[:120]:
            readiness_over_time.append({
                'date': snap.snapshot_date.date().isoformat(),
                'score': float(snap.core_readiness_score)
            })

    # Ingested signals (best-effort counts)
    mentor_evaluations = MentorSession.objects.filter(mentor=mentor, mentee=mentee).count()
    habit_logs = 0
    community_engagement = 0
    if BehaviorSignal is not None:
        habit_logs = BehaviorSignal.objects.filter(mentee=mentee, source='habit_log').count()
        community_engagement = BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type__in=['engagement_level', 'collaboration']
        ).count()

    mission_scores = MissionSubmission.objects.filter(
        user=mentee
    ).filter(Q(ai_score__isnull=False) | Q(mentor_score__isnull=False)).count()

    # Default advanced fields from snapshot when available
    core_readiness_score = float(latest_snapshot.core_readiness_score) if latest_snapshot else None
    career_readiness_stage = getattr(latest_snapshot, 'career_readiness_stage', None) if latest_snapshot else None
    learning_velocity = float(latest_snapshot.learning_velocity) if latest_snapshot and latest_snapshot.learning_velocity is not None else None
    estimated_readiness_window = getattr(latest_snapshot, 'estimated_readiness_window', None) if latest_snapshot else None

    readiness_breakdown = getattr(latest_snapshot, 'breakdown', None) if latest_snapshot else None
    gap_analysis = None
    professional_tier_data = None
    if latest_snapshot:
        gap_analysis = {
            'strengths': getattr(latest_snapshot, 'strengths', []) or [],
            'weaknesses': getattr(latest_snapshot, 'weaknesses', []) or [],
            'missing_skills': getattr(latest_snapshot, 'missing_skills', []) or [],
            'improvement_plan': getattr(latest_snapshot, 'improvement_plan', []) or [],
        }
        professional_tier_data = {
            'job_fit_score': float(latest_snapshot.job_fit_score) if latest_snapshot.job_fit_score is not None else None,
            'hiring_timeline_prediction': getattr(latest_snapshot, 'hiring_timeline_prediction', None),
            'track_benchmarks': getattr(latest_snapshot, 'track_benchmarks', None) or {},
        }

    return Response({
        'mentee_id': str(mentee.id),
        'mentee_name': mentee.get_full_name() or mentee.email,
        'ingested_signals': {
            'mentor_evaluations': mentor_evaluations,
            'habit_logs': habit_logs,
            'mission_scores': mission_scores,
            'reflection_sentiment': {'positive': 0, 'neutral': 0, 'negative': 0},
            'community_engagement': community_engagement,
        },
        'skills_heatmap': skills_heatmap,
        'behavioral_trends': behavioral_trends,
        'readiness_over_time': readiness_over_time,
        'core_readiness_score': core_readiness_score,
        'career_readiness_stage': career_readiness_stage,
        'learning_velocity': learning_velocity,
        'estimated_readiness_window': estimated_readiness_window,
        'readiness_breakdown': readiness_breakdown,
        'gap_analysis': gap_analysis,
        'professional_tier_data': professional_tier_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_cohort_missions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/cohorts
    List missions from cohorts assigned to the mentor (read-only view).
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own missions view'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    # Get cohorts assigned to this mentor
    try:
        from programs.models import MentorAssignment, Cohort
        from missions.models import Mission
        
        cohort_ids = MentorAssignment.objects.filter(
            mentor=mentor, 
            active=True
        ).values_list('cohort_id', flat=True)
        
        if not cohort_ids:
            return Response({
                'results': [],
                'count': 0,
                'page': 1,
                'page_size': 20,
                'has_next': False,
                'has_previous': False
            })
        
        # Get tracks from assigned cohorts
        cohorts = Cohort.objects.filter(id__in=cohort_ids).select_related('track')
        track_ids = [cohort.track_id for cohort in cohorts if cohort.track_id]
        
        if not track_ids:
            return Response({
                'results': [],
                'count': 0,
                'page': 1,
                'page_size': 20,
                'has_next': False,
                'has_previous': False
            })
        
        # Get missions for these tracks
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        offset = (page - 1) * page_size
        
        # Build query
        qs = Mission.objects.filter(track_id__in=track_ids)
        
        # Apply filters
        difficulty = request.query_params.get('difficulty')
        if difficulty and difficulty != 'all':
            qs = qs.filter(difficulty=difficulty)
        
        track_key = request.query_params.get('track')
        if track_key and track_key != 'all':
            qs = qs.filter(track_key=track_key)
        
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )
        
        total = qs.count()
        missions = qs.order_by('code', 'title')[offset:offset + page_size]
        
        # Build track lookup for context
        from programs.models import Track
        tracks = Track.objects.filter(id__in=track_ids).select_related('program')
        track_lookup = {}
        for track in tracks:
            track_lookup[str(track.id)] = {
                'name': track.name,
                'key': track.key,
                'program_id': str(track.program_id) if track.program_id else None,
                'program_name': track.program.name if track.program else None,
            }
        
        # Serialize missions
        from missions.serializers import MissionSerializer
        serializer = MissionSerializer(
            missions, 
            many=True,
            context={'track_lookup': track_lookup, 'request': request}
        )
        
        return Response({
            'results': serializer.data,
            'count': total,
            'total': total,
            'page': page,
            'page_size': page_size,
            'has_next': offset + page_size < total,
            'has_previous': page > 1
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching mentor cohort missions: {e}")
        return Response(
            {'error': 'Failed to fetch missions'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mission_submissions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/submissions
    List mission submissions for mentees a mentor can access.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own submissions view'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    status_filter = request.query_params.get('status')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size

    mentee_ids = set(MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).values_list('mentee_id', flat=True))

    # Include mentees from cohorts the mentor is assigned to (best effort)
    try:
        from programs.models import Enrollment, MentorAssignment
        cohort_ids = MentorAssignment.objects.filter(mentor=mentor, active=True).values_list('cohort_id', flat=True)
        cohort_mentee_ids = Enrollment.objects.filter(cohort_id__in=cohort_ids, status='active').values_list('user_id', flat=True)
        mentee_ids.update(cohort_mentee_ids)
    except Exception:
        pass

    qs = MissionSubmission.objects.filter(user_id__in=list(mentee_ids)).select_related('user', 'mission').order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    total = qs.count()
    rows = qs[offset:offset + page_size]

    results = []
    for sub in rows:
        results.append({
            'id': str(sub.id),
            'mission_id': str(sub.mission_id),
            'mission_title': getattr(sub.mission, 'title', ''),
            'mentee_id': str(sub.user_id),
            'mentee_name': sub.user.get_full_name() or sub.user.email,
            'mentee_email': sub.user.email,
            'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None,
            'status': sub.status,
            'mentor_score': float(sub.mentor_score) if sub.mentor_score is not None else None,
            'ai_score': float(sub.ai_score) if sub.ai_score is not None else None,
        })

    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


def _ensure_tz_aware(dt):
    if dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_group_session(request, session_id):
    """
    PATCH /api/v1/mentors/sessions/{session_id}
    Update a group mentorship session (recording/transcript, notes, attendance, schedule, closure).
    """
    mentor = get_current_mentor(request.user)
    try:
        session = MentorSession.objects.get(id=session_id, mentor=mentor, type='group')
    except MentorSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data or {}

    # Update schedule
    scheduled_at = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    if scheduled_at:
        # Reuse CreateGroupSessionSerializer datetime parsing logic
        try:
            tmp = CreateGroupSessionSerializer(data={'title': 'tmp', 'scheduled_at': scheduled_at, 'duration_minutes': 60})
            tmp.is_valid(raise_exception=True)
            start_time = tmp.validated_data['scheduled_at']
            session.start_time = _ensure_tz_aware(start_time)
            if duration_minutes is None:
                duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
        except Exception as e:
            logger.error(f"Error validating scheduled_at for session {session_id}: {e}")
            logger.error(f"Received scheduled_at value: {scheduled_at}, type: {type(scheduled_at)}")
            error_msg = str(e)
            if hasattr(e, 'detail'):
                error_msg = str(e.detail)
            elif hasattr(e, 'messages'):
                error_msg = ', '.join(e.messages)
            return Response({
                'error': f'Invalid scheduled_at: {error_msg}',
                'received_value': scheduled_at
            }, status=status.HTTP_400_BAD_REQUEST)

    if duration_minutes is not None:
        try:
            dur = int(duration_minutes)
            session.end_time = _ensure_tz_aware(session.start_time) + timedelta(minutes=dur)
        except Exception:
            return Response({'error': 'Invalid duration_minutes'}, status=status.HTTP_400_BAD_REQUEST)

    # Update meeting info
    meeting_link = data.get('meeting_link')
    if meeting_link is not None:
        session.zoom_url = meeting_link

    # Update recording/transcript
    if 'recording_url' in data:
        session.recording_url = data.get('recording_url') or ''
    if 'transcript_url' in data:
        session.transcript_url = data.get('transcript_url') or ''

    # Notes - CRITICAL FIX: Ensure structured_notes are saved correctly
    if 'structured_notes' in data:
        structured_notes_data = data.get('structured_notes')
        logger.info(f"Received structured_notes for session {session_id}: {structured_notes_data} (type: {type(structured_notes_data)})")
        
        # Always save the structured_notes data as-is (even if empty dict to clear notes)
        if structured_notes_data is not None:
            # Ensure it's a dict (in case it comes as a string)
            if isinstance(structured_notes_data, str):
                try:
                    structured_notes_data = json.loads(structured_notes_data)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse structured_notes JSON string: {structured_notes_data}")
                    structured_notes_data = {}
            
            # CRITICAL: Explicitly set the value and ensure it's a proper dict
            # Django JSONField needs a dict, not None
            if not isinstance(structured_notes_data, dict):
                logger.error(f"structured_notes_data is not a dict: {type(structured_notes_data)}")
                structured_notes_data = {}
            
            # Set the value
            session.structured_notes = structured_notes_data
            logger.info(f"Setting structured_notes for session {session_id} to: {session.structured_notes}")
            logger.info(f"structured_notes keys after setting: {list(session.structured_notes.keys()) if session.structured_notes else 'None'}")
            
            # Auto-complete session if notes are added and session end time has passed
            # Check if notes have meaningful content
            has_notes_content = (
                structured_notes_data.get('key_takeaways') and len(structured_notes_data.get('key_takeaways', [])) > 0
            ) or (
                structured_notes_data.get('action_items') and len(structured_notes_data.get('action_items', [])) > 0
            ) or (
                structured_notes_data.get('discussion_points') and structured_notes_data.get('discussion_points', '').strip()
            ) or (
                structured_notes_data.get('mentor_reflections') and structured_notes_data.get('mentor_reflections', '').strip()
            ) or (
                structured_notes_data.get('next_steps') and structured_notes_data.get('next_steps', '').strip()
            )
            
            # If session has ended and notes have content, mark as attended (completed)
            if has_notes_content and timezone.now() >= session.end_time and not session.attended and not session.cancelled:
                session.attended = True
                logger.info(f"Auto-marking session {session_id} as completed (attended=True) because notes were added after session end time")
            
            # CRITICAL: Save this field immediately to ensure it's persisted
            # Use update_fields to force save this specific field
            fields_to_update = ['structured_notes']
            if session.attended:
                fields_to_update.append('attended')
            session.save(update_fields=fields_to_update)
            logger.info(f"Saved structured_notes field immediately. After save: {session.structured_notes}")
            logger.info(f"After immediate save - keys: {list(session.structured_notes.keys()) if session.structured_notes else 'None'}")
    if 'notes' in data:
        session.notes = data.get('notes') or ''

    # Cancel session
    if 'cancelled' in data:
        session.cancelled = bool(data.get('cancelled'))
        if session.cancelled and 'cancellation_reason' in data:
            session.cancellation_reason = data.get('cancellation_reason', '')
        elif not session.cancelled:
            session.cancellation_reason = ''
    
    # Mark session as attended (completed) - can be set explicitly
    if 'attended' in data:
        session.attended = bool(data.get('attended'))
        logger.info(f"Session {session_id} attended flag set to: {session.attended}")

    # Close session
    if 'is_closed' in data:
        session.is_closed = bool(data.get('is_closed'))
        # If closing session, also mark as attended (completed) if not already cancelled
        if session.is_closed and not session.cancelled and not session.attended:
            session.attended = True
            logger.info(f"Auto-marking session {session_id} as attended (completed) when closing")

    # Attendance records (optional)
    attendance = data.get('attendance')
    if isinstance(attendance, list):
        for row in attendance:
            mentee_id = row.get('mentee_id')
            if not mentee_id:
                continue
            rec, _ = SessionAttendance.objects.get_or_create(session=session, mentee_id=mentee_id)
            if 'attended' in row:
                rec.attended = bool(row.get('attended'))
            if row.get('joined_at'):
                try:
                    rec.joined_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['joined_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            if row.get('left_at'):
                try:
                    rec.left_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['left_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            rec.save()

    session.save()
    
    # Refresh from database to ensure we have the latest data
    session.refresh_from_db()
    
    # Send session reminders if session is scheduled and start_time is in the future
    if session.start_time > timezone.now() and not session.cancelled:
        try:
            send_session_reminder(session, reminder_minutes=60)  # 1 hour before
        except Exception as e:
            logger.error(f"Error sending session reminder: {str(e)}", exc_info=True)
    
    # Send feedback reminder if session has ended and feedback not submitted
    if session.end_time < timezone.now() and session.attended and not session.cancelled:
        try:
            send_feedback_reminder(session)
        except Exception as e:
            logger.error(f"Error sending feedback reminder: {str(e)}", exc_info=True)
    
    # Log the saved structured_notes to verify they were saved
    logger.info(f"Session {session_id} saved. structured_notes type: {type(session.structured_notes)}, value: {session.structured_notes}")

    # Return in the same shape as mentor_sessions list
    now = timezone.now()
    start_time = _ensure_tz_aware(session.start_time)
    end_time = _ensure_tz_aware(session.end_time)
    
    # Determine session status based on business logic:
    # 1. Cancelled takes precedence - if cancelled, status is always 'cancelled'
    # 2. Completed - if attended flag is True
    # 3. In Progress - if current time is between start_time and end_time
    # 4. Scheduled - if start_time is in the future
    if session.cancelled:
        session_status = 'cancelled'
    elif session.attended:
        session_status = 'completed'
    elif start_time <= now <= end_time:
        session_status = 'in_progress'
    else:
        session_status = 'scheduled'

    attendance_out = []
    for rec in session.attendance_records.select_related('mentee').all():
        attendance_out.append({
            'mentee_id': str(rec.mentee_id),
            'mentee_name': rec.mentee.get_full_name() or rec.mentee.email,
            'attended': rec.attended,
            'joined_at': rec.joined_at.isoformat() if rec.joined_at else None,
            'left_at': rec.left_at.isoformat() if rec.left_at else None,
        })

    return Response({
        'id': str(session.id),
        'mentor_id': str(mentor.id),
        'title': session.title,
        'description': (session.outcomes or {}).get('description', '') if isinstance(session.outcomes, dict) else '',
        'scheduled_at': session.start_time.isoformat(),
        'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
        'meeting_link': session.zoom_url or '',
        'meeting_type': (session.outcomes or {}).get('meeting_type', 'zoom') if isinstance(session.outcomes, dict) else 'zoom',
        'track_assignment': (session.outcomes or {}).get('track_assignment', '') if isinstance(session.outcomes, dict) else '',
        'recording_url': session.recording_url or None,
        'transcript_url': session.transcript_url or None,
        'status': session_status,
        'attendance': attendance_out,
        'structured_notes': session.structured_notes if session.structured_notes else {},
        'cancelled': session.cancelled,
        'cancellation_reason': session.cancellation_reason if session.cancelled else None,
        'is_closed': session.is_closed,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_influence_index(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/influence
    Mentor influence index based on TalentScope MentorInfluence records.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own influence index'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        from talentscope.models import MentorInfluence
    except Exception:
        # Return a stable response shape expected by the frontend.
        now = timezone.now().date()
        start = (now - timedelta(days=30)).isoformat()
        end = now.isoformat()
        return Response({
            'mentor_id': str(mentor_id),
            'overall_influence_score': 0.0,
            'metrics': {
                'total_feedback_given': 0,
                'average_response_time_hours': 0.0,
                'mentee_improvement_rate': 0.0,
                'session_attendance_rate': 0.0,
                'mission_approval_rate': 0.0,
            },
            'correlation_data': {
                'feedback_to_performance': 0.0,
                'sessions_to_engagement': 0.0,
                'reviews_to_mission_quality': 0.0,
            },
            'period': {'start_date': start, 'end_date': end},
            'trend_data': [],
        })

    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    qs = MentorInfluence.objects.filter(mentor=mentor)
    if start_date:
        qs = qs.filter(period_start__date__gte=start_date)
    if end_date:
        qs = qs.filter(period_end__date__lte=end_date)

    qs = qs.order_by('period_start')[:200]

    # period resolution (fall back to last 30 days if no records)
    if start_date and end_date:
        period_start = start_date
        period_end = end_date
    elif qs.exists():
        first = qs.first()
        last = qs.last()
        period_start = first.period_start.date().isoformat() if first and first.period_start else None
        period_end = last.period_end.date().isoformat() if last and last.period_end else None
    else:
        now = timezone.now().date()
        period_start = (now - timedelta(days=30)).isoformat()
        period_end = now.isoformat()

    influences = [float(x.influence_index) for x in qs if x.influence_index is not None]
    # influence_index is 0-10; frontend expects 0-100
    overall = (sum(influences) / len(influences) * 10.0) if influences else 0.0

    # Basic metric averages
    def avg(field):
        vals = [getattr(x, field) for x in qs if getattr(x, field) is not None]
        vals = [float(v) for v in vals]
        return sum(vals) / len(vals) if vals else 0.0

    # Map available TalentScope fields into the frontend's expected metrics.
    # (Some fields are proxies until deeper instrumentation exists.)
    metrics = {
        'total_feedback_given': int(qs.count()),
        'average_response_time_hours': 0.0,
        'mentee_improvement_rate': avg('performance_score'),
        'session_attendance_rate': avg('mission_completion_rate'),
        'mission_approval_rate': avg('code_quality_score'),
    }

    trend_data = [
        {'date': x.period_start.date().isoformat(), 'score': float((x.influence_index or 0) * 10.0)}
        for x in qs if x.period_start
    ]

    return Response({
        'mentor_id': str(mentor_id),
        'overall_influence_score': overall,
        'metrics': metrics,
        'correlation_data': {
            'feedback_to_performance': 0.0,
            'sessions_to_engagement': 0.0,
            'reviews_to_mission_quality': 0.0,
        },
        'period': {'start_date': period_start, 'end_date': period_end},
        'trend_data': trend_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentees(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees
    Get list of assigned mentees for a mentor.
    """
    try:
        # Verify the mentor_id matches the authenticated user
        if str(request.user.id) != str(mentor_id):
            return Response(
                {'error': 'You can only view your own mentees'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use the authenticated user as mentor (they are already verified as a mentor)
        mentor = request.user
        
        # Get active assignments
        assignments = MenteeMentorAssignment.objects.filter(
            mentor=mentor,
            status='active'
        ).select_related('mentee')
        
        # Get mentee dashboard data for readiness scores (with error handling)
        mentees_data = []
        for assignment in assignments:
            try:
                mentee = assignment.mentee
                
                # Get readiness score from dashboard cache (with safe access)
                readiness_score = 0.0
                readiness_label = "Needs Support"
                risk_level = 'low'
                
                try:
                    from student_dashboard.models import StudentDashboardCache
                    cache = StudentDashboardCache.objects.filter(user=mentee).first()
                    if cache and hasattr(cache, 'readiness_score') and cache.readiness_score is not None:
                        readiness_score = float(cache.readiness_score)
                    if cache and hasattr(cache, 'risk_level') and cache.risk_level:
                        risk_level = cache.risk_level
                except Exception as cache_err:
                    logger.warning(f"Failed to get dashboard cache for mentee {mentee.id}: {str(cache_err)}")
                
                # Determine readiness label
                if readiness_score >= 80:
                    readiness_label = "Advanced Ready"
                elif readiness_score >= 70:
                    readiness_label = "Ready for Intermediate"
                elif readiness_score >= 40:
                    readiness_label = "Needs Support"
                else:
                    readiness_label = "At Risk"
                
                # Get last activity (from last login or session)
                last_activity = mentee.last_login if hasattr(mentee, 'last_login') and mentee.last_login else None
                if not last_activity and hasattr(mentee, 'updated_at'):
                    last_activity = mentee.updated_at
                
                # Count completed missions (with error handling)
                missions_completed = 0
                try:
                    from missions.models import MissionSubmission
                    missions_completed = MissionSubmission.objects.filter(
                        user=mentee,
                        status='approved'
                    ).count()
                except Exception as mission_err:
                    logger.warning(f"Failed to get mission count for mentee {mentee.id}: {str(mission_err)}")
                
                mentees_data.append({
                    'id': str(mentee.id),
                    'name': mentee.get_full_name() if hasattr(mentee, 'get_full_name') else (mentee.email if mentee.email else str(mentee.id)),
                    'email': mentee.email if hasattr(mentee, 'email') else '',
                    'track': getattr(mentee, 'track_key', None),
                    'cohort': assignment.cohort_id or None,
                    'readiness_score': readiness_score,
                    'readiness_label': readiness_label,
                    'last_activity_at': last_activity.isoformat() if last_activity else None,
                    'risk_level': str(risk_level).lower() if risk_level else 'low',
                    'missions_completed': missions_completed,
                })
            except Exception as mentee_err:
                logger.error(f"Error processing mentee in assignment {assignment.id}: {str(mentee_err)}", exc_info=True)
                # Continue with next mentee instead of failing completely
                continue
        
        return Response(mentees_data)
    except Exception as e:
        logger.error(f"Error in mentor_mentees endpoint: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_dashboard(request):
    """
    GET /api/v1/mentor/dashboard
    Mentor home dashboard with work queue, sessions, and at-risk mentees.
    """
    mentor = get_current_mentor(request.user)
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Work queue stats
    work_queue = MentorWorkQueue.objects.filter(mentor=mentor)
    overdue = work_queue.filter(status='overdue').count()
    today_items = work_queue.filter(
        due_at__gte=today_start,
        due_at__lt=today_end,
        status__in=['pending', 'in_progress']
    ).count()
    high_priority = work_queue.filter(
        priority__in=['urgent', 'high'],
        status__in=['pending', 'in_progress']
    ).count()
    total_pending = work_queue.filter(status__in=['pending', 'in_progress']).count()
    
    # Today's sessions
    today_sessions = MentorSession.objects.filter(
        mentor=mentor,
        start_time__gte=today_start,
        start_time__lt=today_end
    ).order_by('start_time')
    
    # At-risk mentees (simplified - would integrate with TalentScope)
    at_risk_mentees = []
    active_assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).select_related('mentee')
    
    for assignment in active_assignments[:5]:  # Top 5
        flags = MentorFlag.objects.filter(
            mentee=assignment.mentee,
            resolved=False
        ).order_by('-created_at')[:1]
        
        if flags:
            flag = flags[0]
            at_risk_mentees.append({
                'mentee_id': str(assignment.mentee.id),
                'name': assignment.mentee.get_full_name() or assignment.mentee.email,
                'readiness_trend': -12.5,  # Would come from TalentScope
                'habit_streak': 0,  # Would come from Coaching OS
                'flag': flag.reason[:100]
            })
    
    # Capacity
    week_start = now - timedelta(days=now.weekday())
    week_sessions = MentorSession.objects.filter(
        mentor=mentor,
        start_time__gte=week_start
    ).count()
    capacity_used = f"{week_sessions}/{mentor.mentor_capacity_weekly}"
    
    # Next available slot (simplified)
    next_available = now + timedelta(hours=24)
    
    # Recent activity (last 10 work queue completions)
    recent_activity = MentorWorkQueue.objects.filter(
        mentor=mentor,
        status='completed'
    ).order_by('-completed_at')[:10].values(
        'mentee__email',
        'title',
        'completed_at'
    )
    
    return Response({
        'work_queue': {
            'overdue': overdue,
            'today': today_items,
            'high_priority': high_priority,
            'total_pending': total_pending
        },
        'today_sessions': MentorSessionSerializer(today_sessions, many=True).data,
        'at_risk_mentees': at_risk_mentees,
        'capacity': {
            'weekly_slots': capacity_used,
            'next_available': next_available.isoformat()
        },
        'recent_activity': [
            {
                'mentee': item['mentee__email'],
                'action': item['title'],
                'time': f"{(now - item['completed_at']).total_seconds() / 3600:.0f}h ago"
            }
            for item in recent_activity
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_workqueue(request):
    """
    GET /api/v1/mentor/workqueue
    Get mentor's work queue items.
    """
    mentor = get_current_mentor(request.user)
    
    status_filter = request.query_params.get('status', 'pending')
    priority_filter = request.query_params.get('priority')
    
    queryset = MentorWorkQueue.objects.filter(mentor=mentor)
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if priority_filter:
        queryset = queryset.filter(priority=priority_filter)
    
    queryset = queryset.order_by('-priority', 'due_at')
    
    serializer = MentorWorkQueueSerializer(queryset, many=True)
    
    # Add reference URLs
    data = serializer.data
    for item in data:
        if item['type'] == 'mission_review' and item['reference_id']:
            item['reference_url'] = f"/missions/{item['reference_id']}/review"
        else:
            item['reference_url'] = None
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentee_cockpit(request, mentee_id):
    """
    GET /api/v1/mentor/mentees/{mentee_id}/cockpit
    Get detailed mentee cockpit view.
    """
    mentor = get_current_mentor(request.user)
    
    # Verify assignment exists
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    mentee = assignment.mentee
    
    # Profile data
    profile = {
        'name': mentee.get_full_name() or mentee.email,
        'track': mentee.track_key or 'Not assigned',
        'futureyou': mentee.futureyou_persona.get('name', 'Not generated') if isinstance(mentee.futureyou_persona, dict) else 'Not generated',
        'readiness': 67.4,  # Would come from TalentScope
        'trend_7d': -2.1  # Would come from TalentScope
    }
    
    # Quick actions
    pending_missions = MissionSubmission.objects.filter(
        user=mentee,
        status__in=['submitted', 'ai_reviewed']
    ).order_by('-submitted_at')[:3]
    
    quick_actions = [
        {
            'type': 'review_mission',
            'title': mission.mission.title if hasattr(mission, 'mission') else 'Mission',
            'url': f"/missions/{mission.id}/review"
        }
        for mission in pending_missions
    ]
    quick_actions.append({
        'type': 'schedule_session',
        'url': '/sessions/new'
    })
    
    # Metrics (simplified - would integrate with actual data)
    metrics = {
        'habit_completion': 62.3,  # Would come from Coaching OS
        'missions_completed': 8,  # Would come from Missions
        'sessions_used': assignment.sessions_used
    }
    
    return Response({
        'profile': profile,
        'quick_actions': quick_actions,
        'metrics': metrics
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mentor_sessions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/sessions - List group mentorship sessions
    POST /api/v1/mentors/{mentor_id}/sessions - Create a group mentorship session
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"mentor_sessions called: method={request.method}, mentor_id={mentor_id}, user_id={request.user.id}")
    
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        logger.warning(f"Mentor ID mismatch: user_id={request.user.id}, mentor_id={mentor_id}")
        return Response(
            {'error': 'You can only access your own sessions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        mentor = get_current_mentor(request.user)
    except Exception as e:
        logger.error(f"Error getting mentor: {e}")
        return Response(
            {'error': f'User is not a mentor: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == 'GET':
        # List sessions
        status_filter = request.query_params.get('status', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = MentorSession.objects.filter(
            mentor=mentor,
            type='group'
        )
        
        if status_filter != 'all':
            # Map frontend status to database fields
            if status_filter == 'scheduled':
                queryset = queryset.filter(start_time__gt=timezone.now(), attended=False, cancelled=False)
            elif status_filter == 'completed':
                queryset = queryset.filter(attended=True, cancelled=False)
            elif status_filter == 'cancelled':
                queryset = queryset.filter(cancelled=True)
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        
        queryset = queryset.order_by('-start_time')
        sessions = queryset.select_related('mentee', 'assignment')
        
        # Format sessions for frontend
        sessions_data = []
        for session in sessions:
            outcomes = session.outcomes or {}
            # Get structured_notes - use the actual value from DB
            # Check if it's None vs empty dict - if None, use empty dict, otherwise use the actual value
            structured_notes = session.structured_notes if session.structured_notes is not None else {}
            # Debug logging
            if session.id == request.GET.get('debug_session_id'):
                logger.info(f"DEBUG: Session {session.id} structured_notes: {session.structured_notes}, type: {type(session.structured_notes)}")
            sessions_data.append({
                'id': str(session.id),
                'mentor_id': str(mentor.id),
                'title': session.title,
                'description': outcomes.get('description', ''),
                'scheduled_at': session.start_time.isoformat(),
                'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
                'meeting_link': session.zoom_url or '',
                'meeting_type': outcomes.get('meeting_type', 'zoom'),
                'track_assignment': outcomes.get('track_assignment', ''),
                'recording_url': session.recording_url or None,
                'transcript_url': session.transcript_url or None,
                'status': 'cancelled' if session.cancelled else ('completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'scheduled')),
                'attendance': [],  # Would need to be populated from a separate model
                'structured_notes': structured_notes,
                'cancelled': session.cancelled,
                'cancellation_reason': session.cancellation_reason if session.cancelled else None,
                'is_closed': session.is_closed,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            })
        
        return Response(sessions_data)
    
    elif request.method == 'POST':
        # Create group session
        logger.info(f"Creating group session with data: {request.data}")
        logger.info(f"Request data type: {type(request.data)}, keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
        
        # Clean up None/undefined values - convert to empty strings for optional fields
        cleaned_data = {}
        for key, value in request.data.items():
            if value is None or value == 'undefined':
                # For optional string fields, use empty string
                if key in ['meeting_link', 'track_assignment', 'description']:
                    cleaned_data[key] = ''
                else:
                    # Skip None values for other fields (will use defaults)
                    continue
            else:
                cleaned_data[key] = value
        
        logger.info(f"Cleaned data: {cleaned_data}")
        
        try:
            serializer = CreateGroupSessionSerializer(data=cleaned_data)
            logger.info(f"Serializer created, calling is_valid()...")
            is_valid_result = serializer.is_valid()
            logger.info(f"Serializer is_valid() returned: {is_valid_result}")
            
            if not is_valid_result:
                error_dict = dict(serializer.errors)
                error_details = {
                    'errors': error_dict,
                    'raw_data': dict(request.data),
                    'cleaned_data': cleaned_data,
                }
                logger.error(f"Serializer validation failed: {error_details}")
                # Also print to console for immediate visibility
                import sys
                print(f"VALIDATION ERROR: {error_dict}", file=sys.stderr)
                print(f"Data received: {cleaned_data}", file=sys.stderr)
                # Return errors in a format that's easy to debug
                response_data = {
                    'error': 'Validation failed',
                    'details': error_dict,
                    'received_data': cleaned_data
                }
                logger.error(f"Returning error response: {response_data}")
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Validation passed, proceed with creating the session
            logger.info("Serializer validation passed, proceeding with session creation...")
            scheduled_at = serializer.validated_data['scheduled_at']
            duration = serializer.validated_data.get('duration_minutes', 60)
            logger.info(f"Parsed scheduled_at: {scheduled_at}, duration: {duration}")
            
            end_time = scheduled_at + timedelta(minutes=duration)
            
            # For group sessions, find cohorts where the mentor is assigned
            # Get cohorts from MentorAssignment (cohort-level assignments)
            from programs.models import MentorAssignment, Cohort, Enrollment
            
            # Check if cohort_id was provided
            cohort_id = serializer.validated_data.get('cohort_id')
            
            if cohort_id:
                # Validate that the mentor is assigned to this cohort
                logger.info(f"Using provided cohort_id: {cohort_id}")
                try:
                    cohort = Cohort.objects.get(id=cohort_id)
                    cohort_assignment = MentorAssignment.objects.filter(
                        mentor=mentor,
                        cohort=cohort,
                        active=True
                    ).first()
                    
                    if not cohort_assignment:
                        logger.error(f"Mentor {mentor.id} is not assigned to cohort {cohort_id}")
                        return Response(
                            {'error': f'You are not assigned to cohort {cohort.name}. Please select a cohort you are assigned to.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Cohort.DoesNotExist:
                    logger.error(f"Cohort {cohort_id} not found")
                    return Response(
                        {'error': 'Selected cohort not found.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Fallback to first assigned cohort if no cohort_id provided
                logger.info(f"No cohort_id provided, looking for cohort assignments for mentor {mentor.id}")
                cohort_assignments = MentorAssignment.objects.filter(
                    mentor=mentor,
                    active=True
                ).select_related('cohort')
                
                if not cohort_assignments.exists():
                    logger.error(f"No active cohort assignments found for mentor {mentor.id}")
                    return Response(
                        {'error': 'No active cohort assignments found. Group sessions require at least one assigned cohort. Please select a cohort.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get the first cohort assignment
                first_cohort_assignment = cohort_assignments.first()
                cohort = first_cohort_assignment.cohort
                logger.info(f"Using first available cohort: {cohort.id} ({cohort.name})")
            
            logger.info(f"Using cohort: {cohort.id} ({cohort.name}), getting enrollments...")
            
            # Get active enrollments from this cohort to use as base for the session
            enrollments = Enrollment.objects.filter(
                cohort=cohort,
                status__in=['active', 'completed']
            ).select_related('user')
            
            if not enrollments.exists():
                logger.error(f"No active enrollments found in cohort {cohort.id}")
                return Response(
                    {'error': f'No active students found in cohort {cohort.name}. Group sessions require at least one enrolled student.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the first enrollment as the base mentee for the session
            # (Group sessions can have multiple mentees, but we need one as a base)
            first_enrollment = enrollments.first()
            first_mentee = first_enrollment.user
            
            # Try to find or create a MenteeMentorAssignment for this mentee
            # This is needed for the MentorSession model which requires an assignment
            mentee_assignment, created = MenteeMentorAssignment.objects.get_or_create(
                mentee=first_mentee,
                mentor=mentor,
                defaults={
                    'status': 'active',
                    'cohort_id': str(cohort.id),
                }
            )
            
            if created:
                logger.info(f"Created MenteeMentorAssignment for mentee {first_mentee.id}")
            else:
                logger.info(f"Using existing MenteeMentorAssignment {mentee_assignment.id}")
            
            logger.info(f"Creating group session with mentee {first_mentee.id} from cohort {cohort.id}...")
            
            # Create group session using the assignment as base (group sessions can have multiple mentees)
            meeting_link = serializer.validated_data.get('meeting_link') or ''
            if not meeting_link:
                # Generate a placeholder Zoom URL if none provided
                meeting_link = f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"
            
            session = MentorSession.objects.create(
                assignment=mentee_assignment,
                mentee=first_mentee,  # Use first mentee as placeholder
                mentor=mentor,
                title=serializer.validated_data['title'],
                type='group',
                start_time=scheduled_at,
                end_time=end_time,
                zoom_url=meeting_link,
                notes=serializer.validated_data.get('description', '') or ''
            )
            
            # Store track assignment and meeting type in outcomes JSON field
            session.outcomes = {
                'track_assignment': serializer.validated_data.get('track_assignment') or '',
                'meeting_type': serializer.validated_data.get('meeting_type') or 'zoom',
                'description': serializer.validated_data.get('description') or ''
            }
            session.save()
            
            logger.info(f"Session created successfully: {session.id}")
            
            # Send session reminders if session is scheduled and start_time is in the future
            if session.start_time > timezone.now():
                try:
                    send_session_reminder(session, reminder_minutes=60)  # 1 hour before
                except Exception as e:
                    logger.error(f"Error sending session reminder: {str(e)}", exc_info=True)
            
            # Return session data in format expected by frontend
            session_data = {
                'id': str(session.id),
                'mentor_id': str(mentor.id),
                'title': session.title,
                'description': serializer.validated_data.get('description', ''),
                'scheduled_at': scheduled_at.isoformat(),
                'duration_minutes': duration,
                'meeting_type': serializer.validated_data.get('meeting_type', 'zoom'),
                'meeting_link': session.zoom_url,
                'track_assignment': serializer.validated_data.get('track_assignment', ''),
                'recording_url': None,
                'transcript_url': None,
                'status': 'scheduled',
                'attendance': [],
                'structured_notes': {},
                'is_closed': False,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            }
            
            return Response(session_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Exception during serializer validation or session creation: {str(e)}", exc_info=True)
            import sys
            import traceback
            print(f"EXCEPTION: {str(e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return Response(
                {
                    'error': 'Error processing request',
                    'message': str(e),
                    'type': type(e).__name__
                },
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    POST /api/v1/mentor/sessions
    Create a one-on-one mentor session and schedule Zoom meeting.
    """
    mentor = get_current_mentor(request.user)
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    mentee_id = serializer.validated_data.get('mentee_id')
    
    if not mentee_id:
        return Response(
            {'error': 'mentee_id is required for one-on-one sessions'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if assignment.sessions_used >= assignment.max_sessions:
        return Response(
            {'error': 'Maximum sessions reached for this assignment'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    start_time = serializer.validated_data['start_time']
    duration = serializer.validated_data['duration_minutes']
    end_time = start_time + timedelta(minutes=duration)
    
    # Create session
    session = MentorSession.objects.create(
        assignment=assignment,
        mentee_id=mentee_id,
        mentor=mentor,
        title=serializer.validated_data['title'],
        type=serializer.validated_data['type'],
        start_time=start_time,
        end_time=end_time,
        zoom_url=f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"  # Mock Zoom URL
    )
    
    # Create work queue entry for session notes
    MentorWorkQueue.objects.create(
        mentor=mentor,
        mentee_id=mentee_id,
        type='session_notes',
        priority='normal',
        title=f"Session notes: {session.title}",
        reference_id=session.id,
        sla_hours=24,
        due_at=end_time + timedelta(hours=24)
    )
    
    # Update assignment
    assignment.sessions_used += 1
    assignment.save()
    
    # Trigger dashboard refresh for mentee
    DashboardAggregationService.queue_update(
        assignment.mentee,
        'session_scheduled',
        'normal'
    )
    
    return Response(MentorSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_session(request):
    """
    POST /api/v1/mentorship/sessions/request
    Student/mentee endpoint to request a new mentorship session.
    """
    from .serializers import RequestSessionSerializer
    
    user = request.user
    serializer = RequestSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Find the mentee's assigned mentor
    assignment = MenteeMentorAssignment.objects.filter(
        mentee=user,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'No active mentor assignment found. Please contact your program director.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    mentor = assignment.mentor
    
    # Check if max sessions reached
    if assignment.sessions_used >= assignment.max_sessions:
        return Response(
            {'error': 'Maximum sessions reached for this assignment. Please contact your mentor or program director.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse preferred date and calculate end time
    preferred_date = serializer.validated_data['preferred_date']
    duration = serializer.validated_data['duration_minutes']
    end_time = preferred_date + timedelta(minutes=duration)
    
    # Create session with 'pending' status (mentor will confirm)
    session = MentorSession.objects.create(
        assignment=assignment,
        mentee=user,
        mentor=mentor,
        title=serializer.validated_data['title'],
        type=serializer.validated_data.get('type', 'one_on_one'),
        start_time=preferred_date,
        end_time=end_time,
        notes=serializer.validated_data.get('description', '') or '',
        # Status will be 'pending' by default - mentor needs to confirm
    )
    
    # Create work queue entry for mentor to review and confirm
    MentorWorkQueue.objects.create(
        mentor=mentor,
        mentee=user,
        type='session_notes',
        priority='high',
        title=f"Session request: {session.title}",
        description=f"Mentee {user.get_full_name() or user.email} requested a session on {preferred_date.strftime('%Y-%m-%d %H:%M')}",
        reference_id=session.id,
        sla_hours=24,
        due_at=timezone.now() + timedelta(hours=24)
    )
    
    # Trigger dashboard refresh
    try:
        from dashboard.services import DashboardAggregationService
        DashboardAggregationService.queue_update(
            user,
            'session_requested',
            'normal'
        )
    except Exception:
        pass  # Dashboard service may not be available
    
    return Response({
        'id': str(session.id),
        'title': session.title,
        'start_time': session.start_time.isoformat(),
        'end_time': session.end_time.isoformat(),
        'status': 'pending',
        'message': 'Session request submitted successfully. Your mentor will review and confirm.'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_mission(request, submission_id):
    """
    POST /api/v1/mentor/missions/{submission_id}/review
    Review and approve/reject a mission submission.
    """
    mentor = get_current_mentor(request.user)
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
    except MissionSubmission.DoesNotExist:
        return Response(
            {'error': 'Mission submission not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = MissionReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Update submission
    submission.mentor_feedback = serializer.validated_data['feedback']
    submission.status = 'approved' if serializer.validated_data['approved'] else 'rejected'
    submission.reviewed_at = timezone.now()
    submission.save()
    
    # Complete work queue item
    work_item = MentorWorkQueue.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        type='mission_review',
        reference_id=submission_id,
        status__in=['pending', 'in_progress']
    ).first()
    
    if work_item:
        work_item.status = 'completed'
        work_item.completed_at = timezone.now()
        work_item.save()
    
    # Trigger dashboard refresh (would update readiness score)
    DashboardAggregationService.queue_update(
        submission.user,
        'mission_reviewed',
        'high'
    )
    
    return Response({
        'status': 'success',
        'submission_id': str(submission.id),
        'approved': serializer.validated_data['approved']
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_flag(request):
    """
    POST /api/v1/mentor/flags
    Raise a risk flag for a mentee.
    """
    mentor = get_current_mentor(request.user)
    serializer = CreateFlagSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    mentee_id = serializer.validated_data['mentee_id']
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create flag
    # Combine flag_type and description into reason field
    reason_parts = []
    if serializer.validated_data.get('flag_type'):
        reason_parts.append(f"Flag Type: {serializer.validated_data['flag_type']}")
    if serializer.validated_data.get('description'):
        reason_parts.append(serializer.validated_data['description'])
    if serializer.validated_data.get('reason'):
        reason_parts.append(serializer.validated_data['reason'])
    
    reason = ' | '.join(reason_parts) if reason_parts else 'No reason provided'
    
    flag = MentorFlag.objects.create(
        mentor=mentor,
        mentee_id=mentee_id,
        reason=reason,
        severity=serializer.validated_data['severity']
    )
    
    # Notify director if high/critical
    if serializer.validated_data['severity'] in ['high', 'critical']:
        flag.director_notified = True
        flag.save()
        # Would send notification here
    
    # Trigger dashboard refresh
    DashboardAggregationService.queue_update(
        assignment.mentee,
        'risk_flag_raised',
        'urgent'
    )
    
    return Response(MentorFlagSerializer(flag).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mission_submissions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/submissions
    Get mission submission queue for mentor's mentees.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own submissions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get active assignments
    assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).values_list('mentee_id', flat=True)
    
    status_filter = request.query_params.get('status', 'all')
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    # Get submissions for mentor's mentees
    queryset = MissionSubmission.objects.filter(user_id__in=assignments)
    
    if status_filter == 'pending_review':
        queryset = queryset.filter(status__in=['submitted', 'ai_reviewed'])
    elif status_filter == 'in_review':
        queryset = queryset.filter(status='in_review')
    
    total_count = queryset.count()
    submissions = queryset.order_by('-submitted_at')[offset:offset + limit]
    
    submissions_data = []
    for submission in submissions:
        submissions_data.append({
            'id': str(submission.id),
            'mission_id': str(submission.mission_id) if submission.mission_id else None,
            'mission_title': submission.mission.title if hasattr(submission, 'mission') and submission.mission else 'Unknown',
            'mentee_id': str(submission.user.id),
            'mentee_name': submission.user.get_full_name() or submission.user.email,
            'status': submission.status,
            'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
            'ai_score': float(submission.ai_score) if submission.ai_score else None,
            'mentor_score': float(submission.mentor_score) if submission.mentor_score else None,
        })
    
    return Response({
        'results': submissions_data,
        'count': total_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_all_missions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions
    Get all missions defined by directors (read-only for mentors).
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own missions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from missions.models import Mission
    from missions.serializers import MissionSerializer
    from django.db.models import Q
    
    # Get query parameters for filtering
    track_key = request.query_params.get('track_key')
    track = request.query_params.get('track')
    difficulty = request.query_params.get('difficulty')
    tier = request.query_params.get('tier')
    mission_type = request.query_params.get('type')
    search = request.query_params.get('search')
    is_active = request.query_params.get('is_active', 'true')
    
    # Build queryset
    queryset = Mission.objects.all()
    
    if is_active.lower() == 'true':
        queryset = queryset.filter(is_active=True)
    
    if track_key:
        queryset = queryset.filter(track_key=track_key)
    
    if track:
        queryset = queryset.filter(track=track)
    
    if difficulty:
        queryset = queryset.filter(difficulty=difficulty)
    
    if tier:
        queryset = queryset.filter(tier=tier)
    
    if mission_type:
        queryset = queryset.filter(type=mission_type)
    
    if search:
        queryset = queryset.filter(
            Q(code__icontains=search) |
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Order by created_at
    queryset = queryset.order_by('-created_at')
    
    # Pagination
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    total_count = queryset.count()
    missions = queryset[offset:offset + limit]
    
    serializer = MissionSerializer(missions, many=True)
    
    return Response({
        'results': serializer.data,
        'count': total_count,
        'limit': limit,
        'offset': offset
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_submission_status(request, submission_id):
    """
    PATCH /api/v1/mentors/missions/submissions/{submission_id}/status
    Update mission submission status (reviewed, in_progress, scheduled).
    """
    from missions.models import MissionSubmission
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
    except MissionSubmission.DoesNotExist:
        return Response(
            {'error': 'Mission submission not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify mentor has access to this submission
    mentor = get_current_mentor(request.user)
    assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        status='active'
    ).exists()
    
    if not assignments:
        return Response(
            {'error': 'You do not have access to this submission'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update status
    new_status = request.data.get('status')
    valid_statuses = ['in_progress', 'in_mentor_review', 'scheduled', 'reviewed']
    
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    submission.status = new_status
    
    # Add notes if provided (store in mentor_feedback or create a JSON field)
    # For now, we'll append to mentor_feedback if notes are provided
    if 'notes' in request.data and request.data['notes']:
        if submission.mentor_feedback:
            submission.mentor_feedback += f"\n\n[Status Update - {timezone.now().strftime('%Y-%m-%d %H:%M')}]: {request.data['notes']}"
        else:
            submission.mentor_feedback = f"[Status Update - {timezone.now().strftime('%Y-%m-%d %H:%M')}]: {request.data['notes']}"
    
    submission.save()
    
    return Response({
        'id': str(submission.id),
        'status': submission.status,
        'updated_at': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_flags(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/flags
    Get all flags raised by a mentor.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own flags'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get query parameters
    status_filter = request.query_params.get('status', 'all')
    severity_filter = request.query_params.get('severity')
    
    # Build queryset
    queryset = MentorFlag.objects.filter(mentor=mentor)
    
    if status_filter == 'open':
        queryset = queryset.filter(resolved=False)
    elif status_filter == 'resolved':
        queryset = queryset.filter(resolved=True)
    
    if severity_filter:
        queryset = queryset.filter(severity=severity_filter)
    
    flags = queryset.order_by('-created_at')
    
    serializer = MentorFlagSerializer(flags, many=True)
    return Response(serializer.data)


# Note: Duplicate function removed - using the more comprehensive version at line 126
# which uses _mentor_can_view_mentee to check both direct assignments and cohort-based assignments


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_influence_index(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/influence
    Get mentor influence index metrics.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own influence index'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get date range
    from datetime import datetime
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get assignments
    assignments = MenteeMentorAssignment.objects.filter(mentor=mentor, status='active')
    mentee_ids = assignments.values_list('mentee_id', flat=True)
    
    # Calculate metrics (simplified - would integrate with actual TalentScope influence tracking)
    total_feedback = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        mentor_feedback__isnull=False
    ).exclude(mentor_feedback='').count()
    
    total_sessions = MentorSession.objects.filter(
        mentor=mentor,
        type='group'
    ).count()
    
    approved_missions = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        status='approved'
    ).count()
    
    total_reviewed = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        mentor_reviewed_at__isnull=False
    ).count()
    
    # Calculate period (default to last 30 days if not specified)
    from datetime import datetime, timedelta
    if start_date:
        try:
            period_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            period_start = timezone.now() - timedelta(days=30)
    else:
        period_start = timezone.now() - timedelta(days=30)
    
    if end_date:
        try:
            period_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            period_end = timezone.now()
    else:
        period_end = timezone.now()
    
    # Calculate overall influence score (simplified)
    avg_correlation = (
        0.75 + 0.68 + 0.82
    ) / 3  # Average of correlation coefficients
    improvement_factor = 75.0 / 100  # Normalize improvement rate
    overall_score = (avg_correlation * 0.5 + improvement_factor * 0.5) * 10  # Scale to 0-10
    
    return Response({
        'mentor_id': str(mentor.id),
        'overall_influence_score': round(overall_score, 1),
        'metrics': {
            'total_feedback_given': total_feedback,
            'average_response_time_hours': 24,  # Would calculate from actual data
            'mentee_improvement_rate': 75.0,  # Would calculate from TalentScope
            'session_attendance_rate': 85.0,  # Would calculate from session data
            'mission_approval_rate': (approved_missions / total_reviewed * 100) if total_reviewed > 0 else 0,
        },
        'correlation_data': {
            'feedback_to_performance': 0.75,  # Would calculate from TalentScope
            'sessions_to_engagement': 0.68,  # Would calculate from data
            'reviews_to_mission_quality': 0.82,  # Would calculate from data
        },
        'period': {
            'start_date': period_start.isoformat(),
            'end_date': period_end.isoformat(),
        },
        'trend_data': []  # Would come from historical data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentee_sessions(request):
    """
    GET /api/v1/mentorship/sessions?mentee_id={mentee_id}
    Get all sessions for a mentee (student).
    """
    try:
        mentee_id = request.query_params.get('mentee_id')
        
        if not mentee_id:
            return Response(
                {'error': 'mentee_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the mentee_id matches the authenticated user (students can only see their own sessions)
        if str(request.user.id) != str(mentee_id):
            # Check if user is a mentor (mentors can view their mentees' sessions)
            if not request.user.user_roles.filter(role__name='mentor', is_active=True).exists():
                return Response(
                    {'error': 'You can only view your own sessions'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get all sessions for this mentee
        from .models import MentorSession
        sessions = MentorSession.objects.filter(
            mentee_id=mentee_id,
            type='group'
        ).select_related('mentor', 'assignment').order_by('-start_time')
        
        sessions_data = []
        for session in sessions:
            outcomes = session.outcomes or {}
            structured_notes = session.structured_notes if session.structured_notes is not None else {}
            
            sessions_data.append({
                'id': str(session.id),
                'mentor_id': str(session.mentor.id) if session.mentor else None,
                'mentee_id': str(session.mentee.id) if session.mentee else mentee_id,
                'title': session.title,
                'description': outcomes.get('description', ''),
                'scheduled_at': session.start_time.isoformat(),
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat(),
                'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
                'meeting_link': session.zoom_url or '',
                'meeting_url': session.zoom_url or '',
                'meeting_type': outcomes.get('meeting_type', 'zoom'),
                'status': 'cancelled' if session.cancelled else ('completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'pending')),
                'topic': session.title,
                'notes': structured_notes,
                'summary': outcomes.get('description', ''),
            })
        
        return Response(sessions_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in mentee_sessions: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentor_assignments(request, mentor_id):
    """
    GET /api/v1/mentorship/mentors/{mentor_id}/assignments
    Get all active assignments for a mentor.
    This includes:
    1. Existing MenteeMentorAssignment records
    2. Auto-created assignments from cohort MentorAssignment records
    """
    try:
        # Verify the mentor_id matches the authenticated user
        if str(request.user.id) != str(mentor_id):
            return Response(
                {'error': 'You can only view your own assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from programs.models import MentorAssignment, Enrollment
        
        # Get all cohorts where this mentor is assigned
        mentor_assignments = MentorAssignment.objects.filter(
            mentor_id=mentor_id,
            active=True
        ).select_related('cohort')
        
        # Get existing MenteeMentorAssignment records
        existing_assignments = MenteeMentorAssignment.objects.filter(
            mentor_id=mentor_id,
            status='active'
        ).select_related('mentee')
        
        existing_mentee_ids = set(existing_assignments.values_list('mentee_id', flat=True))
        
        # For each cohort where mentor is assigned, create assignments for enrolled students
        created_count = 0
        for mentor_assignment in mentor_assignments:
            cohort = mentor_assignment.cohort
            
            # Get all active enrollments in this cohort
            enrollments = Enrollment.objects.filter(
                cohort=cohort,
                status__in=['active', 'completed']
            ).select_related('user')
            
            for enrollment in enrollments:
                mentee = enrollment.user
                
                # Skip if assignment already exists
                if mentee.id in existing_mentee_ids:
                    continue
                
                # Create MenteeMentorAssignment if it doesn't exist
                assignment, created = MenteeMentorAssignment.objects.get_or_create(
                    mentee=mentee,
                    mentor_id=mentor_id,
                    defaults={
                        'status': 'active',
                        'cohort_id': str(cohort.id),
                    }
                )
                
                if created:
                    created_count += 1
                    logger.info(f"Auto-created MenteeMentorAssignment {assignment.id} for mentor {mentor_id} and mentee {mentee.id} from cohort {cohort.id}")
                    existing_mentee_ids.add(mentee.id)
        
        # Now get all assignments (including newly created ones)
        all_assignments = MenteeMentorAssignment.objects.filter(
            mentor_id=mentor_id,
            status='active'
        ).select_related('mentee')
        
        assignments_data = []
        for assignment in all_assignments:
            mentee = assignment.mentee
            
            # Get last message time and unread count
            last_message = MentorshipMessage.objects.filter(
                assignment=assignment,
                archived=False
            ).order_by('-created_at').first()
            
            unread_count = MentorshipMessage.objects.filter(
                assignment=assignment,
                recipient_id=mentor_id,
                is_read=False,
                archived=False
            ).count()
            
            assignments_data.append({
                'id': str(assignment.id),
                'mentee_id': str(mentee.id),
                'mentee_name': mentee.get_full_name() if hasattr(mentee, 'get_full_name') else (mentee.email if mentee.email else str(mentee.id)),
                'mentee_email': mentee.email if hasattr(mentee, 'email') else '',
                'cohort_id': assignment.cohort_id,
                'assigned_at': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                'last_message_time': last_message.created_at.isoformat() if last_message else None,
                'unread_count': unread_count,
            })
        
        # Sort by last message time (most recent first), then by assigned_at
        assignments_data.sort(
            key=lambda x: (
                x['last_message_time'] if x['last_message_time'] else '1970-01-01T00:00:00',
                x['assigned_at'] if x['assigned_at'] else '1970-01-01T00:00:00'
            ),
            reverse=True
        )
        
        if created_count > 0:
            logger.info(f"Auto-created {created_count} MenteeMentorAssignment records for mentor {mentor_id}")
        
        return Response(assignments_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in get_mentor_assignments: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentorship_assignment(request):
    """
    GET /api/v1/mentorship/assignment
    Get the active mentorship assignment for the current user (mentee or mentor).
    Query params: mentee_id (for mentor) or mentor_id (for mentee)
    """
    try:
        user = request.user
        mentee_id = request.query_params.get('mentee_id')
        mentor_id = request.query_params.get('mentor_id')
        
        assignment = None
        
        if mentee_id and mentor_id:
            # Both provided - get specific assignment
            try:
                mentee_id_int = int(mentee_id)
                mentor_id_int = int(mentor_id)
                assignment = MenteeMentorAssignment.objects.filter(
                    mentee_id=mentee_id_int,
                    mentor_id=mentor_id_int,
                    status='active'
                ).first()
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid mentee_id or mentor_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif mentee_id:
            # Mentor viewing - get assignment for specific mentee
            try:
                mentee_id_int = int(mentee_id)
                assignment = MenteeMentorAssignment.objects.filter(
                    mentee_id=mentee_id_int,
                    mentor=user,
                    status='active'
                ).first()
                
                # If no assignment found, try to create one from cohort assignment
                if not assignment:
                    try:
                        from programs.models import Enrollment, MentorAssignment
                        # Get student's active enrollment
                        enrollment = Enrollment.objects.filter(
                            user_id=mentee_id_int,
                            status__in=['active', 'completed']
                        ).select_related('cohort').first()
                        
                        if enrollment:
                            # Verify the mentor is assigned to this cohort
                            mentor_assignment = MentorAssignment.objects.filter(
                                cohort=enrollment.cohort,
                                mentor=user,
                                active=True
                            ).first()
                            
                            if mentor_assignment:
                                # Create MenteeMentorAssignment
                                try:
                                    mentee_user = User.objects.get(id=mentee_id_int)
                                    assignment, created = MenteeMentorAssignment.objects.get_or_create(
                                        mentee=mentee_user,
                                        mentor=user,
                                        defaults={
                                            'status': 'active',
                                            'cohort_id': str(enrollment.cohort.id),
                                        }
                                    )
                                    if created:
                                        logger.info(f"Auto-created MenteeMentorAssignment for mentee {mentee_id_int} and mentor {user.id}")
                                except User.DoesNotExist:
                                    logger.warning(f"Mentee {mentee_id_int} not found when trying to auto-create assignment")
                    except Exception as e:
                        logger.warning(f"Failed to auto-create assignment from cohort for mentor {user.id} and mentee {mentee_id}: {str(e)}")
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid mentee_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif mentor_id:
            # Mentee viewing - get assignment for specific mentor
            try:
                mentor_id_int = int(mentor_id)
                assignment = MenteeMentorAssignment.objects.filter(
                    mentee=user,
                    mentor_id=mentor_id_int,
                    status='active'
                ).first()
                
                # If no assignment found, try to create one from cohort assignment
                if not assignment:
                    try:
                        from programs.models import Enrollment, MentorAssignment
                        # Get student's active enrollment
                        enrollment = Enrollment.objects.filter(
                            user=user,
                            status__in=['active', 'completed']
                        ).select_related('cohort').first()
                        
                        if enrollment:
                            # Verify the mentor is assigned to this cohort
                            mentor_assignment = MentorAssignment.objects.filter(
                                cohort=enrollment.cohort,
                                mentor_id=mentor_id_int,
                                active=True
                            ).first()
                            
                            if mentor_assignment:
                                # Create MenteeMentorAssignment
                                assignment, created = MenteeMentorAssignment.objects.get_or_create(
                                    mentee=user,
                                    mentor_id=mentor_id_int,
                                    defaults={
                                        'status': 'active',
                                        'cohort_id': str(enrollment.cohort.id),
                                    }
                                )
                                if created:
                                    logger.info(f"Auto-created MenteeMentorAssignment {assignment.id} for mentee {user.id} and mentor {mentor_id_int}")
                                else:
                                    # Ensure assignment is active
                                    if assignment.status != 'active':
                                        assignment.status = 'active'
                                        assignment.save(update_fields=['status'])
                                        logger.info(f"Reactivated MenteeMentorAssignment {assignment.id} for mentee {user.id}")
                    except Exception as e:
                        logger.warning(f"Failed to auto-create assignment from cohort: {str(e)}")
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid mentor_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # No params - get first active assignment for current user
            # First try to find existing assignment
            assignment = MenteeMentorAssignment.objects.filter(
                Q(mentee=user) | Q(mentor=user),
                status='active'
            ).first()
            
            # For mentees, always verify/update assignment matches current cohort mentor
            try:
                from programs.models import Enrollment, MentorAssignment
                # Get student's active enrollment
                enrollment = Enrollment.objects.filter(
                    user=user,
                    status__in=['active', 'completed']
                ).select_related('cohort').first()
                
                if enrollment:
                    # Get mentor assigned to this cohort (prefer primary, then support)
                    mentor_assignment = MentorAssignment.objects.filter(
                        cohort=enrollment.cohort,
                        active=True
                    ).select_related('mentor').order_by('-role').first()
                    
                    if mentor_assignment:
                        # Check if user is a mentee (student) in this assignment
                        is_mentee = assignment and assignment.mentee == user
                        
                        # If no assignment exists OR assignment exists but user is mentee and mentor doesn't match
                        if not assignment:
                            # Create new assignment for this mentee
                            assignment, created = MenteeMentorAssignment.objects.get_or_create(
                                mentee=user,
                                mentor=mentor_assignment.mentor,
                                defaults={
                                    'status': 'active',
                                    'cohort_id': str(enrollment.cohort.id),
                                }
                            )
                            if created:
                                logger.info(f"Auto-created MenteeMentorAssignment {assignment.id} for mentee {user.id} and mentor {mentor_assignment.mentor.id}")
                        elif is_mentee and assignment.mentor != mentor_assignment.mentor:
                            # Update existing assignment with correct mentor
                            logger.info(f"Updating MenteeMentorAssignment {assignment.id}: changing mentor from {assignment.mentor.id} ({assignment.mentor.get_full_name() or assignment.mentor.email}) to {mentor_assignment.mentor.id} ({mentor_assignment.mentor.get_full_name() or mentor_assignment.mentor.email})")
                            assignment.mentor = mentor_assignment.mentor
                            assignment.cohort_id = str(enrollment.cohort.id)
                            assignment.status = 'active'
                            assignment.save(update_fields=['mentor', 'cohort_id', 'status'])
                            logger.info(f"Updated MenteeMentorAssignment {assignment.id} with correct mentor")
                        elif assignment and assignment.status != 'active':
                            # Reactivate if assignment exists but is inactive
                            assignment.status = 'active'
                            assignment.save(update_fields=['status'])
                            logger.info(f"Reactivated MenteeMentorAssignment {assignment.id} for mentee {user.id}")
            except Exception as e:
                logger.warning(f"Failed to verify/update assignment from cohort: {str(e)}", exc_info=True)
        
        if not assignment:
            return Response(
                {'error': 'No active mentorship assignment found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'id': str(assignment.id),
            'mentee_id': str(assignment.mentee.id),
            'mentee_name': assignment.mentee.get_full_name() or assignment.mentee.email,
            'mentor_id': str(assignment.mentor.id),
            'mentor_name': assignment.mentor.get_full_name() or assignment.mentor.email,
            'status': assignment.status,
            'assigned_at': assignment.assigned_at.isoformat(),
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error fetching mentorship assignment: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_mentor(request, mentee_id):
    """
    GET /api/v1/mentorship/mentees/{mentee_id}/mentor
    Get the mentor assigned to a student.
    First checks for existing MenteeMentorAssignment (created via messaging or direct assignment),
    then falls back to cohort-level MentorAssignment.
    """
    try:
        # Verify the mentee_id matches the authenticated user (students can only see their own mentor)
        mentee_id_int = int(mentee_id)
        user_id_int = int(request.user.id)

        if user_id_int != mentee_id_int:
            return Response(
                {'error': 'You can only view your own mentor assignment'},
                status=status.HTTP_403_FORBIDDEN
            )

        mentor = None
        cohort = None
        mentor_assignment = None
        mentor_assignment_obj = None  # To store MentorAssignment or MenteeMentorAssignment for assigned_at, role, type
        assignment = None

        # FIRST: Check for existing MenteeMentorAssignment (created when messages are sent or direct assignment)
        assignment = MenteeMentorAssignment.objects.filter(
            mentee_id=mentee_id_int,
            status='active'
        ).select_related('mentor').first()

        if assignment:
            # Found an active assignment - use it
            mentor = assignment.mentor
            logger.info(f"Found active MenteeMentorAssignment {assignment.id} for mentee {mentee_id_int} with mentor {mentor.id}")
            
            # Set mentor_assignment_obj for response
            mentor_assignment_obj = assignment
            
            # Try to get cohort info for additional context
            try:
                from programs.models import Enrollment
                enrollment = Enrollment.objects.filter(
                    user_id=mentee_id_int,
                    status__in=['active', 'completed']
                ).select_related('cohort').first()
                if enrollment:
                    cohort = enrollment.cohort
            except Exception as e:
                logger.warning(f"Could not fetch cohort info for mentee {mentee_id_int}: {str(e)}")
        else:
            # SECOND: Fallback to cohort-level MentorAssignment
            logger.info(f"No active MenteeMentorAssignment found for mentee {mentee_id_int}, checking cohort assignment")
            try:
                from programs.models import Enrollment, MentorAssignment, Cohort
                enrollment = Enrollment.objects.filter(
                    user_id=mentee_id_int,
                    status__in=['active', 'completed']  # Include completed students who might still have mentor access
                ).select_related('cohort__track').first()

                if enrollment:
                    cohort = enrollment.cohort

                    # Get the mentor assigned to this cohort (prefer primary mentors, fallback to any active mentor)
                    mentor_assignment = MentorAssignment.objects.filter(
                        cohort=cohort,
                        active=True
                    ).select_related('mentor').order_by('-role').first()  # Primary mentors first

                    if mentor_assignment:
                        mentor = mentor_assignment.mentor
                        logger.info(f"Found cohort-level MentorAssignment for mentee {mentee_id_int} with mentor {mentor.id}")
                        
                        # Create MenteeMentorAssignment if it doesn't exist
                        assignment, created = MenteeMentorAssignment.objects.get_or_create(
                            mentee_id=mentee_id_int,
                            mentor=mentor,
                            defaults={
                                'status': 'active',
                                'cohort_id': str(cohort.id),
                            }
                        )
                        
                        if created:
                            logger.info(f"Auto-created MenteeMentorAssignment {assignment.id} for mentee {mentee_id_int} and mentor {mentor.id} from cohort {cohort.id}")
                        else:
                            # Ensure assignment is active
                            if assignment.status != 'active':
                                assignment.status = 'active'
                                assignment.save(update_fields=['status'])
                                logger.info(f"Reactivated MenteeMentorAssignment {assignment.id} for mentee {mentee_id_int}")
                        
                        # Set mentor_assignment_obj for response
                        mentor_assignment_obj = mentor_assignment
                    else:
                        logger.warning(f"No mentor assigned to cohort {cohort.id} for mentee {mentee_id_int}")
                else:
                    logger.warning(f"No active enrollment found for mentee {mentee_id_int}")
            except Exception as cohort_error:
                logger.warning(f"Cohort-based mentor lookup failed for mentee {mentee_id_int}: {cohort_error}")

        # If still no mentor found, return error
        if not mentor:
            return Response(
                {'error': 'No mentor assigned. Please contact your program director.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get mentor's profile information and expertise
        mentor_profile = {
            'id': str(mentor.id),
            'name': mentor.get_full_name() or mentor.email,
            'avatar': getattr(mentor, 'avatar_url', None) or getattr(mentor, 'profile_picture', None),
            'expertise': [],  # Would come from mentor profile/skills
            'track': getattr(mentor, 'track_key', None) or 'Mentor',  # Use mentor's track if available
            'bio': getattr(mentor, 'bio', None) or getattr(mentor, 'biography', None) or '',
            'timezone': getattr(mentor, 'timezone', None) or 'Africa/Nairobi',
            'readiness_impact': 85.0,  # Would be calculated based on mentee outcomes
            'cohort_id': str(cohort.id) if cohort else None,
            'cohort_name': cohort.name if cohort else None,
            'assigned_at': mentor_assignment_obj.assigned_at.isoformat() if mentor_assignment_obj and hasattr(mentor_assignment_obj, 'assigned_at') else (assignment.assigned_at.isoformat() if assignment else None),
            'mentor_role': mentor_assignment_obj.role if mentor_assignment_obj and hasattr(mentor_assignment_obj, 'role') else 'assigned',
            'assignment_type': 'cohort_based' if mentor_assignment_obj else 'individual',
        }

        return Response(mentor_profile, status=status.HTTP_200_OK)

    except (ValueError, AttributeError) as e:
        logger.error(f"Invalid request parameters for get_student_mentor: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Invalid request parameters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error fetching mentor for mentee {mentee_id}: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# DUPLICATE FUNCTION DELETED - Using the first update_group_session function at line 467 instead


# ============================================================================
# 4.8 Communication & Notifications
# ============================================================================

def get_or_create_assignment(mentee, mentor, cohort_id=None):
    """
    Helper function to get or create a MenteeMentorAssignment.
    Always returns the SAME assignment for a given mentee+mentor pair.
    Reactivates inactive assignments instead of creating duplicates.
    """
    # First, try to find ANY assignment (including inactive ones)
    assignment = MenteeMentorAssignment.objects.filter(
        mentee=mentee,
        mentor=mentor
    ).first()
    
    if assignment:
        # Found existing assignment - reactivate if needed
        if assignment.status != 'active':
            assignment.status = 'active'
            if cohort_id:
                assignment.cohort_id = str(cohort_id)
            assignment.save(update_fields=['status', 'cohort_id'])
            logger.info(f"♻️ Reactivated MenteeMentorAssignment {assignment.id} for mentee {mentee.id} and mentor {mentor.id}")
        return assignment, False
    else:
        # No assignment exists - create new one
        assignment = MenteeMentorAssignment.objects.create(
            mentee=mentee,
            mentor=mentor,
            status='active',
            cohort_id=str(cohort_id) if cohort_id else None
        )
        logger.info(f"🆕 Created new MenteeMentorAssignment {assignment.id} for mentee {mentee.id} and mentor {mentor.id}")
        return assignment, True

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def messages_endpoint(request, assignment_id):
    """
    GET /api/v1/mentorship/assignments/{assignment_id}/messages
    Get all messages for a mentor-mentee assignment.
    
    POST /api/v1/mentorship/assignments/{assignment_id}/messages
    Send a message with optional file attachments.
    If assignment doesn't exist, auto-create it from cohort assignment.
    This works for both students sending first message AND mentors sending first message.
    
    IMPORTANT: If assignment_id doesn't exist, we find/create the correct assignment
    based on mentee+mentor pair to ensure both parties use the same assignment.
    """
    try:
        assignment = None
        assignment_was_auto_created = False
        
        try:
            assignment = MenteeMentorAssignment.objects.get(id=assignment_id)
            logger.info(f"✅ Found existing assignment {assignment_id} for user {request.user.id}")
        except MenteeMentorAssignment.DoesNotExist:
            # Assignment doesn't exist - try to find or create it
            # This can happen when:
            # 1. A student sends their first message
            # 2. A mentor sends their first message to a student
            logger.info(f"Assignment {assignment_id} not found. Attempting to find or create assignment from cohort.")
            
            from programs.models import Enrollment, MentorAssignment
            
            assignment = None
            
            # Case 1: User is a mentee (student) - find their enrollment and mentor
            enrollment = Enrollment.objects.filter(
                user=request.user,
                status__in=['active', 'completed']
            ).select_related('cohort').first()
            
            if enrollment:
                # Find mentor assigned to this cohort
                mentor_assignment = MentorAssignment.objects.filter(
                    cohort=enrollment.cohort,
                    active=True
                ).select_related('mentor').order_by('-role').first()
                
                if mentor_assignment:
                    # CRITICAL: Use helper function to ensure we always get the SAME assignment
                    assignment, created = get_or_create_assignment(
                        mentee=request.user,
                        mentor=mentor_assignment.mentor,
                        cohort_id=enrollment.cohort.id
                    )
                    if created:
                        assignment_was_auto_created = True
                    logger.info(f"✅ Using MenteeMentorAssignment {assignment.id} for mentee {request.user.id} and mentor {mentor_assignment.mentor.id}")
            
            # Case 2: User is a mentor - find mentee from their assigned cohorts
            if not assignment and request.user.user_roles.filter(role__name='mentor', is_active=True).exists():
                # Get mentee_id from request body (when sending message) or query params
                # Frontend sends 'recipient_id' in FormData (snake_case)
                mentee_id = None
                if request.method == 'POST':
                    # Check multiple possible field names (FormData uses string keys)
                    # request.data is a QueryDict for FormData, so we use .get()
                    mentee_id = (
                        request.data.get('mentee_id') or 
                        request.data.get('recipient_id') or 
                        request.data.get('recipientId') or
                        request.data.get('menteeId')
                    )
                    # Convert to string if it's not already
                    if mentee_id:
                        mentee_id = str(mentee_id)
                if not mentee_id:
                    mentee_id = request.query_params.get('mentee_id') or request.query_params.get('menteeId')
                    if mentee_id:
                        mentee_id = str(mentee_id)
                
                if mentee_id:
                    try:
                        from users.models import User
                        mentee = User.objects.get(id=mentee_id)
                        
                        # Verify this mentee is in a cohort where the mentor is assigned
                        mentee_enrollment = Enrollment.objects.filter(
                            user=mentee,
                            status__in=['active', 'completed']
                        ).select_related('cohort').first()
                        
                        if mentee_enrollment:
                            # Check if mentor is assigned to this cohort
                            mentor_assignment = MentorAssignment.objects.filter(
                                mentor=request.user,
                                cohort=mentee_enrollment.cohort,
                                active=True
                            ).first()
                            
                            if mentor_assignment:
                                # CRITICAL: Use helper function to ensure we always get the SAME assignment
                                assignment, created = get_or_create_assignment(
                                    mentee=mentee,
                                    mentor=request.user,
                                    cohort_id=mentee_enrollment.cohort.id
                                )
                                if created:
                                    assignment_was_auto_created = True
                                logger.info(f"✅ Using MenteeMentorAssignment {assignment.id} for mentor {request.user.id} and mentee {mentee.id}")
                    except User.DoesNotExist:
                        logger.warning(f"Mentee {mentee_id} not found when mentor {request.user.id} tried to send message")
                    except Exception as e:
                        logger.error(f"Error creating assignment for mentor {request.user.id} and mentee {mentee_id}: {str(e)}", exc_info=True)
                
                # If still no assignment, try to find any mentee in mentor's cohorts
                # This is a fallback - we'll create assignment with first matching mentee
                if not assignment:
                    mentor_assignments = MentorAssignment.objects.filter(
                        mentor=request.user,
                        active=True
                    ).select_related('cohort')
                    
                    for mentor_assignment in mentor_assignments:
                        # Get first active enrollment in this cohort
                        enrollment = Enrollment.objects.filter(
                            cohort=mentor_assignment.cohort,
                            status__in=['active', 'completed']
                        ).select_related('user').first()
                        
                        if enrollment:
                            # CRITICAL: Use helper function to ensure we always get the SAME assignment
                            assignment, created = get_or_create_assignment(
                                mentee=enrollment.user,
                                mentor=request.user,
                                cohort_id=mentor_assignment.cohort.id
                            )
                            if created:
                                assignment_was_auto_created = True
                            logger.info(f"✅ Using MenteeMentorAssignment {assignment.id} for mentor {request.user.id} and mentee {enrollment.user.id} (fallback)")
                            break
            
            if not assignment:
                return Response(
                    {'error': 'Assignment not found and cannot be auto-created. Please ensure you are assigned to a cohort with active students.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # If assignment was auto-created or found, log it
            if assignment_was_auto_created or str(assignment.id) != str(assignment_id):
                logger.warning(f"⚠️ Assignment ID mismatch! Requested: {assignment_id}, Using: {assignment.id} (user: {request.user.id}, mentee: {assignment.mentee.id}, mentor: {assignment.mentor.id})")
                logger.info(f"💡 This means the frontend is using the wrong assignment_id. The correct assignment_id is: {assignment.id}")
            else:
                logger.info(f"✅ Using assignment {assignment.id} (user: {request.user.id}, mentee: {assignment.mentee.id}, mentor: {assignment.mentor.id})")
        
        # Verify user is either mentor or mentee in this assignment
        if request.user.id not in [assignment.mentor.id, assignment.mentee.id]:
            logger.error(f"User {request.user.id} tried to access assignment {assignment.id} but is neither mentor ({assignment.mentor.id}) nor mentee ({assignment.mentee.id})")
            return Response(
                {'error': 'You can only access messages for your own assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log assignment details for debugging
        logger.info(f"Processing {request.method} request for assignment {assignment.id} (user: {request.user.id}, mentee: {assignment.mentee.id}, mentor: {assignment.mentor.id})")
        
        if request.method == 'GET':
            # Get messages (exclude archived unless explicitly requested)
            include_archived = request.query_params.get('include_archived', 'false').lower() == 'true'
            messages = MentorshipMessage.objects.filter(assignment=assignment)
            
            if not include_archived:
                messages = messages.filter(archived=False)
            
            messages = messages.select_related('sender', 'recipient').prefetch_related('attachments').order_by('created_at')
            
            message_count = messages.count()
            logger.info(f"📨 Returning {message_count} messages for assignment {assignment.id} (user: {request.user.id}, mentee: {assignment.mentee.id}, mentor: {assignment.mentor.id})")
            
            # Log all messages for debugging
            if message_count > 0:
                all_messages = list(messages)
                logger.info(f"All messages: {[{'id': str(m.id), 'sender_id': str(m.sender.id), 'sender_email': m.sender.email, 'recipient_id': str(m.recipient.id), 'recipient_email': m.recipient.email, 'body_preview': m.body[:50] if m.body else '', 'created_at': str(m.created_at)} for m in all_messages]}")
            else:
                logger.warning(f"⚠️ No messages found for assignment {assignment.id} (user: {request.user.id})")
            
            serializer = MentorshipMessageSerializer(messages, many=True, context={'request': request})
            serialized_data = serializer.data
            
            # Log serialized data for debugging
            logger.info(f"Serialized {len(serialized_data)} messages. First message: {serialized_data[0] if serialized_data else 'None'}")
            
            # Add assignment_id to response headers in case it was auto-created or different
            response = Response(serialized_data, status=status.HTTP_200_OK)
            response['X-Assignment-Id'] = str(assignment.id)
            # Also include in response body for easier access
            if assignment_was_auto_created or str(assignment.id) != str(assignment_id):
                # Wrap in object with assignment_id if it changed
                response_data = {
                    'messages': serialized_data,
                    'assignment_id': str(assignment.id),
                    'assignment_id_changed': str(assignment.id) != str(assignment_id)
                }
                response = Response(response_data, status=status.HTTP_200_OK)
                response['X-Assignment-Id'] = str(assignment.id)
            logger.info(f"📨 Returning {len(serialized_data)} messages with assignment_id {assignment.id} (requested: {assignment_id})")
            return response
        
        elif request.method == 'POST':
            # Determine recipient (opposite of sender)
            if request.user.id == assignment.mentor.id:
                recipient = assignment.mentee
            else:
                recipient = assignment.mentor
            
            # Parse message data
            subject = request.data.get('subject', '').strip()
            body = request.data.get('body', '').strip()
            files = request.FILES.getlist('attachments', [])
            
            if not body:
                return Response(
                    {'error': 'Message body is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file sizes (10MB max per file)
            max_file_size = 10 * 1024 * 1024  # 10MB
            for file in files:
                if file.size > max_file_size:
                    return Response(
                        {'error': f'File {file.name} exceeds 10MB limit'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create message with message_id
            message = MentorshipMessage.objects.create(
                assignment=assignment,
                sender=request.user,
                recipient=recipient,
                subject=subject,
                body=body,
                message_id=str(uuid.uuid4())  # Generate unique message_id
            )
            
            logger.info(f"✅ Created message {message.id} from {request.user.id} ({request.user.email}) to {recipient.id} ({recipient.email}) in assignment {assignment.id}")
            logger.info(f"Message details: body_length={len(body)}, subject={subject}, files_count={len(files)}, message_id={message.message_id}")
            logger.info(f"Assignment details: mentee={assignment.mentee.id}, mentor={assignment.mentor.id}, status={assignment.status}")
            
            # Handle file attachments
            for file in files:
                MessageAttachment.objects.create(
                    message=message,
                    file=file,
                    filename=file.name,
                    file_size=file.size,
                    content_type=file.content_type or 'application/octet-stream'
                )
            
            # Reload message with all related objects for serialization
            message = MentorshipMessage.objects.select_related('sender', 'recipient', 'assignment').prefetch_related('attachments').get(id=message.id)
            serializer = MentorshipMessageSerializer(message, context={'request': request})
            response_data = serializer.data
            # Include assignment_id in response in case it was auto-created or different
            response_data['assignment_id'] = str(assignment.id)
            if assignment_was_auto_created or str(assignment.id) != str(assignment_id):
                response_data['assignment_id_changed'] = True
                logger.warning(f"⚠️ Assignment ID changed from {assignment_id} to {assignment.id} - frontend should update!")
            logger.info(f"✅ Returning serialized message {message.id} with assignment {message.assignment.id}, sender {message.sender.id}, recipient {message.recipient.id}")
            logger.info(f"📝 Response includes assignment_id: {response_data['assignment_id']}")
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    except MenteeMentorAssignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error in messages endpoint: {str(e)}\n{error_trace}", exc_info=True)
        # Return more detailed error in development
        error_message = str(e)
        return Response(
            {'error': f'Internal server error: {error_message}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_message_read(request, message_id):
    """
    PATCH /api/v1/mentorship/messages/{message_id}/read
    Mark a message as read.
    """
    try:
        message = MentorshipMessage.objects.get(id=message_id)
        
        # Verify user is the recipient
        if request.user.id != message.recipient.id:
            return Response(
                {'error': 'You can only mark your own messages as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not message.is_read:
            message.is_read = True
            message.read_at = timezone.now()
            message.save(update_fields=['is_read', 'read_at'])
        
        serializer = MentorshipMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except MentorshipMessage.DoesNotExist:
        return Response(
            {'error': 'Message not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error marking message as read: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def archive_messages(request, assignment_id):
    """
    POST /api/v1/mentorship/assignments/{assignment_id}/messages/archive
    Archive all messages for an assignment (auto-called when mentorship closes).
    """
    try:
        assignment = MenteeMentorAssignment.objects.get(id=assignment_id)
        
        # Verify user is either mentor or mentee in this assignment
        if request.user.id not in [assignment.mentor.id, assignment.mentee.id]:
            return Response(
                {'error': 'You can only archive messages for your own assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Archive all messages
        archived_count = MentorshipMessage.objects.filter(
            assignment=assignment,
            archived=False
        ).update(
            archived=True,
            archived_at=timezone.now()
        )
        
        return Response(
            {'message': f'{archived_count} messages archived successfully'},
            status=status.HTTP_200_OK
        )
    
    except MenteeMentorAssignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error archiving messages: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    """
    POST /api/v1/mentorship/notifications
    Send a notification (Email/SMS) for sessions, feedback, milestones, etc.
    """
    try:
        serializer = CreateNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Get recipient
        try:
            recipient = User.objects.get(id=data['recipient_id'])
        except User.DoesNotExist:
            return Response(
                {'error': 'Recipient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get assignment and session if provided
        assignment = None
        session = None
        if data.get('assignment_id'):
            try:
                assignment = MenteeMentorAssignment.objects.get(id=data['assignment_id'])
            except MenteeMentorAssignment.DoesNotExist:
                pass
        
        if data.get('session_id'):
            try:
                session = MentorSession.objects.get(id=data['session_id'])
            except MentorSession.DoesNotExist:
                pass
        
        # Create notification log
        notification = NotificationLog.objects.create(
            assignment=assignment,
            session=session,
            recipient=recipient,
            notification_type=data['notification_type'],
            channel=data['channel'],
            subject=data.get('subject', ''),
            message=data['message'],
            metadata=data.get('metadata', {}),
            status='pending'
        )
        
        # TODO: Integrate with actual notification service (Email/SMS provider)
        # For now, we'll mark it as sent immediately
        # In production, this would call an external notification service
        try:
            # Simulate sending notification
            # In production: call notification service API here
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save(update_fields=['status', 'sent_at'])
            
            logger.info(f"Notification {notification.notification_id} sent to {recipient.email} via {data['channel']}")
        except Exception as e:
            notification.status = 'failed'
            notification.error_message = str(e)
            notification.save(update_fields=['status', 'error_message'])
            logger.error(f"Failed to send notification {notification.notification_id}: {str(e)}")
        
        serializer_response = NotificationLogSerializer(notification)
        return Response(serializer_response.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request, user_id):
    """
    GET /api/v1/mentorship/users/{user_id}/notifications
    Get notification logs for a user.
    """
    try:
        # Verify user can only view their own notifications
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'You can only view your own notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get notifications
        notifications = NotificationLog.objects.filter(recipient_id=user_id).select_related(
            'assignment', 'session', 'recipient'
        ).order_by('-created_at')
        
        # Filter by type if provided
        notification_type = request.query_params.get('type')
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type)
        
        # Filter by channel if provided
        channel = request.query_params.get('channel')
        if channel:
            notifications = notifications.filter(channel=channel)
        
        # Filter by status if provided
        notification_status = request.query_params.get('status')
        if notification_status:
            notifications = notifications.filter(status=notification_status)
        
        serializer = NotificationLogSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def send_session_reminder(session, reminder_minutes=60):
    """
    Helper function to send session reminder notifications.
    Called automatically when sessions are created or updated.
    """
    try:
        # Calculate reminder time
        reminder_time = session.start_time - timedelta(minutes=reminder_minutes)
        
        # Send reminder to mentee
        NotificationLog.objects.create(
            assignment=session.assignment,
            session=session,
            recipient=session.mentee,
            notification_type='session_reminder',
            channel='email',
            subject=f'Reminder: {session.title} in {reminder_minutes} minutes',
            message=f"Your mentorship session '{session.title}' is scheduled to start in {reminder_minutes} minutes.\n\n"
                   f"Time: {session.start_time.strftime('%Y-%m-%d %H:%M')}\n"
                   f"Meeting Link: {session.zoom_url or 'TBD'}",
            metadata={'reminder_minutes': reminder_minutes},
            status='pending'
        )
        
        # Send reminder to mentor
        NotificationLog.objects.create(
            assignment=session.assignment,
            session=session,
            recipient=session.mentor,
            notification_type='session_reminder',
            channel='email',
            subject=f'Reminder: {session.title} in {reminder_minutes} minutes',
            message=f"Your mentorship session '{session.title}' is scheduled to start in {reminder_minutes} minutes.\n\n"
                   f"Time: {session.start_time.strftime('%Y-%m-%d %H:%M')}\n"
                   f"Meeting Link: {session.zoom_url or 'TBD'}",
            metadata={'reminder_minutes': reminder_minutes},
            status='pending'
        )
        
        logger.info(f"Session reminders created for session {session.id}")
    except Exception as e:
        logger.error(f"Error creating session reminders: {str(e)}", exc_info=True)


def send_feedback_reminder(session):
    """
    Helper function to send feedback reminder notifications.
    Called after session ends if feedback hasn't been submitted.
    """
    try:
        # Check if feedback already submitted
        feedback_exists = SessionFeedback.objects.filter(
            session=session,
            mentee=session.mentee
        ).exists()
        
        if feedback_exists:
            return  # Feedback already submitted
        
        # Send reminder to mentee
        NotificationLog.objects.create(
            assignment=session.assignment,
            session=session,
            recipient=session.mentee,
            notification_type='feedback_reminder',
            channel='email',
            subject=f'Feedback Request: {session.title}',
            message=f"Please provide feedback for your mentorship session '{session.title}'.\n\n"
                   f"Your feedback helps improve the mentorship experience.",
            status='pending'
        )
        
        logger.info(f"Feedback reminder created for session {session.id}")
    except Exception as e:
        logger.error(f"Error creating feedback reminder: {str(e)}", exc_info=True)
