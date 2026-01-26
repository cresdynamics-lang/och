"""
Tier 1 Foundations API views.
Handles Foundations modules, progress tracking, and completion.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction

from .models import FoundationsModule, FoundationsProgress
from .assessment_questions import FOUNDATIONS_ASSESSMENT_QUESTIONS, calculate_assessment_score
from users.models import User


def _get_missing_requirements(progress):
    """Helper function to identify what's missing for Foundations completion."""
    missing = []
    
    # Check mandatory modules
    mandatory_modules = FoundationsModule.objects.filter(is_mandatory=True, is_active=True)
    for module in mandatory_modules:
        module_data = progress.modules_completed.get(str(module.id), {})
        if not module_data.get('completed', False):
            missing.append(f"Module: {module.title}")
    
    # Check assessment
    assessment_modules = FoundationsModule.objects.filter(
        module_type='assessment',
        is_mandatory=True,
        is_active=True
    )
    if assessment_modules.exists() and progress.assessment_score is None:
        missing.append("Assessment")
    
    # Check reflection
    reflection_modules = FoundationsModule.objects.filter(
        module_type='reflection',
        is_mandatory=True,
        is_active=True
    )
    if reflection_modules.exists() and not progress.goals_reflection:
        missing.append("Reflection")
    
    # Check track confirmation
    if not progress.confirmed_track_key:
        missing.append("Track Confirmation")
    
    return missing


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_foundations_status(request):
    """
    GET /api/v1/foundations/status
    Get user's Foundations completion status and progress.
    """
    user = request.user
    
    # Check if profiling is complete (prerequisite)
    if not user.profiling_complete:
        return Response({
            'foundations_available': False,
            'reason': 'profiling_incomplete',
            'message': 'Please complete the AI profiler first'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get or create Foundations progress
    progress, created = FoundationsProgress.objects.get_or_create(
        user=user,
        defaults={'status': 'not_started'}
    )
    
    if created:
        progress.started_at = timezone.now()
        progress.save()
    
    # Calculate completion
    progress.calculate_completion()
    
    # Get all modules
    modules = FoundationsModule.objects.filter(is_active=True).order_by('order')
    modules_data = []
    for module in modules:
        module_progress = progress.modules_completed.get(str(module.id), {})
        modules_data.append({
            'id': str(module.id),
            'title': module.title,
            'description': module.description,
            'module_type': module.module_type,
            'video_url': module.video_url,
            'diagram_url': module.diagram_url,
            'content': module.content,
            'order': module.order,
            'is_mandatory': module.is_mandatory,
            'estimated_minutes': module.estimated_minutes,
            'completed': module_progress.get('completed', False),
            'watch_percentage': module_progress.get('watch_percentage', 0),
            'completed_at': module_progress.get('completed_at'),
        })
    
    return Response({
        'foundations_available': True,
        'status': progress.status,
        'completion_percentage': float(progress.completion_percentage),
        'is_complete': progress.is_complete(),
        'modules': modules_data,
        'assessment_score': float(progress.assessment_score) if progress.assessment_score else None,
        'goals_reflection': progress.goals_reflection,
        'confirmed_track_key': progress.confirmed_track_key,
        'started_at': progress.started_at.isoformat() if progress.started_at else None,
        'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_module(request, module_id):
    """
    POST /api/v1/foundations/modules/{module_id}/complete
    Mark a Foundations module as completed.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        module = FoundationsModule.objects.get(id=module_id, is_active=True)
    except FoundationsModule.DoesNotExist:
        return Response(
            {'detail': 'Module not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    # Update module completion
    module_data = progress.modules_completed.get(str(module.id), {})
    module_data['completed'] = True
    module_data['watch_percentage'] = request.data.get('watch_percentage', 100)
    module_data['completed_at'] = timezone.now().isoformat()
    
    progress.modules_completed[str(module.id)] = module_data
    progress.last_accessed_module_id = module.id
    
    # Update status
    if progress.status == 'not_started':
        progress.status = 'in_progress'
        if not progress.started_at:
            progress.started_at = timezone.now()
    
    # Recalculate completion
    progress.calculate_completion()
    
    # Check if all mandatory modules are complete
    if progress.is_complete():
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        user.foundations_complete = True
        user.foundations_completed_at = timezone.now()
        user.save()
    
    progress.save()
    
    return Response({
        'success': True,
        'completion_percentage': float(progress.completion_percentage),
        'is_complete': progress.is_complete(),
        'status': progress.status
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_module_progress(request, module_id):
    """
    POST /api/v1/foundations/modules/{module_id}/progress
    Update progress for a module (e.g., video watch percentage).
    """
    user = request.user
    
    try:
        module = FoundationsModule.objects.get(id=module_id, is_active=True)
    except FoundationsModule.DoesNotExist:
        return Response(
            {'detail': 'Module not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    # Update progress data
    module_data = progress.modules_completed.get(str(module.id), {})
    watch_percentage = request.data.get('watch_percentage', 0)
    module_data['watch_percentage'] = min(100, max(0, watch_percentage))
    
    progress.modules_completed[str(module.id)] = module_data
    progress.last_accessed_module_id = module.id
    progress.save()
    
    return Response({
        'success': True,
        'watch_percentage': module_data['watch_percentage']
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assessment_questions(request):
    """
    GET /api/v1/foundations/assessment/questions
    Get Foundations orientation assessment questions.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Return questions without correct answers (for security)
    questions_data = []
    for question in FOUNDATIONS_ASSESSMENT_QUESTIONS:
        question_data = {
            'id': question['id'],
            'question': question['question'],
            'options': [
                {
                    'value': opt['value'],
                    'text': opt['text']
                }
                for opt in question['options']
            ]
        }
        questions_data.append(question_data)
    
    return Response({
        'questions': questions_data,
        'total_questions': len(questions_data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assessment(request):
    """
    POST /api/v1/foundations/assessment
    Submit Foundations orientation assessment.
    Calculates score from answers automatically.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    answers = request.data.get('answers', {})
    
    if not answers:
        return Response(
            {'detail': 'Answers are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate score from answers
    score_percentage, detailed_results = calculate_assessment_score(answers)
    
    progress.assessment_score = score_percentage
    progress.assessment_attempts += 1
    
    # Mark assessment module as completed (find the assessment module and mark it)
    assessment_modules = FoundationsModule.objects.filter(
        module_type='assessment',
        is_mandatory=True,
        is_active=True
    )
    for module in assessment_modules:
        module_data = progress.modules_completed.get(str(module.id), {})
        module_data['completed'] = True
        module_data['score'] = score_percentage
        module_data['answers'] = answers
        module_data['detailed_results'] = detailed_results
        module_data['completed_at'] = timezone.now().isoformat()
        progress.modules_completed[str(module.id)] = module_data
    
    # Also store in 'assessment' key for backward compatibility
    progress.modules_completed['assessment'] = {
        'completed': True,
        'score': score_percentage,
        'answers': answers,
        'detailed_results': detailed_results,
        'completed_at': timezone.now().isoformat()
    }
    
    # Recalculate completion
    progress.calculate_completion()
    is_complete = progress.is_complete()
    
    if is_complete:
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        user.foundations_complete = True
        user.foundations_completed_at = timezone.now()
        user.save()
    
    progress.save()
    
    return Response({
        'success': True,
        'score': score_percentage,
        'total_questions': len(FOUNDATIONS_ASSESSMENT_QUESTIONS),
        'correct_answers': sum(1 for r in detailed_results.values() if r['correct']),
        'detailed_results': detailed_results,
        'completion_percentage': float(progress.completion_percentage),
        'is_complete': is_complete,
        'missing_requirements': _get_missing_requirements(progress) if not is_complete else []
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_reflection(request):
    """
    POST /api/v1/foundations/reflection
    Submit goals reflection and value statement.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    goals_reflection = request.data.get('goals_reflection', '')
    value_statement = request.data.get('value_statement', '')
    
    if goals_reflection:
        progress.goals_reflection = goals_reflection
    
    if value_statement:
        progress.value_statement = value_statement
    
    # Mark reflection module as complete
    reflection_modules = FoundationsModule.objects.filter(
        module_type='reflection',
        is_mandatory=True,
        is_active=True
    )
    for module in reflection_modules:
        module_data = progress.modules_completed.get(str(module.id), {})
        module_data['completed'] = True
        module_data['completed_at'] = timezone.now().isoformat()
        progress.modules_completed[str(module.id)] = module_data
    
    # Recalculate completion
    progress.calculate_completion()
    if progress.is_complete():
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        user.foundations_complete = True
        user.foundations_completed_at = timezone.now()
        user.save()
    
    progress.save()
    
    return Response({
        'success': True,
        'completion_percentage': float(progress.completion_percentage),
        'is_complete': progress.is_complete()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_track(request):
    """
    POST /api/v1/foundations/confirm-track
    Confirm or override track selection from profiler.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    track_key = request.data.get('track_key')
    is_override = request.data.get('is_override', False)
    
    if not track_key:
        return Response(
            {'detail': 'track_key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    progress.confirmed_track_key = track_key
    progress.track_override = is_override
    progress.save()
    
    return Response({
        'success': True,
        'confirmed_track_key': track_key,
        'is_override': is_override
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_foundations(request):
    """
    POST /api/v1/foundations/complete
    Finalize Foundations completion and transition to Tier 2.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    # Verify all requirements are met
    if not progress.is_complete():
        return Response(
            {'detail': 'All mandatory modules must be completed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark as complete and transition
    with transaction.atomic():
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        progress.transitioned_to_tier2_at = timezone.now()
        progress.save()
        
        user.foundations_complete = True
        user.foundations_completed_at = timezone.now()
        user.save()
    
    return Response({
        'success': True,
        'message': 'Foundations completed successfully. You can now access Tier 2 tracks.',
        'confirmed_track_key': progress.confirmed_track_key,
        'transitioned_at': progress.transitioned_to_tier2_at.isoformat()
    })
