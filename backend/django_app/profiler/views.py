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
from .models import ProfilerSession, ProfilerAnswer, ProfilerQuestion, ProfilerResult, ProfilerRetakeRequest
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
    Update current section and question index, track time per module.
    """
    session_token = request.data.get('session_token')
    current_section = request.data.get('current_section')
    current_question_index = request.data.get('current_question_index', 0)
    module_name = request.data.get('module_name')  # e.g., 'identity_value', 'cyber_aptitude'
    time_spent_seconds = request.data.get('time_spent_seconds')  # Time spent in current module
    
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
    
    # Track time spent per module
    if module_name and time_spent_seconds is not None:
        if not session.time_spent_per_module:
            session.time_spent_per_module = {}
        # Accumulate time (don't overwrite, add to existing)
        current_time = session.time_spent_per_module.get(module_name, 0)
        session.time_spent_per_module[module_name] = current_time + int(time_spent_seconds)
    
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
        'time_spent_per_module': session.time_spent_per_module,
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
        
        # Calculate technical exposure score from technical_exposure category answers
        technical_exposure_score = None
        try:
            tech_answers = ProfilerAnswer.objects.filter(
                session=session,
                question__category='technical_exposure'
            )
            if tech_answers.exists():
                total_tech_points = sum(a.points_earned for a in tech_answers)
                total_tech_possible = tech_answers.count() * 10  # Assuming max 10 points per question
                technical_exposure_score = (total_tech_points / total_tech_possible * 100) if total_tech_possible > 0 else 0
        except Exception:
            pass
        
        # Extract work style cluster from work_style category answers
        work_style_cluster = None
        try:
            work_style_answers = ProfilerAnswer.objects.filter(
                session=session,
                question__category='work_style'
            )
            if work_style_answers.exists():
                collaborative_count = sum(1 for a in work_style_answers if a.answer.get('value') in ['B', 'D', 'E'])
                total = work_style_answers.count()
                if total > 0:
                    collaborative_ratio = collaborative_count / total
                    if collaborative_ratio > 0.6:
                        work_style_cluster = 'collaborative'
                    elif collaborative_ratio < 0.4:
                        work_style_cluster = 'independent'
                    else:
                        work_style_cluster = 'balanced'
        except Exception:
            pass
        
        # Extract scenario choices
        scenario_choices = []
        try:
            scenario_answers = ProfilerAnswer.objects.filter(
                session=session,
                question__category='scenario_preference'
            )
            for answer in scenario_answers:
                scenario_choices.append({
                    'question_id': str(answer.question.id) if answer.question else answer.question_key,
                    'selected_option': answer.answer.get('value', ''),
                    'question_key': answer.question_key
                })
        except Exception:
            pass
        
        # Extract difficulty selection
        difficulty_selection = None
        try:
            difficulty_answer = ProfilerAnswer.objects.filter(
                session=session,
                question__category='difficulty_selection'
            ).first()
            if difficulty_answer:
                difficulty_selection = difficulty_answer.answer.get('value', '')
        except Exception:
            pass
        
        # Calculate track alignment percentages (would need track recommendation logic)
        track_alignment_percentages = {}
        # This will be populated from FastAPI sync or calculated here
        
        # Update session with all telemetry
        session.status = 'finished'
        session.completed_at = timezone.now()
        session.aptitude_score = aptitude_score
        session.behavioral_profile = behavioral_scores
        session.strengths = strengths[:5]
        if technical_exposure_score is not None:
            session.technical_exposure_score = technical_exposure_score
        if work_style_cluster:
            session.work_style_cluster = work_style_cluster
        if scenario_choices:
            session.scenario_choices = scenario_choices
        if difficulty_selection:
            session.difficulty_selection = difficulty_selection
        if track_alignment_percentages:
            session.track_alignment_percentages = track_alignment_percentages
        
        # Send telemetry to analytics engine before locking
        send_profiler_telemetry_to_analytics(session)
        
        session.lock()  # Lock the session (one-time attempt)
        
        # Update user
        request.user.profiling_complete = True
        request.user.profiling_completed_at = timezone.now()
        # session.id is already a UUID object from UUIDField - assign directly
        # Django's UUIDField handles UUID objects automatically
        request.user.profiling_session_id = session.id
        request.user.save()
        
        # Create first portfolio entry (Value Statement) automatically
        try:
            from dashboard.models import PortfolioItem
            import json
            
            # Extract value statement from session
            value_statement_parts = []
            
            # Get reflection responses if available (stored in behavioral_responses JSON field)
            if session.behavioral_responses:
                reflection = session.behavioral_responses
                why_cyber = reflection.get('why_cyber', '')
                what_achieve = reflection.get('what_achieve', '')
                
                if why_cyber:
                    value_statement_parts.append(f"I am drawn to cybersecurity because: {why_cyber}")
                if what_achieve:
                    value_statement_parts.append(f"My goal is to: {what_achieve}")
            
            # Add insights from identity responses (check answers for identity_value category)
            try:
                identity_answers = ProfilerAnswer.objects.filter(
                    session=session,
                    question__category='identity_value'
                )[:3]
                if identity_answers.exists():
                    value_statement_parts.append("My core values align with protecting and advancing cybersecurity.")
            except Exception:
                pass  # If answers don't exist yet, continue
            
            value_statement = " ".join(value_statement_parts) if value_statement_parts else "I am committed to advancing in cybersecurity."
            
            # Check if portfolio entry already exists
            existing_entry = PortfolioItem.objects.filter(
                user=request.user,
                item_type='reflection',
                title='My Value Statement'
            ).first()
            
            if not existing_entry:
                # Create portfolio entry
                PortfolioItem.objects.create(
                    user=request.user,
                    title='My Value Statement',
                    summary=value_statement,
                    item_type='reflection',
                    status='approved',  # Auto-approve value statement
                    visibility='private',  # Start as private, user can change later
                    skill_tags=json.dumps([]),
                    evidence_files=json.dumps([]),
                    profiler_session_id=session.id  # Link to profiler session
                )
                logger.info(f"Created value statement portfolio entry for user {request.user.id} linked to session {session.id}")
        except Exception as e:
            logger.error(f"Failed to create portfolio entry for value statement: {e}")
            # Don't fail the entire completion if portfolio creation fails
        
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
        # Try to enrich response with Django-side session data if available
        session = ProfilerSession.objects.filter(
            user=user,
            is_locked=True
        ).order_by('-completed_at').first()

        overall_score = None
        track_recommendation = None
        completed_at = None

        if session:
            completed_at = session.completed_at.isoformat() if session.completed_at else None
            if session.futureyou_persona:
                track_recommendation = {
                    'track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
                    'confidence': float(session.track_confidence) if session.track_confidence else None,
                    'persona': session.futureyou_persona,
                }
            try:
                result = session.result
                overall_score = float(result.overall_score) if result else None
            except ProfilerResult.DoesNotExist:
                pass

        # profiling_complete flag is authoritative — set by sync_fastapi_profiling
        # even if no Django-side ProfilerSession exists (session lives in FastAPI)
        return Response({
            'status': 'completed',
            'completed': True,
            'completed_at': completed_at,
            'overall_score': overall_score,
            'track_recommendation': track_recommendation,
        }, status=status.HTTP_200_OK)

    # Check for active session
    session = ProfilerSession.objects.filter(
        user=user,
        is_locked=False
    ).order_by('-started_at').first()
    
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
            from datetime import datetime
            from django.utils import timezone as tz
            try:
                parsed_dt = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                if parsed_dt.tzinfo is None:
                    parsed_dt = tz.make_aware(parsed_dt)
                user.profiling_completed_at = parsed_dt
            except (ValueError, AttributeError):
                user.profiling_completed_at = tz.now()

        if session_id:
            try:
                import uuid
                user.profiling_session_id = uuid.UUID(session_id)
            except Exception as e:
                logger.warning(f"Failed to set profiling_session_id: {e}")

        # Set user's track_key from profiler recommendation
        if primary_track:
            # Map profiler track names to track keys (use consistent slugs)
            track_key_map = {
                'defender': 'defender',
                'offensive': 'offensive',
                'grc': 'grc',
                'innovation': 'innovation',
                'leadership': 'leadership',
            }
            user.track_key = track_key_map.get(primary_track.lower(), primary_track.lower())
            logger.info(f"Set user {user.id} track_key to '{user.track_key}' from profiler recommendation '{primary_track}'")

        user.save()

        # Enroll user in their profiled curriculum track
        enrolled_track_code = None
        if primary_track:
            from curriculum.models import CurriculumTrack, UserTrackProgress

            # Directly find curriculum track by slug (matches the track_key we just set)
            track_slug = user.track_key

            curriculum_track = CurriculumTrack.objects.filter(
                slug=track_slug,
                is_active=True
            ).first()

            if curriculum_track:
                try:
                    progress, created = UserTrackProgress.objects.get_or_create(
                        user=user,
                        track=curriculum_track,
                    )
                    enrolled_track_code = curriculum_track.code
                    if created:
                        logger.info(f"Enrolled user {user.id} in curriculum track '{curriculum_track.name}' (slug: {track_slug})")
                    else:
                        logger.info(f"User {user.id} already enrolled in curriculum track '{curriculum_track.name}' (slug: {track_slug})")
                except Exception as e:
                    logger.warning(f"Failed to enroll user in curriculum track: {e}")
            else:
                logger.warning(f"No curriculum track found with slug '{track_slug}', skipping enrollment")

        # Update profiler session with telemetry data if session exists
        try:
            if session_id:
                import uuid
                session_uuid = uuid.UUID(session_id)
                profiler_session = ProfilerSession.objects.filter(id=session_uuid, user=user).first()
                
                if profiler_session:
                    # Store track alignment percentages from recommendations
                    if recommendations:
                        track_alignments = {}
                        for rec in recommendations:
                            track_alignments[rec.get('track_key', '')] = float(rec.get('score', 0))
                        profiler_session.track_alignment_percentages = track_alignments
                    
                    # Store difficulty selection if available
                    # (This would come from FastAPI session if available)
                    
                    profiler_session.save()
                    
                    # Send telemetry to analytics engine
                    send_profiler_telemetry_to_analytics(profiler_session)
        except Exception as e:
            logger.warning(f"Failed to update profiler session telemetry: {e}")
        
        logger.info(f"Synced profiling completion from FastAPI for user {user.id}, session {session_id}")

        return Response({
            'status': 'synced',
            'message': 'Profiling completion synced successfully',
            'user_id': user.id,
            'profiling_complete': user.profiling_complete,
            'completed_at': user.profiling_completed_at.isoformat() if user.profiling_completed_at else None,
            'enrolled_track': enrolled_track_code,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to sync profiling from FastAPI: {e}")
        return Response(
            {'error': f'Failed to sync profiling: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_profiling(request):
    """
    POST /api/v1/profiler/reset
    Reset profiling so the user can redo it.
    Clears data on both Django and FastAPI sides.
    """
    user = request.user
    session_ids_reset = []

    # 1. Get existing session IDs before resetting (for FastAPI cleanup)
    try:
        existing_sessions = ProfilerSession.objects.filter(user=user).values_list('id', flat=True)
        session_ids_reset = [str(sid) for sid in existing_sessions]
    except Exception:
        pass

    # 2. Delete Django profiler data (answers, results, then sessions)
    try:
        ProfilerAnswer.objects.filter(session__user=user).delete()
        ProfilerResult.objects.filter(session__user=user).delete()
        ProfilerSession.objects.filter(user=user).delete()
        logger.info(f"Deleted Django profiler sessions for user {user.id}")
    except Exception as e:
        logger.warning(f"Error deleting profiler data for user {user.id}: {e}")

    # 3. Reset user profiling flags
    user.profiling_complete = False
    user.profiling_completed_at = None
    user.profiling_session_id = None
    user.save(update_fields=['profiling_complete', 'profiling_completed_at', 'profiling_session_id'])

    # 4. Delete FastAPI in-memory sessions
    fastapi_url = getattr(
        __import__('django.conf', fromlist=['settings']).settings,
        'FASTAPI_BASE_URL',
        'http://localhost:8001'
    )
    fastapi_errors = []
    for sid in session_ids_reset:
        try:
            resp = requests.delete(
                f"{fastapi_url}/api/v1/profiling/session/{sid}",
                headers={'Authorization': request.headers.get('Authorization', '')},
                timeout=5,
            )
            if resp.status_code in (200, 204, 404):
                logger.info(f"FastAPI session {sid} deleted (status {resp.status_code})")
            else:
                fastapi_errors.append(f"Session {sid}: {resp.status_code}")
        except requests.RequestException as e:
            fastapi_errors.append(f"Session {sid}: {str(e)}")
            logger.warning(f"Could not delete FastAPI session {sid}: {e}")

    if fastapi_errors:
        logger.warning(f"FastAPI cleanup errors: {fastapi_errors}")

    logger.info(f"Profiling fully reset for user {user.id} ({user.email})")

    return Response({
        'status': 'reset',
        'message': 'Profiling has been reset. You can now retake the assessment.',
        'profiling_complete': False,
        'sessions_cleared': len(session_ids_reset),
    }, status=status.HTTP_200_OK)


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
    ).order_by('-started_at').first()
    
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentee_profiler_results(request, mentee_id):
    """
    GET /api/v1/profiler/mentees/{mentee_id}/results
    Get comprehensive profiler results for a mentee.
    Used by mentors and coaching OS to guide mentorship.
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
    
    # Check permissions - user can view their own data, or if they're a mentor/coach/admin assigned to this mentee
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles or request.user.is_staff
    is_mentor = request.user.is_mentor
    
    # Check if coaching OS is accessing (coaching service or AI coach)
    is_coaching_os = False
    # Check if user has coaching-related permissions
    if hasattr(request.user, 'coaching_sessions') or 'coach' in str(request.user.user_roles.all()).lower():
        is_coaching_os = True
    
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
    elif is_coaching_os:
        # Coaching OS can access for any student (for AI coach guidance)
        can_view = True
    
    if not can_view:
        logger.warning(f"User {request.user.id} attempted to access profiler results for mentee {mentee_id} without permission")
        return Response(
            {'error': 'Permission denied. You must be assigned as a mentor or have admin access.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get the most recent completed profiler session
    session = ProfilerSession.objects.filter(
        user=mentee,
        status__in=['finished', 'locked']
    ).order_by('-completed_at').first()
    
    if not session:
        logger.info(f"No profiler session found for mentee {mentee_id}")
        return Response(
            {
                'error': 'No profiler results found',
                'mentee_id': mentee_id,
                'profiling_complete': mentee.profiling_complete
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get profiler result if exists
    profiler_result = None
    try:
        profiler_result = session.result
    except ProfilerResult.DoesNotExist:
        pass
    
    # Get FastAPI results if available (for enhanced profiler)
    fastapi_results = None
    try:
        import requests
        from django.conf import settings
        fastapi_url = getattr(settings, 'FASTAPI_BASE_URL', 'http://localhost:8001')
        
        # Try to get FastAPI session results
        if hasattr(session, 'id'):
            response = requests.get(
                f"{fastapi_url}/api/v1/profiling/enhanced/session/{session.id}/results",
                timeout=5
            )
            if response.status_code == 200:
                fastapi_results = response.json()
    except Exception as e:
        logger.warning(f"Could not fetch FastAPI results for session {session.id}: {e}", exc_info=True)
    
    # Build comprehensive results response
    response_data = {
        'mentee_id': mentee_id,
        'mentee_email': mentee.email,
        'mentee_name': f"{mentee.first_name} {mentee.last_name}".strip() or mentee.email,
        'session_id': str(session.id),
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'is_locked': session.is_locked,
        
        # Scores
        'scores': {
            'overall': float(profiler_result.overall_score) if profiler_result else None,
            'aptitude': float(session.aptitude_score) if session.aptitude_score else None,
            'behavioral': float(profiler_result.behavioral_score) if profiler_result else None,
        },
        
        # Track recommendation
        'recommended_track': {
            'track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
            'confidence': float(session.track_confidence) if session.track_confidence else None,
        },
        
        # Strengths and growth areas
        'strengths': session.strengths if session.strengths else (profiler_result.strengths if profiler_result else []),
        'areas_for_growth': profiler_result.areas_for_growth if profiler_result else [],
        
        # Behavioral profile
        'behavioral_profile': session.behavioral_profile if session.behavioral_profile else (profiler_result.behavioral_traits if profiler_result else {}),
        
        # Future-You persona
        'future_you_persona': session.futureyou_persona if session.futureyou_persona else {},
        
        # Detailed breakdowns
        'aptitude_breakdown': profiler_result.aptitude_breakdown if profiler_result else {},
        'recommended_tracks': profiler_result.recommended_tracks if profiler_result else [],
        'learning_path_suggestions': profiler_result.learning_path_suggestions if profiler_result else [],
        
        # OCH mapping
        'och_mapping': profiler_result.och_mapping if profiler_result else {},
        
        # FastAPI enhanced results (if available)
        'enhanced_results': fastapi_results,
        
        # Anti-cheat info (for admin/mentor review)
        'anti_cheat': {
            'score': float(session.anti_cheat_score) if hasattr(session, 'anti_cheat_score') and session.anti_cheat_score else None,
            'suspicious_patterns': session.suspicious_patterns if hasattr(session, 'suspicious_patterns') else [],
            'device_fingerprint': session.device_fingerprint if hasattr(session, 'device_fingerprint') else None,
        } if (is_admin or is_mentor) else None,
        
        # Foundations reflection data (for mentor review)
        'foundations_reflection': None,
    }
    
    # Add Foundations reflection if available
    try:
        from foundations.models import FoundationsProgress
        foundations_progress = FoundationsProgress.objects.filter(user=mentee).first()
        if foundations_progress and foundations_progress.goals_reflection:
            response_data['foundations_reflection'] = {
                'goals_reflection': foundations_progress.goals_reflection,
                'value_statement': foundations_progress.value_statement,
                'confirmed_track_key': foundations_progress.confirmed_track_key,
                'assessment_score': float(foundations_progress.assessment_score) if foundations_progress.assessment_score else None,
                'completed_at': foundations_progress.completed_at.isoformat() if foundations_progress.completed_at else None,
                'is_complete': foundations_progress.is_complete(),
            }
    except Exception as e:
        logger.warning(f"Could not fetch Foundations reflection for mentee {mentee_id}: {e}", exc_info=True)
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cohort_profiler_analytics(request, cohort_id):
    """
    GET /api/v1/profiler/admin/cohorts/{cohort_id}/analytics
    Get profiler analytics for a cohort (admin/director only).
    """
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or request.user.is_staff
    is_director = 'director' in user_roles
    
    if not (is_admin or is_director):
        logger.warning(f"User {request.user.id} attempted to access cohort analytics without permission")
        return Response(
            {'error': 'Admin or Director access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get cohort
    from programs.models import Cohort, Enrollment
    try:
        cohort = Cohort.objects.get(id=cohort_id)
    except Cohort.DoesNotExist:
        return Response(
            {'error': 'Cohort not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify director access if not admin
    if not is_admin and is_director:
        if cohort.track.program.director != request.user:
            return Response(
                {'error': 'Access denied to this cohort'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get all enrolled students
    enrollments = Enrollment.objects.filter(
        cohort=cohort,
        status='active'
    ).select_related('user')
    
    students = [e.user for e in enrollments]
    
    # Get profiler data for all students
    completed_sessions = ProfilerSession.objects.filter(
        user__in=students,
        status__in=['finished', 'locked']
    ).select_related('user', 'result')
    
    # Calculate analytics
    total_students = len(students)
    profiled_students = completed_sessions.count()
    profiled_percentage = (profiled_students / total_students * 100) if total_students > 0 else 0
    
    # Track distribution
    track_distribution = {}
    for session in completed_sessions:
        if session.recommended_track_id:
            track_key = str(session.recommended_track_id)
            track_distribution[track_key] = track_distribution.get(track_key, 0) + 1
    
    # Score statistics
    aptitude_scores = [float(s.aptitude_score) for s in completed_sessions if s.aptitude_score]
    avg_aptitude = sum(aptitude_scores) / len(aptitude_scores) if aptitude_scores else 0
    
    overall_scores = [float(s.result.overall_score) for s in completed_sessions if s.result]
    avg_overall = sum(overall_scores) / len(overall_scores) if overall_scores else 0
    
    # Strengths analysis (aggregate)
    all_strengths = []
    for session in completed_sessions:
        if session.strengths:
            all_strengths.extend(session.strengths)
    
    from collections import Counter
    top_strengths = [{'strength': k, 'count': v} for k, v in Counter(all_strengths).most_common(10)]
    
    # Response data
    analytics_data = {
        'cohort_id': str(cohort_id),
        'cohort_name': cohort.name,
        'total_students': total_students,
        'profiled_students': profiled_students,
        'profiled_percentage': round(profiled_percentage, 2),
        'not_profiled_count': total_students - profiled_students,
        
        'score_statistics': {
            'average_aptitude': round(avg_aptitude, 2),
            'average_overall': round(avg_overall, 2),
            'min_aptitude': round(min(aptitude_scores), 2) if aptitude_scores else None,
            'max_aptitude': round(max(aptitude_scores), 2) if aptitude_scores else None,
            'min_overall': round(min(overall_scores), 2) if overall_scores else None,
            'max_overall': round(max(overall_scores), 2) if overall_scores else None,
        },
        
        'track_distribution': track_distribution,
        
        'top_strengths': top_strengths,
        
        'students': [
            {
                'student_id': str(s.user.id),
                'student_email': s.user.email,
                'student_name': f"{s.user.first_name} {s.user.last_name}".strip() or s.user.email,
                'profiled': True,
                'aptitude_score': float(s.aptitude_score) if s.aptitude_score else None,
                'overall_score': float(s.result.overall_score) if s.result else None,
                'recommended_track_id': str(s.recommended_track_id) if s.recommended_track_id else None,
                'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in completed_sessions
        ],
        
        'not_profiled_students': [
            {
                'student_id': str(s.id),
                'student_email': s.email,
                'student_name': f"{s.first_name} {s.last_name}".strip() or s.email,
                'profiled': False,
            }
            for s in students if s.id not in [ss.user.id for ss in completed_sessions]
        ],
    }
    
    return Response(analytics_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enterprise_profiler_analytics(request):
    """
    GET /api/v1/profiler/admin/enterprise/analytics
    Get profiler analytics for enterprise clients (admin only).
    Query params: ?sponsor_id={id}&cohort_id={id}&date_from={date}&date_to={date}
    """
    # Check admin permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or request.user.is_staff
    
    if not is_admin:
        logger.warning(f"User {request.user.id} attempted to access enterprise analytics without admin permission")
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get query parameters
    sponsor_id = request.query_params.get('sponsor_id')
    cohort_id = request.query_params.get('cohort_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    # Build query
    from programs.models import Enrollment, Cohort
    from sponsors.models import Sponsor
    
    enrollments_query = Enrollment.objects.filter(status='active')
    
    if sponsor_id:
        # Get cohorts sponsored by this sponsor
        sponsor = Sponsor.objects.filter(id=sponsor_id).first()
        if sponsor:
            sponsored_cohorts = Cohort.objects.filter(sponsor=sponsor)
            enrollments_query = enrollments_query.filter(cohort__in=sponsored_cohorts)
    
    if cohort_id:
        enrollments_query = enrollments_query.filter(cohort_id=cohort_id)
    
    enrollments = enrollments_query.select_related('user', 'cohort')
    
    # Filter by date if provided
    if date_from or date_to:
        from django.utils.dateparse import parse_date
        sessions_query = ProfilerSession.objects.filter(
            user__in=[e.user for e in enrollments],
            status__in=['finished', 'locked']
        )
        
        if date_from:
            date_from_obj = parse_date(date_from)
            if date_from_obj:
                sessions_query = sessions_query.filter(completed_at__gte=date_from_obj)
        
        if date_to:
            date_to_obj = parse_date(date_to)
            if date_to_obj:
                sessions_query = sessions_query.filter(completed_at__lte=date_to_obj)
    else:
        sessions_query = ProfilerSession.objects.filter(
            user__in=[e.user for e in enrollments],
            status__in=['finished', 'locked']
        )
    
    completed_sessions = sessions_query.select_related('user', 'result')
    
    # Calculate enterprise-wide analytics
    total_employees = enrollments.count()
    profiled_employees = completed_sessions.count()
    profiled_percentage = (profiled_employees / total_employees * 100) if total_employees > 0 else 0
    
    # Track distribution across enterprise
    track_distribution = {}
    for session in completed_sessions:
        if session.recommended_track_id:
            track_key = str(session.recommended_track_id)
            track_distribution[track_key] = track_distribution.get(track_key, 0) + 1
    
    # Score statistics
    aptitude_scores = [float(s.aptitude_score) for s in completed_sessions if s.aptitude_score]
    avg_aptitude = sum(aptitude_scores) / len(aptitude_scores) if aptitude_scores else 0
    
    overall_scores = [float(s.result.overall_score) for s in completed_sessions if s.result]
    avg_overall = sum(overall_scores) / len(overall_scores) if overall_scores else 0
    
    # Cohort breakdown
    cohort_breakdown = {}
    for enrollment in enrollments:
        cohort_name = enrollment.cohort.name if enrollment.cohort else 'Unknown'
        if cohort_name not in cohort_breakdown:
            cohort_breakdown[cohort_name] = {
                'total': 0,
                'profiled': 0,
                'avg_aptitude': 0,
                'avg_overall': 0,
            }
        cohort_breakdown[cohort_name]['total'] += 1
        
        # Check if this student is profiled
        student_session = next((s for s in completed_sessions if s.user.id == enrollment.user.id), None)
        if student_session:
            cohort_breakdown[cohort_name]['profiled'] += 1
    
    # Calculate averages per cohort
    for cohort_name, data in cohort_breakdown.items():
        cohort_enrollments = [e for e in enrollments if (e.cohort.name if e.cohort else 'Unknown') == cohort_name]
        cohort_sessions = [s for s in completed_sessions if s.user.id in [e.user.id for e in cohort_enrollments]]
        
        if cohort_sessions:
            cohort_aptitude = [float(s.aptitude_score) for s in cohort_sessions if s.aptitude_score]
            cohort_overall = [float(s.result.overall_score) for s in cohort_sessions if s.result]
            
            data['avg_aptitude'] = round(sum(cohort_aptitude) / len(cohort_aptitude), 2) if cohort_aptitude else 0
            data['avg_overall'] = round(sum(cohort_overall) / len(cohort_overall), 2) if cohort_overall else 0
            data['profiled_percentage'] = round((data['profiled'] / data['total'] * 100), 2) if data['total'] > 0 else 0
    
    # Response data
    analytics_data = {
        'sponsor_id': sponsor_id,
        'cohort_id': cohort_id,
        'date_range': {
            'from': date_from,
            'to': date_to,
        },
        'total_employees': total_employees,
        'profiled_employees': profiled_employees,
        'profiled_percentage': round(profiled_percentage, 2),
        'not_profiled_count': total_employees - profiled_employees,
        
        'score_statistics': {
            'average_aptitude': round(avg_aptitude, 2),
            'average_overall': round(avg_overall, 2),
            'min_aptitude': round(min(aptitude_scores), 2) if aptitude_scores else None,
            'max_aptitude': round(max(aptitude_scores), 2) if aptitude_scores else None,
            'min_overall': round(min(overall_scores), 2) if overall_scores else None,
            'max_overall': round(max(overall_scores), 2) if overall_scores else None,
        },
        
        'track_distribution': track_distribution,
        
        'cohort_breakdown': cohort_breakdown,
        
        'readiness_distribution': {
            'novice': len([s for s in completed_sessions if s.result and s.result.overall_score < 40]),
            'beginner': len([s for s in completed_sessions if s.result and 40 <= s.result.overall_score < 60]),
            'intermediate': len([s for s in completed_sessions if s.result and 60 <= s.result.overall_score < 80]),
            'advanced': len([s for s in completed_sessions if s.result and s.result.overall_score >= 80]),
        },
    }
    
    return Response(analytics_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_value_statement(request):
    """
    GET /api/v1/profiler/value-statement
    Get user's Value Statement from portfolio for leadership identity seeding.
    """
    from dashboard.models import PortfolioItem
    
    value_statement_entry = PortfolioItem.objects.filter(
        user=request.user,
        item_type='reflection',
        title='My Value Statement'
    ).order_by('-created_at').first()
    
    if not value_statement_entry:
        return Response({
            'value_statement': None,
            'message': 'Value statement not found. Please complete profiler first.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'value_statement': value_statement_entry.summary,
        'created_at': value_statement_entry.created_at.isoformat(),
        'profiler_session_id': str(value_statement_entry.profiler_session_id) if value_statement_entry.profiler_session_id else None,
        'status': value_statement_entry.status,
        'visibility': value_statement_entry.visibility
    }, status=status.HTTP_200_OK)


def send_profiler_telemetry_to_analytics(session: ProfilerSession):
    """
    Send profiler telemetry data to Analytics engine.
    This function aggregates all telemetry data and sends it to the analytics service.
    """
    try:
        from profiler.models import ProfilerResult
        
        # Get profiler result if exists
        try:
            result = session.result
        except ProfilerResult.DoesNotExist:
            result = None
        
        # Build telemetry payload
        telemetry_data = {
            'user_id': str(session.user.uuid_id),
            'session_id': str(session.id),
            'completion_status': session.status,
            'time_spent_seconds': session.time_spent_seconds,
            'time_spent_per_module': session.time_spent_per_module or {},
            'aptitude_score': float(session.aptitude_score) if session.aptitude_score else None,
            'technical_exposure_score': float(session.technical_exposure_score) if session.technical_exposure_score else None,
            'work_style_cluster': session.work_style_cluster or None,
            'scenario_choices': session.scenario_choices or [],
            'difficulty_selection': session.difficulty_selection or None,
            'recommended_track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
            'track_confidence': float(session.track_confidence) if session.track_confidence else None,
            'track_alignment_percentages': session.track_alignment_percentages or {},
            'value_statement': None,  # Will be retrieved from portfolio entry
            'result_accepted': session.result_accepted,
            'result_accepted_at': session.result_accepted_at.isoformat() if session.result_accepted_at else None,
            'device_browser': {
                'user_agent': session.user_agent or None,
                'device_fingerprint': session.device_fingerprint or None,
                'ip_address': str(session.ip_address) if session.ip_address else None,
            },
            'attempt_count': 1 if session.is_locked else 0,  # Must remain 1 unless reset
            'foundations_transition_at': session.foundations_transition_at.isoformat() if session.foundations_transition_at else None,
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'started_at': session.started_at.isoformat(),
        }
        
        # Get value statement from portfolio entry
        try:
            from dashboard.models import PortfolioItem
            value_statement_entry = PortfolioItem.objects.filter(
                user=session.user,
                item_type='reflection',
                title='My Value Statement'
            ).first()
            if value_statement_entry:
                telemetry_data['value_statement'] = value_statement_entry.summary
        except Exception:
            pass
        
        # Add result data if available
        if result:
            telemetry_data['overall_score'] = float(result.overall_score) if result.overall_score else None
            telemetry_data['behavioral_score'] = float(result.behavioral_score) if result.behavioral_score else None
            telemetry_data['recommended_tracks'] = result.recommended_tracks or []
        
        # Send to analytics engine (implement based on your analytics service)
        # This could be:
        # 1. Celery task for async processing
        # 2. Direct API call to analytics service
        # 3. Event stream (Kafka, RabbitMQ, etc.)
        # 4. Database write to analytics tables
        
        # For now, log the telemetry data (replace with actual analytics integration)
        logger.info(f"Profiler telemetry data for session {session.id}: {telemetry_data}")
        
        # Example: Send to analytics via Celery task (if implemented)
        # from analytics.tasks import send_profiler_telemetry
        # send_profiler_telemetry.delay(telemetry_data)
        
        return telemetry_data
        
    except Exception as e:
        logger.error(f"Failed to send profiler telemetry to analytics: {e}")
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_profiler_result(request, session_id):
    """
    POST /api/v1/profiler/sessions/{session_id}/accept-result
    Track user acceptance or override of profiler result.
    Body: {
        "accepted": true,  # true = accepted, false = overridden
        "override_track_id": "uuid"  # Optional: if overriding, specify new track
    }
    """
    try:
        session = ProfilerSession.objects.get(id=session_id, user=request.user)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Profiler session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    accepted = request.data.get('accepted', True)
    override_track_id = request.data.get('override_track_id')
    
    session.result_accepted = accepted
    session.result_accepted_at = timezone.now()
    
    # If overriding, store the override track
    if not accepted and override_track_id:
        session.recommended_track_id = override_track_id
        session.track_confidence = 0.5  # Lower confidence for overrides
    
    session.save()
    
    # Send telemetry to analytics engine
    try:
        send_profiler_telemetry_to_analytics(session)
    except Exception as e:
        logger.warning(f"Failed to send telemetry to analytics: {e}")
    
    return Response({
        'message': 'Result acceptance recorded',
        'accepted': accepted,
        'accepted_at': session.result_accepted_at.isoformat(),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reset_profiler(request, user_id):
    """
    POST /api/v1/profiler/admin/users/{user_id}/reset
    Admin-only: Reset a user's profiler session to allow retake.
    """
    # Check admin permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or request.user.is_staff
    
    if not is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all profiler sessions for this user
    sessions = ProfilerSession.objects.filter(user=target_user)
    
    # Reset each session
    reset_count = 0
    for session in sessions:
        session.is_locked = False
        session.locked_at = None
        session.admin_reset_by = request.user
        # Note: admin_reset_at field may need to be added to model if not exists
        # For now, we'll use locked_at to track reset time
        session.save()
        reset_count += 1
    
    # Reset user's profiling status
    target_user.profiling_complete = False
    target_user.save()
    
    return Response({
        'message': f'Profiler reset successfully for user {target_user.email}',
        'user_id': str(user_id),
        'sessions_reset': reset_count,
        'reset_by': request.user.email,
        'reset_at': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_adjust_scores(request, session_id):
    """
    POST /api/v1/profiler/admin/sessions/{session_id}/adjust-scores
    Admin-only: Adjust profiler scores for a session.
    Body: {
        "aptitude_score": 85.5,  # Optional
        "overall_score": 82.0,   # Optional (for ProfilerResult)
        "behavioral_score": 78.5, # Optional (for ProfilerResult)
        "track_confidence": 0.92, # Optional
        "reason": "Score adjustment reason"
    }
    """
    # Check admin permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or request.user.is_staff
    
    if not is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        session = ProfilerSession.objects.get(id=session_id)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Profiler session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get adjustment data
    aptitude_score = request.data.get('aptitude_score')
    overall_score = request.data.get('overall_score')
    behavioral_score = request.data.get('behavioral_score')
    track_confidence = request.data.get('track_confidence')
    reason = request.data.get('reason', 'Admin score adjustment')
    
    adjustments_made = []
    
    # Adjust session scores
    if aptitude_score is not None:
        old_value = float(session.aptitude_score) if session.aptitude_score else None
        session.aptitude_score = max(0, min(100, float(aptitude_score)))
        adjustments_made.append({
            'field': 'aptitude_score',
            'old_value': old_value,
            'new_value': float(session.aptitude_score)
        })
    
    if track_confidence is not None:
        old_value = float(session.track_confidence) if session.track_confidence else None
        session.track_confidence = max(0.0, min(1.0, float(track_confidence)))
        adjustments_made.append({
            'field': 'track_confidence',
            'old_value': old_value,
            'new_value': float(session.track_confidence)
        })
    
    session.save()
    
    # Adjust ProfilerResult scores if exists
    result_adjustments = []
    try:
        result = session.result
        if overall_score is not None:
            old_value = float(result.overall_score) if result.overall_score else None
            result.overall_score = max(0, min(100, float(overall_score)))
            result_adjustments.append({
                'field': 'overall_score',
                'old_value': old_value,
                'new_value': float(result.overall_score)
            })
        
        if behavioral_score is not None:
            old_value = float(result.behavioral_score) if result.behavioral_score else None
            result.behavioral_score = max(0, min(100, float(behavioral_score)))
            result_adjustments.append({
                'field': 'behavioral_score',
                'old_value': old_value,
                'new_value': float(result.behavioral_score)
            })
        
        if result_adjustments:
            result.save()
    except ProfilerResult.DoesNotExist:
        pass
    
    # Log adjustment (could be stored in an audit log model)
    logger.info(f"Admin {request.user.email} adjusted scores for session {session_id}: {adjustments_made + result_adjustments}. Reason: {reason}")
    
    return Response({
        'message': 'Scores adjusted successfully',
        'session_id': str(session_id),
        'adjustments': adjustments_made + result_adjustments,
        'adjusted_by': request.user.email,
        'adjusted_at': timezone.now().isoformat(),
        'reason': reason
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_profiler_retake(request):
    """
    POST /api/v1/profiler/retake-request
    Request permission to retake the profiler assessment.
    Requires admin approval.
    """
    user = request.user
    
    # Check if user has completed profiling
    if not user.profiling_complete:
        return Response(
            {'error': 'You have not completed profiling yet'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending request
    existing_request = ProfilerRetakeRequest.objects.filter(
        user=user,
        status='pending'
    ).first()
    
    if existing_request:
        return Response(
            {
                'error': 'You already have a pending retake request',
                'request_id': str(existing_request.id),
                'status': existing_request.status
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get original session
    original_session = ProfilerSession.objects.filter(
        user=user,
        is_locked=True
    ).order_by('-completed_at').first()
    
    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response(
            {'error': 'Reason is required for retake request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create retake request
    retake_request = ProfilerRetakeRequest.objects.create(
        user=user,
        original_session=original_session,
        reason=reason,
        status='pending'
    )
    
    return Response(
        {
            'request_id': str(retake_request.id),
            'status': retake_request.status,
            'message': 'Retake request submitted successfully. Awaiting admin approval.'
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_retake_request_status(request):
    """
    GET /api/v1/profiler/retake-request/status
    Get status of user's retake request.
    """
    user = request.user
    
    retake_request = ProfilerRetakeRequest.objects.filter(
        user=user
    ).order_by('-created_at').first()
    
    if not retake_request:
        return Response(
            {
                'has_request': False,
                'status': None
            },
            status=status.HTTP_200_OK
        )
    
    return Response(
        {
            'has_request': True,
            'request_id': str(retake_request.id),
            'status': retake_request.status,
            'reason': retake_request.reason,
            'admin_notes': retake_request.admin_notes if retake_request.reviewed_by else None,
            'created_at': retake_request.created_at.isoformat(),
            'reviewed_at': retake_request.reviewed_at.isoformat() if retake_request.reviewed_at else None,
            'can_retake': retake_request.status == 'approved'
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_retake_requests(request):
    """
    GET /api/v1/profiler/admin/retake-requests
    List all retake requests (admin only).
    """
    # Check if user is admin
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = request.user.is_staff or 'admin' in user_roles
    
    if not is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    status_filter = request.query_params.get('status', None)
    queryset = ProfilerRetakeRequest.objects.all()
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    requests_data = []
    for req in queryset.order_by('-created_at'):
        requests_data.append({
            'id': str(req.id),
            'user_id': req.user.id,
            'user_email': req.user.email,
            'user_name': f"{req.user.first_name} {req.user.last_name}".strip() or req.user.email,
            'reason': req.reason,
            'status': req.status,
            'admin_notes': req.admin_notes,
            'reviewed_by': req.reviewed_by.email if req.reviewed_by else None,
            'reviewed_at': req.reviewed_at.isoformat() if req.reviewed_at else None,
            'original_session_id': str(req.original_session.id) if req.original_session else None,
            'created_at': req.created_at.isoformat(),
        })
    
    return Response(
        {
            'requests': requests_data,
            'total': len(requests_data),
            'pending_count': queryset.filter(status='pending').count()
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_retake_request(request, request_id):
    """
    POST /api/v1/profiler/admin/retake-requests/{request_id}/approve
    Approve a retake request (admin only).
    """
    # Check if user is admin
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = request.user.is_staff or 'admin' in user_roles
    
    if not is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        retake_request = ProfilerRetakeRequest.objects.get(id=request_id)
    except ProfilerRetakeRequest.DoesNotExist:
        return Response(
            {'error': 'Retake request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if retake_request.status != 'pending':
        return Response(
            {'error': f'Request is already {retake_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    admin_notes = request.data.get('admin_notes', '').strip()
    
    # Approve the request
    retake_request.approve(request.user, admin_notes)
    
    # Reset user's profiling status
    user = retake_request.user
    user.profiling_complete = False
    user.profiling_completed_at = None
    user.profiling_session_id = None
    user.save()
    
    # Unlock original session (optional - for audit trail)
    if retake_request.original_session:
        retake_request.original_session.is_locked = False
        retake_request.original_session.admin_reset_by = request.user
        retake_request.original_session.save()
    
    return Response(
        {
            'message': 'Retake request approved',
            'request_id': str(retake_request.id),
            'user_id': user.id,
            'user_email': user.email,
            'status': retake_request.status
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_retake_request(request, request_id):
    """
    POST /api/v1/profiler/admin/retake-requests/{request_id}/reject
    Reject a retake request (admin only).
    """
    # Check if user is admin
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_admin = request.user.is_staff or 'admin' in user_roles
    
    if not is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        retake_request = ProfilerRetakeRequest.objects.get(id=request_id)
    except ProfilerRetakeRequest.DoesNotExist:
        return Response(
            {'error': 'Retake request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if retake_request.status != 'pending':
        return Response(
            {'error': f'Request is already {retake_request.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    admin_notes = request.data.get('admin_notes', '').strip()
    if not admin_notes:
        admin_notes = 'Retake request rejected'
    
    # Reject the request
    retake_request.reject(request.user, admin_notes)
    
    return Response(
        {
            'message': 'Retake request rejected',
            'request_id': str(retake_request.id),
            'status': retake_request.status
        },
        status=status.HTTP_200_OK
    )


# ─────────────────────────────────────────────────────────
# Future-You Insights Endpoint (GPT-powered + Fallback)
# ─────────────────────────────────────────────────────────

# Track-specific fallback data used when GPT is unavailable
_TRACK_FALLBACK = {
    'defender': {
        'personas': [
            ('The Digital Guardian',     'Cyber Defender',         'Beginner'),
            ('The Network Protector',    'Junior SOC Analyst',     'Junior'),
            ('The Threat Responder',     'Security Engineer',      'Mid-level'),
            ('The Security Sentinel',   'Senior SOC Engineer',    'Senior'),
        ],
        'projected_skills': ['Network Defense', 'Threat Detection', 'Incident Response', 'Vulnerability Management', 'Log Analysis', 'Security Monitoring'],
        'predicted_roles':  ['SOC Analyst', 'Security Engineer', 'Network Defender'],
        'gaps': [
            {'gap': 'Hands-on Lab Practice',              'priority': 'high',   'description': 'Complete more hands-on security labs in the curriculum to build practical skills.'},
            {'gap': 'Network Forensics Knowledge',         'priority': 'high',   'description': 'Study network traffic analysis and packet inspection techniques.'},
            {'gap': 'Malware Analysis Fundamentals',      'priority': 'medium', 'description': 'Learn to identify and analyse common malware behaviours.'},
            {'gap': 'Log Analysis & SIEM Usage',          'priority': 'medium', 'description': 'Practice reading and correlating security event logs.'},
            {'gap': 'Incident Response Procedures',       'priority': 'low',    'description': 'Study formal IR playbooks and runbooks used in enterprise SOCs.'},
        ],
        'next_steps': [
            'Complete all Tier 0 and Tier 1 Defender missions to build core fundamentals.',
            'Set up a home lab with a SIEM tool (Splunk Free or ELK) to practice log analysis.',
            'Study the MITRE ATT&CK framework to understand how attackers operate.',
            'Aim for at least 80% on your next three missions to sharpen your score average.',
            'Join the OCH community circle to discuss real-world Defender scenarios with peers.',
        ],
    },
    'offensive': {
        'personas': [
            ('The Cyber Infiltrator',    'Security Researcher',    'Beginner'),
            ('The Exploit Developer',   'Junior Pen Tester',      'Junior'),
            ('The Red Team Operator',   'Penetration Tester',     'Mid-level'),
            ('The Adversary Emulator',  'Senior Red Teamer',      'Senior'),
        ],
        'projected_skills': ['Penetration Testing', 'Exploitation Techniques', 'Web App Security', 'OSINT', 'Scripting for Security', 'Privilege Escalation'],
        'predicted_roles':  ['Penetration Tester', 'Red Team Operator', 'Vulnerability Researcher'],
        'gaps': [
            {'gap': 'Scripting & Automation Skills',      'priority': 'high',   'description': 'Learn Python or Bash scripting to automate common offensive tasks.'},
            {'gap': 'Web Application Attack Techniques',  'priority': 'high',   'description': 'Study OWASP Top 10 and practice on vulnerable web apps.'},
            {'gap': 'OSINT and Reconnaissance Methods',  'priority': 'medium', 'description': 'Practice passive and active reconnaissance methodologies.'},
            {'gap': 'Privilege Escalation Paths',         'priority': 'medium', 'description': 'Study Windows and Linux privilege escalation common vectors.'},
            {'gap': 'Professional Reporting Skills',      'priority': 'low',    'description': 'Learn to write clear, professional penetration test reports.'},
        ],
        'next_steps': [
            'Complete all Offensive Track Tier 0 missions focused on reconnaissance basics.',
            'Practice on CTF (Capture The Flag) challenges on HackTheBox or TryHackMe.',
            'Learn Python scripting for automating port scanning and payload generation.',
            'Study the OWASP Top 10 web vulnerabilities and test each one in a lab environment.',
            'Document every practice exercise to build a personal offensive security playbook.',
        ],
    },
    'grc': {
        'personas': [
            ('The Compliance Seeker',   'GRC Student',            'Beginner'),
            ('The Risk Identifier',     'Junior GRC Analyst',     'Junior'),
            ('The Governance Analyst',  'GRC Specialist',         'Mid-level'),
            ('The Risk Strategist',     'Senior GRC Manager',     'Senior'),
        ],
        'projected_skills': ['Risk Assessment', 'ISO 27001 / NIST Frameworks', 'Policy Writing', 'Audit Methodology', 'Business Impact Analysis', 'Security Governance'],
        'predicted_roles':  ['GRC Analyst', 'Risk Manager', 'Compliance Officer'],
        'gaps': [
            {'gap': 'Regulatory Framework Knowledge',    'priority': 'high',   'description': 'Study ISO 27001, NIST CSF, and GDPR in depth to understand compliance requirements.'},
            {'gap': 'Risk Quantification Methods',       'priority': 'high',   'description': 'Learn FAIR (Factor Analysis of Information Risk) and other risk scoring models.'},
            {'gap': 'Policy and Procedure Writing',      'priority': 'medium', 'description': 'Practice drafting information security policies aligned to business objectives.'},
            {'gap': 'Audit and Assessment Techniques',   'priority': 'medium', 'description': 'Study how to conduct internal security audits and gap assessments.'},
            {'gap': 'Business Impact Analysis (BIA)',    'priority': 'low',    'description': 'Learn how to map security risks to business operations and financial impact.'},
        ],
        'next_steps': [
            'Complete all GRC Track Tier 0 missions covering frameworks and fundamentals.',
            'Download and study the ISO 27001 standard and NIST Cybersecurity Framework.',
            'Practice writing a simple security policy for a fictional company scenario.',
            'Study how risk registers are built and maintained in real organisations.',
            'Connect with GRC professionals in the OCH mentorship programme.',
        ],
    },
    'innovation': {
        'personas': [
            ('The Security Explorer',   'Security Student',       'Beginner'),
            ('The Cloud Defender',      'Cloud Security Analyst', 'Junior'),
            ('The Security Architect',  'Security Engineer',      'Mid-level'),
            ('The Zero Trust Pioneer',  'Principal Security Architect', 'Senior'),
        ],
        'projected_skills': ['Security Architecture', 'Cloud Security (AWS/Azure)', 'Zero Trust Design', 'API Security', 'Security Automation', 'DevSecOps'],
        'predicted_roles':  ['Cloud Security Engineer', 'Security Architect', 'DevSecOps Engineer'],
        'gaps': [
            {'gap': 'Cloud Platform Security Knowledge',  'priority': 'high',   'description': 'Study AWS, Azure, or GCP security services and shared responsibility models.'},
            {'gap': 'API Security Testing',               'priority': 'high',   'description': 'Learn how to test and secure REST APIs against OWASP API Top 10 vulnerabilities.'},
            {'gap': 'Security Architecture Design',       'priority': 'medium', 'description': 'Study design patterns for secure systems including Zero Trust principles.'},
            {'gap': 'DevSecOps Integration',              'priority': 'medium', 'description': 'Learn how to embed security into CI/CD pipelines and development workflows.'},
            {'gap': 'Threat Modelling Techniques',        'priority': 'low',    'description': 'Practice STRIDE or PASTA threat modelling on system designs.'},
        ],
        'next_steps': [
            'Complete all Innovation Track Tier 0 missions focused on cloud and architecture basics.',
            'Get hands-on with AWS Free Tier to experiment with cloud security configurations.',
            'Study the OWASP API Security Top 10 and test against a sample API.',
            'Build a simple DevSecOps pipeline using GitHub Actions with a security scan stage.',
            'Study Zero Trust Architecture principles from NIST SP 800-207.',
        ],
    },
    'leadership': {
        'personas': [
            ('The Security Apprentice',  'Security Student',       'Beginner'),
            ('The Team Coordinator',     'Security Team Lead',     'Junior'),
            ('The Security Manager',     'Security Programme Manager', 'Mid-level'),
            ('The CISO-in-Training',     'Head of Security',       'Senior'),
        ],
        'projected_skills': ['Security Strategy', 'Executive Communication', 'Risk Governance', 'Team Leadership', 'Budget Planning', 'Stakeholder Management'],
        'predicted_roles':  ['Security Manager', 'CISO', 'Head of Information Security'],
        'gaps': [
            {'gap': 'Executive-Level Communication',     'priority': 'high',   'description': 'Practice presenting security risks in business terms to non-technical stakeholders.'},
            {'gap': 'Business-Aligned Security Planning','priority': 'high',   'description': 'Learn to build security roadmaps that directly support business goals.'},
            {'gap': 'Crisis & Incident Leadership',      'priority': 'medium', 'description': 'Study how CISOs lead organisations through major security incidents.'},
            {'gap': 'Security Budget & ROI Justification','priority': 'medium','description': 'Learn how to build security business cases and justify investments.'},
            {'gap': 'Vendor & Third-Party Risk Management','priority': 'low',  'description': 'Study how to evaluate and manage security risks in the supply chain.'},
        ],
        'next_steps': [
            'Complete all Leadership Track Tier 0 missions covering security governance basics.',
            'Read case studies of real security incidents and analyse leadership decisions made.',
            'Practice writing a one-page security briefing for a fictional board of directors.',
            'Study frameworks like COBIT and how they connect security to business governance.',
            'Identify a mentor through the OCH mentorship programme with CISO or senior management experience.',
        ],
    },
}


def _career_level_from_data(missions, avg_score, level, progress):
    """Determine career level badge from activity data."""
    score = missions * 3 + avg_score * 0.2 + progress * 0.3
    if score < 15 or level < 2:
        return 'Beginner'
    if score < 45 or level < 3:
        return 'Junior'
    if score < 100 or level < 5:
        return 'Mid-level'
    return 'Senior'


def _readiness_from_data(missions, avg_score, progress, hours):
    """Calculate readiness % from activity data (mirrors the formula given to GPT)."""
    raw = missions * 3 + avg_score * 0.2 + progress * 0.3 + min(hours * 2, 20)
    return min(int(raw), 95)


def _generate_fallback_insights(student_data):
    """
    Returns structured career insights when GPT is unavailable.
    Uses track-specific templates enriched with the student's real numbers.
    """
    track_code  = (student_data.get('track_code') or 'defender').lower()
    missions    = student_data.get('total_missions_completed', 0)
    avg_score   = student_data.get('average_score', 0)
    hours       = student_data.get('total_time_spent_hours', 0)
    level       = student_data.get('circle_level', 1)
    lessons     = student_data.get('lessons_completed', 0)
    progress    = student_data.get('progress_percentage', 0)

    fallback    = _TRACK_FALLBACK.get(track_code, _TRACK_FALLBACK['defender'])
    career_lvl  = _career_level_from_data(missions, avg_score, level, progress)
    readiness   = _readiness_from_data(missions, avg_score, progress, hours)

    # Pick the persona row matching career level
    level_map   = {'Beginner': 0, 'Junior': 1, 'Mid-level': 2, 'Senior': 3}
    p_name, p_archetype, _ = fallback['personas'][level_map.get(career_lvl, 0)]

    # Build a simple narrative from numbers
    if missions == 0 and lessons == 0:
        narrative = (
            f"You have just enrolled in the {track_code.title()} track at Ongoza CyberHub — welcome. "
            f"Your Future You journey is about to begin. As you complete your first missions and lessons, "
            f"this prediction will sharpen to reflect exactly where you are heading. "
            f"The foundation starts here."
        )
        readiness_explanation = (
            "You are at the very beginning of your journey. "
            "Every mission and lesson you complete will move this score forward."
        )
    else:
        narrative = (
            f"With {missions} mission{'s' if missions != 1 else ''} completed and {round(hours, 1)} hours invested, "
            f"you are steadily building your {track_code.title()} track foundation at Ongoza CyberHub. "
            f"Your average score of {round(avg_score)}% shows {'strong' if avg_score >= 75 else 'developing'} competency. "
            f"Keep this momentum — consistent progress is what transforms a student into a professional."
        )
        readiness_explanation = (
            f"Based on {missions} missions, {round(avg_score)}% average score, "
            f"{round(progress)}% track progress, and {round(hours, 1)} hours invested, "
            f"you are {readiness}% ready for your target career. "
            f"{'Strong start — keep pushing forward.' if readiness >= 40 else 'Every mission you complete moves this score upward.'}"
        )

    return {
        'ai_source': 'fallback',
        'predicted_persona': {
            'name': p_name,
            'archetype': p_archetype,
            'career_vision': narrative,
            'projected_skills': fallback['projected_skills'],
            'estimated_career_level': career_lvl,
            'predicted_roles': fallback['predicted_roles'],
        },
        'career_narrative': narrative,
        'gap_analysis': fallback['gaps'],
        'recommended_next_steps': fallback['next_steps'],
        'readiness_assessment': {
            'percentage': readiness,
            'explanation': readiness_explanation,
        },
        'strengths_analysis': [],  # Cannot derive without real data or profiler
    }

def _generate_career_insights(student_data):
    """
    Call GPT to predict the student's Future-You persona and generate career insights
    based entirely on their actual activity data (track, missions, scores, progress).
    """
    import json
    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed, returning fallback insights")
        return None

    api_key = os.getenv('CHAT_GPT_API_KEY')
    if not api_key or api_key.startswith('your-'):
        logger.warning("No valid CHAT_GPT_API_KEY configured, returning fallback insights")
        return None

    try:
        client = OpenAI(api_key=api_key)

        track_code = student_data.get('track_code') or 'cybersecurity'
        missions   = student_data.get('total_missions_completed', 0)
        avg_score  = student_data.get('average_score', 0)
        hours      = student_data.get('total_time_spent_hours', 0)
        level      = student_data.get('circle_level', 1)
        lessons    = student_data.get('lessons_completed', 0)
        modules    = student_data.get('modules_completed', 0)
        progress   = student_data.get('progress_percentage', 0)
        readiness  = student_data.get('readiness_score', 0)
        skills     = student_data.get('skills_mastered', {})
        weak_areas = student_data.get('weak_areas', [])
        strengths  = student_data.get('strengths', [])
        growth     = student_data.get('areas_for_growth', [])

        prompt = f"""You are a cybersecurity career coach at Ongoza CyberHub (OCH), an elite cybersecurity academy.

Based ONLY on the student's actual activity data below, PREDICT their Future-You persona and provide career insights.
The persona is automatically predicted from their real performance — it is NOT manually created.

STUDENT ACTIVITY DATA:
- Track: {track_code}
- Circle Level: {level}
- Missions Completed: {missions}
- Lessons Completed: {lessons}
- Modules Completed: {modules}
- Average Mission Score: {avg_score}%
- Total Time Invested: {hours} hours
- Track Progress: {progress}%
- Readiness Score: {readiness}%
- Skills Mastered: {json.dumps(skills)}
- Weak Areas: {json.dumps(weak_areas)}
- Known Strengths: {json.dumps(strengths)}
- Growth Areas: {json.dumps(growth)}

Return a single JSON object with EXACTLY these fields:

{{
  "predicted_persona": {{
    "name": "Creative 2-3 word persona title matching their track and stage (e.g. 'The Digital Guardian', 'The Threat Hunter', 'The Security Architect')",
    "archetype": "Short professional role title (e.g. 'Cyber Defender', 'SOC Analyst', 'Penetration Tester', 'GRC Specialist')",
    "career_vision": "2-3 sentences describing who this student will become based on their track and current progress stage",
    "projected_skills": ["5 specific technical skills they will master in this track"],
    "estimated_career_level": "Beginner | Junior | Mid-level | Senior (based on current progress)",
    "predicted_roles": ["3 specific job roles they are heading towards"]
  }},
  "career_narrative": "3-4 sentences personalized narrative about their journey using their actual numbers",
  "gap_analysis": [
    {{"gap": "specific named gap (e.g. 'Hands-on Lab Practice', 'Network Forensics Knowledge')", "priority": "high|medium|low", "description": "specific action to close this gap"}}
  ],
  "recommended_next_steps": ["5 specific actionable steps for this student right now"],
  "readiness_assessment": {{
    "percentage": <integer 0-100 calculated from missions={missions}, avg_score={avg_score}, progress={progress}, hours={hours}>,
    "explanation": "specific explanation referencing their actual numbers"
  }},
  "strengths_analysis": [
    {{"strength": "specific strength name", "career_outcome": "how this leads to a specific career outcome"}}
  ]
}}

Critical rules:
- If missions=0 and lessons=0: persona is 'Beginner/Explorer' stage, career_vision acknowledges they are just starting
- gap_analysis must list SPECIFIC gaps (e.g. 'Incident Response Skills', 'Malware Analysis'), NEVER generic 'Skill Development'
- readiness_assessment.percentage: use formula roughly (missions*3 + avg_score*0.2 + progress*0.3 + min(hours*2,20)), cap at 95
- Return ONLY valid JSON, no markdown, no extra text"""

        response = client.chat.completions.create(
            model=os.getenv("AI_COACH_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are an expert cybersecurity career coach at OCH. Always respond with valid JSON only. Never use generic placeholders like 'Skill Development'."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1600
        )

        content = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if content.startswith('```'):
            content = content.split('\n', 1)[1] if '\n' in content else content[3:]
            if content.endswith('```'):
                content = content[:-3].strip()
            if content.startswith('json\n'):
                content = content[5:]

        return json.loads(content)
    except Exception as e:
        logger.error(f"GPT career insights generation failed: {e}")
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_future_you_insights(request):
    """
    GET /api/v1/profiler/future-you/insights
    Aggregated Future-You page data: persona + analytics + GPT career insights.
    """
    import json
    from django.core.cache import cache

    user = request.user

    # 1. Get profiler session
    session = ProfilerSession.objects.filter(
        user=user,
        status__in=['finished', 'locked']
    ).order_by('-completed_at').first()

    persona = {}
    profiler_data = {
        'overall_score': None,
        'aptitude_score': None,
        'behavioral_score': None,
        'strengths': [],
        'areas_for_growth': [],
        'track_alignment_percentages': {},
        'track_confidence': None,
        'recommended_track': user.track_key,
    }

    if session:
        persona = session.futureyou_persona or {}
        profiler_data['aptitude_score'] = float(session.aptitude_score) if session.aptitude_score else None
        profiler_data['track_confidence'] = float(session.track_confidence) if session.track_confidence else None
        profiler_data['track_alignment_percentages'] = session.track_alignment_percentages or {}

        if session.behavioral_profile:
            profiler_data['strengths'] = session.behavioral_profile.get('strengths', [])
            profiler_data['areas_for_growth'] = session.behavioral_profile.get('areas_for_growth', [])

        try:
            result = session.result
            if result:
                profiler_data['overall_score'] = float(result.overall_score) if result.overall_score else None
                profiler_data['behavioral_score'] = float(result.behavioral_score) if result.behavioral_score else None
                if result.strengths:
                    profiler_data['strengths'] = result.strengths
                if result.areas_for_growth:
                    profiler_data['areas_for_growth'] = result.areas_for_growth
        except ProfilerResult.DoesNotExist:
            pass

    # 2. Get coaching analytics
    analytics_data = {
        'total_missions_completed': 0,
        'average_score': 0,
        'total_time_spent_hours': 0,
        'circle_level': 1,
        'lessons_completed': 0,
        'modules_completed': 0,
        'recipes_completed': 0,
        'posts_count': 0,
        'helpful_votes_received': 0,
    }

    try:
        from coaching.models import StudentAnalytics
        analytics = StudentAnalytics.objects.filter(user=user).first()
        if analytics:
            analytics_data = {
                'total_missions_completed': analytics.total_missions_completed,
                'average_score': float(analytics.average_score),
                'total_time_spent_hours': float(analytics.total_time_spent_hours),
                'circle_level': analytics.circle_level,
                'lessons_completed': analytics.lessons_completed,
                'modules_completed': analytics.modules_completed,
                'recipes_completed': analytics.recipes_completed,
                'posts_count': analytics.posts_count,
                'helpful_votes_received': analytics.helpful_votes_received,
            }
    except Exception as e:
        logger.warning(f"Failed to fetch StudentAnalytics: {e}")

    # 3. Get track progress
    track_data = {
        'readiness_score': 0,
        'progress_percentage': 0,
        'skills_mastered': {},
        'weak_areas': [],
        'average_score': 0,
        'highest_score': 0,
    }

    try:
        from coaching.models import UserTrackProgress
        progress = UserTrackProgress.objects.filter(user=user).first()
        if progress:
            track_data = {
                'readiness_score': progress.readiness_score,
                'progress_percentage': float(progress.progress_percentage),
                'skills_mastered': progress.skills_mastered or {},
                'weak_areas': progress.weak_areas or [],
                'average_score': float(progress.average_score),
                'highest_score': float(progress.highest_score),
            }
    except Exception as e:
        logger.warning(f"Failed to fetch UserTrackProgress: {e}")

    # 4. Career insights — 3-tier resolution:
    #    Tier 1: Fresh GPT call (memory cache 1 hour)
    #    Tier 2: Last GPT response persisted in DB (served as 'db_cache')
    #    Tier 3: Hardcoded track-based fallback (first time ever, no DB row)
    from .models import FutureYouInsightsCache

    cache_key = f"future_you_insights_{user.id}"
    ai_insights = cache.get(cache_key)

    if not ai_insights:
        student_summary = {
            **analytics_data,
            **track_data,
            'track_code': user.track_key,
            'strengths': profiler_data['strengths'],
            'areas_for_growth': profiler_data['areas_for_growth'],
        }

        # Tier 1: Try GPT
        ai_insights = _generate_career_insights(student_summary)
        if ai_insights:
            ai_insights['ai_source'] = 'gpt'
            cache.set(cache_key, ai_insights, timeout=3600)
            # Persist to DB for Tier 2 future use
            try:
                FutureYouInsightsCache.objects.update_or_create(
                    user=user,
                    defaults={
                        'insights': ai_insights,
                        'ai_source': 'gpt',
                        'track_key': user.track_key or '',
                    }
                )
            except Exception as db_err:
                logger.warning(f"Could not persist GPT insights to DB: {db_err}")
        else:
            # Tier 2: Check DB for last saved GPT response
            try:
                db_cache = FutureYouInsightsCache.objects.filter(
                    user=user, ai_source='gpt'
                ).first()
                if db_cache:
                    ai_insights = dict(db_cache.insights)
                    ai_insights['ai_source'] = 'db_cache'
                    cache.set(cache_key, ai_insights, timeout=1800)
                    logger.info(
                        f"Future You: using DB-cached GPT insights for user {user.id} "
                        f"(saved {db_cache.updated_at:%Y-%m-%d %H:%M})"
                    )
            except Exception as db_err:
                logger.warning(f"Could not read Future You DB cache: {db_err}")

            # Tier 3: First-time fallback — no DB row exists yet
            if not ai_insights:
                ai_insights = _generate_fallback_insights(student_summary)
                if ai_insights:
                    cache.set(cache_key, ai_insights, timeout=1800)

    # 5. Resolve final persona:
    #    Use profiler session persona if available, otherwise use GPT-predicted persona
    final_persona = persona if persona else {}
    if not final_persona and ai_insights and ai_insights.get('predicted_persona'):
        final_persona = ai_insights['predicted_persona']
    elif ai_insights and ai_insights.get('predicted_persona'):
        # Merge: keep profiler base but enrich with AI predictions
        final_persona = {
            **ai_insights['predicted_persona'],
            **final_persona,  # profiler fields take precedence
        }

    return Response({
        'persona': final_persona,
        'profiler': profiler_data,
        'analytics': analytics_data,
        'track_progress': track_data,
        'ai_insights': ai_insights,
        'student_name': user.get_full_name() or user.first_name or user.email.split('@')[0],
    })
