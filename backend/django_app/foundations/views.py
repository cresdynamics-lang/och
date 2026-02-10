"""
Tier 1 Foundations API views.
Handles Foundations modules, progress tracking, and completion.
"""
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction

from .models import FoundationsModule, FoundationsProgress
from .assessment_questions import FOUNDATIONS_ASSESSMENT_QUESTIONS, calculate_assessment_score
from users.models import User

logger = logging.getLogger(__name__)


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
        
        # Track Profiler → Foundations transition timestamp
        try:
            from profiler.models import ProfilerSession
            # Get the most recent completed profiler session
            profiler_session = ProfilerSession.objects.filter(
                user=user,
                status__in=['finished', 'locked']
            ).order_by('-completed_at').first()
            
            if profiler_session:
                profiler_session.foundations_transition_at = timezone.now()
                profiler_session.save()
                logger.info(f"Tracked foundations transition for user {user.id}, session {profiler_session.id}")
        except Exception as e:
            logger.warning(f"Failed to track foundations transition: {e}")
    
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
        'total_time_spent_minutes': progress.total_time_spent_minutes,
        'interactions': progress.interactions or {},
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_module(request, module_id):
    """
    POST /api/v1/foundations/modules/{module_id}/complete
    Mark a Foundations module as completed.
    Also tracks interaction data and updates time spent.
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
    
    # Track interaction data if provided
    interaction_data = request.data.get('interaction', None)
    if interaction_data:
        if not progress.interactions:
            progress.interactions = {}
        progress.interactions[interaction_data.get('type', 'unknown')] = {
            'viewed': True,
            'time_spent_seconds': interaction_data.get('timeSpent', 0),
            'completed_at': timezone.now().isoformat()
        }
    
    # Update time spent if provided
    time_spent = request.data.get('time_spent_seconds', 0)
    if time_spent > 0:
        progress.total_time_spent_minutes += int(time_spent / 60)
    
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
        'status': progress.status,
        'total_time_spent_minutes': progress.total_time_spent_minutes
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_module_progress(request, module_id):
    """
    POST /api/v1/foundations/modules/{module_id}/progress
    Update progress for a module (e.g., video watch percentage).
    Also tracks interaction data and time spent.
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
    
    # Track interaction data if provided
    interaction_data = request.data.get('interaction', None)
    if interaction_data:
        if not progress.interactions:
            progress.interactions = {}
        progress.interactions[interaction_data.get('type', 'unknown')] = {
            'viewed': True,
            'time_spent_seconds': interaction_data.get('timeSpent', 0),
            'last_viewed_at': timezone.now().isoformat()
        }
    
    # Update time spent
    time_spent = request.data.get('time_spent_seconds', 0)
    if time_spent > 0:
        progress.total_time_spent_minutes += int(time_spent / 60)
    
    progress.modules_completed[str(module.id)] = module_data
    progress.last_accessed_module_id = module.id
    progress.save()
    
    return Response({
        'success': True,
        'watch_percentage': module_data['watch_percentage'],
        'total_time_spent_minutes': progress.total_time_spent_minutes
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_drop_off(request):
    """
    POST /api/v1/foundations/track-drop-off
    Track when user drops off from Foundations (leaves without completing).
    Used for analytics and onboarding optimization.
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    module_id = request.data.get('module_id')
    if module_id:
        try:
            module = FoundationsModule.objects.get(id=module_id, is_active=True)
            progress.drop_off_module_id = module.id
            progress.last_accessed_module_id = module.id
            logger.info(f"Tracked drop-off for user {user.id} at module {module.title} (ID: {module.id})")
        except FoundationsModule.DoesNotExist:
            logger.warning(f"Drop-off tracking: Module {module_id} not found")
    
    progress.save()
    
    return Response({
        'success': True,
        'message': 'Drop-off tracked successfully'
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
        
        # Create first portfolio entry from Foundations reflection
        try:
            from dashboard.models import PortfolioItem
            import json
            
            # Combine value statement and goals reflection for portfolio entry
            portfolio_summary_parts = []
            if progress.value_statement:
                portfolio_summary_parts.append(f"Value Statement: {progress.value_statement}")
            if progress.goals_reflection:
                portfolio_summary_parts.append(f"\n\nGoals & Reflection: {progress.goals_reflection}")
            
            portfolio_summary = "\n".join(portfolio_summary_parts) if portfolio_summary_parts else "Foundations orientation completed."
            
            # Check if portfolio entry already exists (avoid duplicates)
            existing_entry = PortfolioItem.objects.filter(
                user=user,
                item_type='reflection',
                title='Foundations: My Goals & Value Statement'
            ).first()
            
            if not existing_entry:
                PortfolioItem.objects.create(
                    user=user,
                    title='Foundations: My Goals & Value Statement',
                    summary=portfolio_summary,
                    item_type='reflection',
                    status='approved',  # Auto-approve Foundations reflection
                    visibility='private',  # Start as private, user can change later
                    skill_tags=json.dumps([]),
                    evidence_files=json.dumps([]),
                )
                logger.info(f"Created Foundations portfolio entry for user {user.id}")
        except Exception as e:
            logger.error(f"Failed to create portfolio entry for Foundations completion: {e}", exc_info=True)
            # Don't fail the entire completion if portfolio creation fails
    
    return Response({
        'success': True,
        'message': 'Foundations completed successfully. You can now access Tier 2 tracks.',
        'confirmed_track_key': progress.confirmed_track_key,
        'transitioned_at': progress.transitioned_to_tier2_at.isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_feedback(request):
    """
    POST /api/v1/foundations/feedback
    Submit user feedback after Foundations completion.
    Used to track clarity about OCH's structure (>90% positive feedback metric).
    """
    user = request.user
    
    if not user.profiling_complete:
        return Response(
            {'detail': 'Profiling must be completed first'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    progress, _ = FoundationsProgress.objects.get_or_create(user=user)
    
    # Only allow feedback if Foundations is complete
    if not progress.is_complete():
        return Response(
            {'detail': 'Foundations must be completed before submitting feedback'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    clarity_rating = request.data.get('clarity_rating')  # 1-5 scale
    feedback_text = request.data.get('feedback_text', '')
    would_recommend = request.data.get('would_recommend', None)  # boolean
    
    if not clarity_rating:
        return Response(
            {'detail': 'clarity_rating is required (1-5 scale)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Store feedback in interactions JSON field
    if not progress.interactions:
        progress.interactions = {}
    
    progress.interactions['completion_feedback'] = {
        'clarity_rating': int(clarity_rating),
        'feedback_text': feedback_text,
        'would_recommend': would_recommend,
        'submitted_at': timezone.now().isoformat()
    }
    
    progress.save()
    
    logger.info(f"Foundations feedback submitted by user {user.id}: clarity={clarity_rating}, recommend={would_recommend}")
    
    return Response({
        'success': True,
        'message': 'Feedback submitted successfully. Thank you!'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_enterprise_readiness(request, cohort_id):
    """
    POST /api/v1/foundations/enterprise/{cohort_id}/foundations-readiness
    Sync Foundations completion status for enterprise cohort members.
    Used by Enterprise Dashboard to track onboarding readiness.
    """
    user = request.user
    
    # Check if user has permission to sync enterprise data
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or user.is_staff
    is_director = False
    
    # Check if user is a director of a program that includes this cohort
    try:
        from programs.models import Cohort
        cohort = Cohort.objects.get(id=cohort_id)
        if cohort.track and cohort.track.director_id == user.uuid_id:
            is_director = True
    except Cohort.DoesNotExist:
        return Response(
            {'error': 'Cohort not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not (is_admin or is_director):
        return Response(
            {'error': 'Permission denied. Admin or director access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all enrollments in this cohort
    try:
        from programs.models import Enrollment
        enrollments = Enrollment.objects.filter(
            cohort_id=cohort_id,
            status__in=['active', 'pending']
        ).select_related('user')
        
        readiness_data = []
        for enrollment in enrollments:
            student = enrollment.user
            progress = FoundationsProgress.objects.filter(user=student).first()
            
            readiness_data.append({
                'user_id': str(student.id),
                'email': student.email,
                'name': f"{student.first_name} {student.last_name}".strip() or student.email,
                'foundations_complete': progress.is_complete() if progress else False,
                'foundations_status': progress.status if progress else 'not_started',
                'completion_percentage': float(progress.completion_percentage) if progress else 0.0,
                'started_at': progress.started_at.isoformat() if progress and progress.started_at else None,
                'completed_at': progress.completed_at.isoformat() if progress and progress.completed_at else None,
                'drop_off_module_id': str(progress.drop_off_module_id) if progress and progress.drop_off_module_id else None,
                'last_accessed_module_id': str(progress.last_accessed_module_id) if progress and progress.last_accessed_module_id else None,
            })
        
        logger.info(f"Synced Foundations readiness for cohort {cohort_id}: {len(readiness_data)} students")
        
        return Response({
            'success': True,
            'cohort_id': str(cohort_id),
            'cohort_name': cohort.name,
            'total_students': len(readiness_data),
            'foundations_complete_count': sum(1 for r in readiness_data if r['foundations_complete']),
            'readiness_data': readiness_data,
            'synced_at': timezone.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to sync Foundations readiness for cohort {cohort_id}: {e}", exc_info=True)
        return Response(
            {'error': f'Failed to sync readiness data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
