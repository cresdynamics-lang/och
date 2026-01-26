"""
API views for Profiler Engine.
Comprehensive profiling system with aptitude and behavioral assessments.
"""
import os
import requests
import uuid
import logging
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ProfilerSession, ProfilerAnswer, ProfilerQuestion, ProfilerResult
from .serializers import (
    ProfilerSessionSerializer,
    StartProfilerSerializer,
    SubmitAnswersSerializer,
    FutureYouRequestSerializer,
    ProfilerStatusSerializer,
)
from .session_manager import session_manager
from student_dashboard.services import DashboardAggregationService

logger = logging.getLogger(__name__)


def safe_uuid_conversion(value):
    """Safely convert a value to UUID object."""
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return value
    
    # If it's already a UUID object (from Django's UUIDField), return as-is
    if hasattr(value, '__class__') and value.__class__.__name__ == 'UUID':
        return value
    
    try:
        # Handle string UUIDs
        if isinstance(value, str):
            # Remove any whitespace and convert to lowercase
            value = value.strip().lower()
            # Remove 'urn:uuid:' prefix if present
            if value.startswith('urn:uuid:'):
                value = value[9:]
            # Check if it's a valid UUID format (with dashes)
            if len(value) == 36 and value.count('-') == 4:
                # Validate format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                parts = value.split('-')
                if len(parts) == 5 and all(len(p) in [8, 4, 4, 4, 12] for p in parts):
                    return uuid.UUID(value)
            # Try parsing as hex string without dashes (32 chars)
            elif len(value) == 32:
                # Insert dashes: 8-4-4-4-12
                formatted = f"{value[:8]}-{value[8:12]}-{value[12:16]}-{value[16:20]}-{value[20:32]}"
                return uuid.UUID(formatted)
            else:
                return None
        
        # For other types, try converting to string first
        str_value = str(value).strip().lower()
        if str_value == 'none' or str_value == '':
            return None
        
        # Try standard UUID parsing
        return uuid.UUID(str_value)
    except (ValueError, TypeError, AttributeError) as e:
        # Log the error for debugging but don't raise
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to convert value to UUID: {value} (type: {type(value)}), error: {e}")
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_tier0_completion(request):
    """
    GET /api/v1/profiler/tier0-status
    Check if Tier 0 (profiler + foundations) is fully complete.
    """
    user = request.user
    
    profiler_complete = user.profiling_complete
    foundations_complete = user.foundations_complete
    tier0_complete = profiler_complete and foundations_complete
    
    return Response({
        'tier0_complete': tier0_complete,
        'profiler_complete': profiler_complete,
        'profiler_completed_at': user.profiling_completed_at.isoformat() if user.profiling_completed_at else None,
        'foundations_complete': foundations_complete,
        'foundations_completed_at': user.foundations_completed_at.isoformat() if user.foundations_completed_at else None,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_profiling_required(request):
    """
    GET /api/v1/profiler/check-required
    Check if user needs to complete profiling (mandatory Tier 0 gateway).
    """
    user = request.user
    
    # Check if user has completed profiling
    if user.profiling_complete:
        return Response({
            'required': False,
            'completed': True,
            'completed_at': user.profiling_completed_at.isoformat() if user.profiling_completed_at else None,
        }, status=status.HTTP_200_OK)
    
    # Check for active session
    active_session = ProfilerSession.objects.filter(
        user=user,
        is_locked=False,
        status__in=['started', 'in_progress', 'aptitude_complete', 'behavioral_complete']
    ).first()
    
    if active_session:
        return Response({
            'required': True,
            'completed': False,
            'has_active_session': True,
            'session_id': str(active_session.id),
            'session_token': active_session.session_token,
            'current_section': active_session.current_section,
        }, status=status.HTTP_200_OK)
    
    return Response({
        'required': True,
        'completed': False,
        'has_active_session': False,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_profiler(request):
    """
    POST /api/v1/profiler/start
    Initialize profiler session (mandatory Tier 0 gateway).
    Auto-triggered on first login.
    """
    user = request.user
    
    # Check if already completed and locked
    if user.profiling_complete:
        completed_session = ProfilerSession.objects.filter(
            user=user,
            is_locked=True
        ).order_by('-completed_at').first()
        
        if completed_session:
            return Response({
                'error': 'Profiling already completed. Contact admin to reset.',
                'completed': True,
                'session_id': str(completed_session.id),
            }, status=status.HTTP_403_FORBIDDEN)
    
    # Check for existing active session
    active_session = ProfilerSession.objects.filter(
        user=user,
        is_locked=False,
        status__in=['started', 'in_progress', 'aptitude_complete', 'behavioral_complete']
    ).first()
    
    if active_session:
        # Resume existing session
        if not active_session.session_token:
            session_token = session_manager.generate_session_token()
            active_session.session_token = session_token
            active_session.save()
        else:
            session_token = active_session.session_token
        
        # Get questions
        aptitude_questions = ProfilerQuestion.objects.filter(
            question_type='aptitude',
            is_active=True
        ).order_by('question_order')
        
        behavioral_questions = ProfilerQuestion.objects.filter(
            question_type='behavioral',
            is_active=True
        ).order_by('question_order')
        
        return Response({
            'session_id': str(active_session.id),
            'session_token': session_token,
            'status': active_session.status,
            'current_section': active_session.current_section,
            'current_question_index': active_session.current_question_index,
            'total_questions': active_session.total_questions,
            'aptitude_questions': [
                {
                    'id': str(q.id),
                    'question_text': q.question_text,
                    'answer_type': q.answer_type,
                    'options': q.options,
                    'category': q.category,
                }
                for q in aptitude_questions
            ],
            'behavioral_questions': [
                {
                    'id': str(q.id),
                    'question_text': q.question_text,
                    'answer_type': q.answer_type,
                    'options': q.options,
                    'category': q.category,
                }
                for q in behavioral_questions
            ],
        }, status=status.HTTP_200_OK)
    
    # Create new session
    session_token = session_manager.generate_session_token()
    
    # Get total questions count
    aptitude_count = ProfilerQuestion.objects.filter(question_type='aptitude', is_active=True).count()
    behavioral_count = ProfilerQuestion.objects.filter(question_type='behavioral', is_active=True).count()
    total_questions = aptitude_count + behavioral_count
    
    session = ProfilerSession.objects.create(
        user=user,
        status='started',
        session_token=session_token,
        current_section='welcome',
        total_questions=total_questions,
    )
    
    # Initialize Redis session
    session_manager.save_session(session_token, {
        'session_id': str(session.id),
        'user_id': user.id,
        'status': 'started',
        'current_section': 'welcome',
        'responses': {},
        'started_at': timezone.now().isoformat(),
    })
    
    # Get questions
    aptitude_questions = ProfilerQuestion.objects.filter(
        question_type='aptitude',
        is_active=True
    ).order_by('question_order')
    
    behavioral_questions = ProfilerQuestion.objects.filter(
        question_type='behavioral',
        is_active=True
    ).order_by('question_order')
    
    return Response({
        'session_id': str(session.id),
        'session_token': session_token,
        'status': 'started',
        'current_section': 'welcome',
        'total_questions': total_questions,
        'aptitude_questions': [
            {
                'id': str(q.id),
                'question_text': q.question_text,
                'answer_type': q.answer_type,
                'options': q.options,
                'category': q.category,
            }
            for q in aptitude_questions
        ],
        'behavioral_questions': [
            {
                'id': str(q.id),
                'question_text': q.question_text,
                'answer_type': q.answer_type,
                'options': q.options,
                'category': q.category,
            }
            for q in behavioral_questions
        ],
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def autosave_response(request):
    """
    POST /api/v1/profiler/autosave
    Autosave a single response (called every 10 seconds).
    """
    session_token = request.data.get('session_token')
    question_id = request.data.get('question_id')
    answer = request.data.get('answer')
    
    if not session_token or not question_id:
        return Response(
            {'error': 'session_token and question_id required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify session belongs to user
    try:
        session = ProfilerSession.objects.get(
            session_token=session_token,
            user=request.user
        )
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Autosave to Redis
    success = session_manager.autosave_response(session_token, question_id, answer)
    
    if success:
        return Response({
            'status': 'autosaved',
            'question_id': question_id,
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {'error': 'Failed to autosave'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_section_progress(request):
    """
    POST /api/v1/profiler/update-progress
    Update current section and question index.
    """
    session_token = request.data.get('session_token')
    current_section = request.data.get('current_section')
    current_question_index = request.data.get('current_question_index', 0)
    
    if not session_token:
        return Response(
            {'error': 'session_token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        session = ProfilerSession.objects.get(
            session_token=session_token,
            user=request.user
        )
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    session.current_section = current_section
    session.current_question_index = current_question_index
    session.status = 'in_progress'
    session.save()
    
    # Update Redis session
    session_manager.update_session(session_token, {
        'current_section': current_section,
        'current_question_index': current_question_index,
        'last_activity': timezone.now().isoformat(),
    })
    
    return Response({
        'status': 'updated',
        'current_section': current_section,
        'current_question_index': current_question_index,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_section(request):
    """
    POST /api/v1/profiler/complete-section
    Mark a section (aptitude or behavioral) as complete.
    """
    session_token = request.data.get('session_token')
    section = request.data.get('section')  # 'aptitude' or 'behavioral'
    responses = request.data.get('responses', {})
    
    if not session_token or not section:
        return Response(
            {'error': 'session_token and section required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        session = ProfilerSession.objects.get(
            session_token=session_token,
            user=request.user
        )
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Save responses to database
    with transaction.atomic():
        for question_id, answer_data in responses.items():
            try:
                question = ProfilerQuestion.objects.get(id=question_id)
            except ProfilerQuestion.DoesNotExist:
                continue
            
            # Check if correct (for aptitude questions)
            is_correct = None
            points_earned = 0
            if question.question_type == 'aptitude' and question.correct_answer:
                is_correct = answer_data.get('value') == question.correct_answer
                if is_correct:
                    points_earned = question.points
            
            ProfilerAnswer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    'question_key': f"{question.question_type}.{question.category}",
                    'answer': answer_data,
                    'is_correct': is_correct,
                    'points_earned': points_earned,
                }
            )
        
        # Update session status
        if section == 'aptitude':
            session.status = 'aptitude_complete'
            session.aptitude_responses = responses
            # Calculate aptitude score
            aptitude_answers = ProfilerAnswer.objects.filter(
                session=session,
                question__question_type='aptitude'
            )
            total_points = sum(a.points_earned for a in aptitude_answers)
            total_possible = sum(q.points for q in ProfilerQuestion.objects.filter(
                question_type='aptitude',
                is_active=True
            ))
            if total_possible > 0:
                session.aptitude_score = (total_points / total_possible) * 100
        elif section == 'behavioral':
            session.status = 'behavioral_complete'
            session.behavioral_responses = responses
        
        session.save()
    
    return Response({
        'status': f'{section}_complete',
        'session_id': str(session.id),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profiling(request):
    """
    POST /api/v1/profiler/complete
    Complete the entire profiling process and generate results.
    """
    session_token = request.data.get('session_token')
    
    if not session_token:
        return Response(
            {'error': 'session_token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        session = ProfilerSession.objects.get(
            session_token=session_token,
            user=request.user
        )
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if session.is_locked:
        return Response(
            {'error': 'Session is locked'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Calculate time spent
    time_spent = (timezone.now() - session.started_at).total_seconds()
    session.time_spent_seconds = int(time_spent)
    
    # Generate comprehensive results
    with transaction.atomic():
        # Calculate scores
        aptitude_answers = ProfilerAnswer.objects.filter(
            session=session,
            question__question_type='aptitude'
        )
        behavioral_answers = ProfilerAnswer.objects.filter(
            session=session,
            question__question_type='behavioral'
        )
        
        # Calculate aptitude breakdown by category
        aptitude_breakdown = {}
        for answer in aptitude_answers:
            category = answer.question.category or 'general'
            if category not in aptitude_breakdown:
                aptitude_breakdown[category] = {'correct': 0, 'total': 0, 'points': 0}
            aptitude_breakdown[category]['total'] += 1
            if answer.is_correct:
                aptitude_breakdown[category]['correct'] += 1
                aptitude_breakdown[category]['points'] += answer.points_earned
        
        # Calculate behavioral traits
        behavioral_traits = {}
        for answer in behavioral_answers:
            category = answer.question.category or 'general'
            if category not in behavioral_traits:
                behavioral_traits[category] = []
            value = answer.answer.get('value', 0)
            if isinstance(value, (int, float)):
                behavioral_traits[category].append(value)
        
        # Calculate average behavioral scores
        behavioral_scores = {}
        for category, values in behavioral_traits.items():
            if values:
                behavioral_scores[category] = sum(values) / len(values)
        
        # Calculate overall scores
        total_aptitude_points = sum(a.points_earned for a in aptitude_answers)
        total_aptitude_possible = sum(q.points for q in ProfilerQuestion.objects.filter(
            question_type='aptitude',
            is_active=True
        ))
        aptitude_score = (total_aptitude_points / total_aptitude_possible * 100) if total_aptitude_possible > 0 else 0
        
        total_behavioral = sum(behavioral_scores.values())
        behavioral_score = (total_behavioral / len(behavioral_scores) * 10) if behavioral_scores else 0
        
        overall_score = (aptitude_score * 0.6 + behavioral_score * 0.4)
        
        # Identify strengths and areas for growth
        strengths = []
        areas_for_growth = []
        
        # From aptitude breakdown
        for category, data in aptitude_breakdown.items():
            if data['total'] > 0:
                score = (data['correct'] / data['total']) * 100
                if score >= 70:
                    strengths.append(f"Strong in {category}")
                elif score < 50:
                    areas_for_growth.append(f"Improve {category} skills")
        
        # From behavioral scores
        for category, score in behavioral_scores.items():
            if score >= 7:
                strengths.append(f"Strong {category} abilities")
            elif score < 5:
                areas_for_growth.append(f"Develop {category} skills")
        
        # Create result record
        result, created = ProfilerResult.objects.update_or_create(
            session=session,
            defaults={
                'user': request.user,
                'overall_score': overall_score,
                'aptitude_score': aptitude_score,
                'behavioral_score': behavioral_score,
                'aptitude_breakdown': aptitude_breakdown,
                'behavioral_traits': behavioral_scores,
                'strengths': strengths[:5],  # Top 5
                'areas_for_growth': areas_for_growth[:5],  # Top 5
                'recommended_tracks': [],  # TODO: Implement track recommendation logic
                'och_mapping': {
                    'tier': 1 if overall_score >= 60 else 0,
                    'readiness_score': float(overall_score),
                    'recommended_foundations': [],
                },
            }
        )
        
        # Update session
        session.status = 'finished'
        session.completed_at = timezone.now()
        session.aptitude_score = aptitude_score
        session.behavioral_profile = behavioral_scores
        session.strengths = strengths[:5]
        session.lock()  # Lock the session (one-time attempt)
        
        # Update user
        request.user.profiling_complete = True
        request.user.profiling_completed_at = timezone.now()
        # session.id is already a UUID object from UUIDField - assign directly
        # Django's UUIDField handles UUID objects automatically
        request.user.profiling_session_id = session.id
        request.user.save()
        
        # Clean up Redis session
        session_manager.delete_session(session_token)
    
    return Response({
        'status': 'completed',
        'session_id': str(session.id),
        'result': {
            'overall_score': float(result.overall_score),
            'aptitude_score': float(result.aptitude_score),
            'behavioral_score': float(result.behavioral_score),
            'strengths': result.strengths,
            'areas_for_growth': result.areas_for_growth,
            'aptitude_breakdown': result.aptitude_breakdown,
            'behavioral_traits': result.behavioral_traits,
            'och_mapping': result.och_mapping,
        },
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profiling_results(request):
    """
    GET /api/v1/profiler/results
    Get profiling results for the current user.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response({
            'completed': False,
            'message': 'Profiling not completed yet',
        }, status=status.HTTP_200_OK)
    
    # Get the completed session - use the safe method to avoid UUID conversion errors
    session = None
    try:
        # Use the safe method from User model to avoid UUID conversion errors
        profiling_session_id = user.get_profiling_session_id_safe()
        if profiling_session_id:
            # profiling_session_id should already be a UUID object from Django
            # But use safe conversion just in case
            session_id = safe_uuid_conversion(profiling_session_id)
            if session_id:
                session = ProfilerSession.objects.get(id=session_id)
    except (ProfilerSession.DoesNotExist, TypeError, ValueError, AttributeError) as e:
        # If lookup fails, session remains None
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to get profiling session: {e}")
        session = None
    
    if not session:
        # Fallback to most recent completed session
        session = ProfilerSession.objects.filter(
            user=user,
            status='finished',
            is_locked=True
        ).order_by('-completed_at').first()
    
    if not session:
        return Response({
            'completed': False,
            'message': 'No completed profiling session found',
        }, status=status.HTTP_200_OK)
    
    # Get result
    try:
        result = session.result
    except ProfilerResult.DoesNotExist:
        return Response({
            'completed': True,
            'session_id': str(session.id),
            'message': 'Results are being generated',
        }, status=status.HTTP_200_OK)
    
    return Response({
        'completed': True,
        'session_id': str(session.id),
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'result': {
            'overall_score': float(result.overall_score),
            'aptitude_score': float(result.aptitude_score),
            'behavioral_score': float(result.behavioral_score),
            'strengths': result.strengths,
            'areas_for_growth': result.areas_for_growth,
            'aptitude_breakdown': result.aptitude_breakdown,
            'behavioral_traits': result.behavioral_traits,
            'recommended_tracks': result.recommended_tracks,
            'learning_path_suggestions': result.learning_path_suggestions,
            'och_mapping': result.och_mapping,
        },
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answers(request):
    """
    POST /api/v1/profiler/answers
    Submit profiler answers.
    """
    serializer = SubmitAnswersSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    answers_data = serializer.validated_data['answers']
    
    try:
        session = ProfilerSession.objects.get(id=session_id, user=request.user)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Save answers
    with transaction.atomic():
        for answer_data in answers_data:
            ProfilerAnswer.objects.update_or_create(
                session=session,
                question_key=answer_data['question_key'],
                defaults={'answer': answer_data['answer']}
            )
        
        # Update session status
        if session.status == 'started':
            session.status = 'current_self_complete'
            session.save()
            
            # Update current_self_assessment from answers
            assessment = {}
            for answer in answers_data:
                key_parts = answer['question_key'].split('.')
                if len(key_parts) == 2:
                    category, field = key_parts
                    if category not in assessment:
                        assessment[category] = {}
                    assessment[category][field] = answer['answer']
            session.current_self_assessment = assessment
            session.save()
    
    # Queue Future-You generation
    from profiler.tasks import generate_future_you_task
    generate_future_you_task.delay(str(session.id))
    
    return Response({'status': 'answers_saved'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_future_you(request):
    """
    POST /api/v1/profiler/future-you
    Generate Future-You persona (triggers background job).
    """
    serializer = FutureYouRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    
    try:
        session = ProfilerSession.objects.get(id=session_id, user=request.user)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Trigger background job
    from profiler.tasks import generate_future_you_task
    generate_future_you_task.delay(str(session.id))
    
    return Response({'status': 'generating'}, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profiler_status(request):
    """
    GET /api/v1/profiler/status
    Get profiler status and recommendations.
    """
    user = request.user
    
    # Check if profiling is complete
    if user.profiling_complete:
        session = ProfilerSession.objects.filter(
            user=user,
            is_locked=True
        ).order_by('-completed_at').first()
        
        if session:
            try:
                result = session.result
                return Response({
                    'status': 'completed',
                    'completed': True,
                    'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                    'overall_score': float(result.overall_score) if result else None,
                    'track_recommendation': {
                        'track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
                        'confidence': float(session.track_confidence) if session.track_confidence else None,
                        'persona': session.futureyou_persona,
                    } if session.futureyou_persona else None,
                }, status=status.HTTP_200_OK)
            except ProfilerResult.DoesNotExist:
                pass
    
    # Check for active session
    session = ProfilerSession.objects.filter(
        user=user,
        is_locked=False
    ).order_by('-created_at').first()
    
    if not session:
        return Response({
            'status': 'not_started',
            'completed': False,
            'current_self_complete': False,
            'future_you_complete': False,
            'profiling_required': True,
        })
    
    track_recommendation = None
    if session.futureyou_persona:
        track_recommendation = {
            'track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
            'confidence': float(session.track_confidence) if session.track_confidence else None,
            'persona': session.futureyou_persona,
        }
    
    return Response({
        'status': session.status,
        'completed': False,
        'session_id': str(session.id),
        'session_token': session.session_token,
        'current_section': session.current_section,
        'current_question_index': session.current_question_index,
        'total_questions': session.total_questions,
        'track_recommendation': track_recommendation,
        'current_self_complete': session.status in ['current_self_complete', 'future_you_complete', 'finished'],
        'future_you_complete': session.status in ['future_you_complete', 'finished'],
        'profiling_required': not user.profiling_complete,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_fastapi_profiling(request):
    """
    POST /api/v1/profiler/sync-fastapi
    Sync profiling completion from FastAPI profiling engine.
    """
    user = request.user
    user_id = request.data.get('user_id')
    session_id = request.data.get('session_id')
    completed_at = request.data.get('completed_at')
    primary_track = request.data.get('primary_track')
    recommendations = request.data.get('recommendations', [])
    
    # Verify user_id matches authenticated user
    if user_id and str(user.id) != str(user_id):
        return Response(
            {'error': 'User ID mismatch'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Update user profiling status
        user.profiling_complete = True
        
        if completed_at:
            from dateutil.parser import parse
            user.profiling_completed_at = parse(completed_at)
        
        if session_id:
            try:
                import uuid
                user.profiling_session_id = uuid.UUID(session_id)
            except Exception as e:
                logger.warning(f"Failed to set profiling_session_id: {e}")
        
        user.save()
        
        # Log the sync
        logger.info(f"Synced profiling completion from FastAPI for user {user.id}, session {session_id}")
        
        return Response({
            'status': 'synced',
            'message': 'Profiling completion synced successfully',
            'user_id': user.id,
            'profiling_complete': user.profiling_complete,
            'completed_at': user.profiling_completed_at.isoformat() if user.profiling_completed_at else None,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to sync profiling from FastAPI: {e}")
        return Response(
            {'error': f'Failed to sync profiling: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_future_you_by_mentee(request, mentee_id):
    """
    GET /api/v1/profiler/mentees/{mentee_id}/future-you
    Get Future-You persona for a mentee.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions - user can view their own data, or if they're a mentor assigned to this mentee
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    is_mentor = request.user.is_mentor
    
    # If not viewing own data, check if user is mentor assigned to this mentee
    can_view = False
    if request.user.id == mentee.id:
        can_view = True
    elif is_analyst or is_admin:
        can_view = True
    elif is_mentor:
        # Check if mentor is assigned to this mentee
        from mentorship_coordination.models import MenteeMentorAssignment
        assignment = MenteeMentorAssignment.objects.filter(
            mentor=request.user,
            mentee=mentee,
            status='active'
        ).first()
        if assignment:
            can_view = True
    
    if not can_view:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get the most recent completed profiler session
    session = ProfilerSession.objects.filter(
        user=mentee,
        status='finished'
    ).order_by('-created_at').first()
    
    # If no completed session, check user's futureyou_persona field
    if not session or not session.futureyou_persona:
        # Check if user has futureyou_persona stored directly
        if hasattr(mentee, 'futureyou_persona') and mentee.futureyou_persona:
            persona_data = mentee.futureyou_persona if isinstance(mentee.futureyou_persona, dict) else {}
        else:
            return Response(
                {
                    'id': str(mentee.id),
                    'persona_name': 'Not assessed',
                    'description': 'Future-You persona has not been generated yet.',
                    'estimated_readiness_date': None,
                    'confidence_score': None,
                },
                status=status.HTTP_200_OK
            )
    else:
        persona_data = session.futureyou_persona
    
    # Format response to match frontend expectations
    response_data = {
        'id': str(mentee.id),
        'persona_name': persona_data.get('name', 'Not assessed'),
        'description': persona_data.get('description', persona_data.get('summary', '')),
        'estimated_readiness_date': persona_data.get('estimated_readiness_date'),
        'confidence_score': float(session.track_confidence) if session and session.track_confidence else None,
    }
    
    return Response(response_data, status=status.HTTP_200_OK)
