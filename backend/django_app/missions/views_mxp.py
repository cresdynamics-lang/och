"""
MXP Mission Execution Platform API Views
Full implementation of mission workflow
"""
from django.utils import timezone
from django.db.models import Q, Count
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from users.models import User
from programs.models import Enrollment
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback
from .models_mxp import MissionProgress, MissionFile
from .serializers import MissionSerializer, MissionSubmissionSerializer
from subscriptions.utils import get_user_tier, require_tier
from subscriptions.models import UserSubscription
from .tasks import process_mission_ai_review
from student_dashboard.services import DashboardAggregationService
from dashboard.models import PortfolioItem
from talentscope.models import SkillSignal
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mission_dashboard(request):
    """
    GET /api/v1/missions/dashboard?track={track}&tier={tier}
    Get mission dashboard with available, in-progress, and completed missions
    """
    user = request.user
    track = request.query_params.get('track', 'defender')
    tier = request.query_params.get('tier', 'beginner')
    
    # Get user's subscription tier
    user_tier = get_user_tier(user)
    
    # Get user's enrollment for track
    enrollment = Enrollment.objects.filter(user=user, status='active').select_related('cohort__track').first()
    
    # Get track_key from enrollment (uses the property that accesses cohort.track.key)
    # This uses the track_key defined by the director when assigning the student to a cohort
    user_track = enrollment.track_key if enrollment and enrollment.track_key else track
    
    # Get all missions for this track/tier
    all_missions = Mission.objects.filter(
        track=track,
        tier=tier,
        is_active=True
    )
    
    # Check coaching eligibility
    coaching_eligibility = None
    available_missions = []
    locked_missions = []
    
    try:
        from coaching.integrations import check_mission_eligibility
        coaching_eligibility = check_mission_eligibility(user)
        
        for mission in all_missions:
            # Check if already in progress
            existing = MissionProgress.objects.filter(
                user=user,
                mission=mission,
                status__in=['in_progress', 'submitted', 'approved', 'failed']
            ).exists()
            
            if existing:
                continue
            
            if coaching_eligibility['eligible']:
                available_missions.append(mission)
            else:
                locked_missions.append({
                    'mission': mission,
                    'gates': coaching_eligibility['gates'],
                    'warnings': coaching_eligibility['warnings']
                })
    except ImportError:
        # Fallback if coaching not available
        available_missions = all_missions.exclude(
            id__in=MissionProgress.objects.filter(
                user=user,
                status__in=['in_progress', 'submitted', 'approved', 'failed']
            ).values_list('mission_id', flat=True)
        )
    
    # Get in-progress missions
    in_progress = MissionProgress.objects.filter(
        user=user,
        status__in=['in_progress', 'submitted', 'ai_reviewed', 'mentor_review']
    ).select_related('mission')
    
    # Get completed missions
    completed = MissionProgress.objects.filter(
        user=user,
        final_status__in=['pass', 'fail']
    ).select_related('mission').order_by('-submitted_at')[:10]
    
    # Get recommended recipes (from gaps analysis - placeholder)
    recommended_recipes = []  # TODO: Integrate with RecipeEngine
    
    # Get next mission (Profiler-guided - placeholder)
    next_mission = None
    if available_missions:
        next_mission = available_missions[0].id
    
    # Check tier lock
    tier_lock = False
    if user_tier == 'free' and tier in ['advanced', 'mastery', 'capstone']:
        tier_lock = True
    
    return Response({
        'available_missions': MissionSerializer(available_missions, many=True).data,
        'locked_missions': [
            {
                'mission': MissionSerializer(item['mission']).data,
                'gates': item['gates'],
                'warnings': item['warnings']
            } for item in locked_missions
        ],
        'in_progress_missions': [
            {
                'id': str(progress.id),
                'mission': MissionSerializer(progress.mission).data,
                'status': progress.status,
                'current_subtask': progress.current_subtask,
                'progress_percentage': len([s for s in progress.subtasks_progress.values() if s.get('completed')]) / len(progress.subtasks_progress) * 100 if progress.subtasks_progress else 0,
            }
            for progress in in_progress
        ],
        'completed_missions': [
            {
                'id': str(progress.id),
                'mission': MissionSerializer(progress.mission).data,
                'final_status': progress.final_status,
                'ai_score': float(progress.ai_score) if progress.ai_score else None,
                'mentor_score': float(progress.mentor_score) if progress.mentor_score else None,
                'submitted_at': progress.submitted_at.isoformat() if progress.submitted_at else None,
            }
            for progress in completed
        ],
        'recommended_recipes': recommended_recipes,
        'next_mission': str(next_mission) if next_mission else None,
        'tier_lock': tier_lock,
        'user_tier': user_tier,
        'coaching_eligibility': coaching_eligibility,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_mission(request, mission_id):
    """
    POST /api/v1/missions/{id}/start
    Start a new mission for the user
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id, is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Coaching OS Gatekeeping: Check mission eligibility
    try:
        from coaching.integrations import check_mission_eligibility
        eligibility = check_mission_eligibility(user, mission_id)
        if not eligibility['eligible']:
            return Response(
                {
                    'error': 'Mission locked by coaching requirements',
                    'gate': 'coaching',
                    'gates': eligibility['gates'],
                    'warnings': eligibility['warnings'],
                    'coachingScore': eligibility['coachingScore'],
                },
                status=status.HTTP_403_FORBIDDEN
            )
    except ImportError:
        logger.warning("Coaching integrations not available, skipping gatekeeping")
    
    # Check if mission already in progress
    existing_progress = MissionProgress.objects.filter(
        user=user,
        mission=mission,
        status__in=['in_progress', 'submitted', 'ai_reviewed', 'mentor_review']
    ).first()
    
    if existing_progress:
        return Response({
            'progress_id': str(existing_progress.id),
            'status': existing_progress.status,
            'current_subtask': existing_progress.current_subtask,
        }, status=status.HTTP_200_OK)
    
    # Create new progress entry
    with transaction.atomic():
        progress = MissionProgress.objects.create(
            user=user,
            mission=mission,
            status='in_progress',
            current_subtask=1,
            subtasks_progress={},
            started_at=timezone.now()
        )
        
        # Initialize subtasks progress
        if mission.subtasks:
            for idx, subtask in enumerate(mission.subtasks, start=1):
                progress.subtasks_progress[str(idx)] = {
                    'completed': False,
                    'evidence': [],
                    'notes': '',
                }
            progress.save()
    
    return Response({
        'progress_id': str(progress.id),
        'status': progress.status,
        'current_subtask': progress.current_subtask,
        'mission': MissionSerializer(mission).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def save_subtask_progress(request, progress_id):
    """
    PATCH /api/v1/mission-progress/{id}
    Save subtask progress with evidence
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subtask_number = request.data.get('subtask_number')
    evidence = request.data.get('evidence', [])
    notes = request.data.get('notes', '')
    
    if not subtask_number:
        return Response({'error': 'subtask_number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update subtask progress
    subtask_key = str(subtask_number)
    if subtask_key not in progress.subtasks_progress:
        progress.subtasks_progress[subtask_key] = {'completed': False, 'evidence': [], 'notes': ''}
    
    progress.subtasks_progress[subtask_key]['completed'] = True
    progress.subtasks_progress[subtask_key]['evidence'] = evidence
    progress.subtasks_progress[subtask_key]['notes'] = notes
    
    # Update current subtask if needed
    if subtask_number > progress.current_subtask:
        progress.current_subtask = subtask_number
    
    progress.save()
    
    return Response({
        'status': 'saved',
        'current_subtask': progress.current_subtask,
        'subtasks_progress': progress.subtasks_progress,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_mission_file(request, progress_id):
    """
    POST /api/v1/mission-progress/{id}/files
    Upload evidence file for a subtask
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subtask_number = int(request.data.get('subtask_number', 1))
    file = request.FILES.get('file')
    
    if not file:
        return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # TODO: Upload to S3 and get URL
    # For now, placeholder
    file_url = f'/media/missions/{progress_id}/{file.name}'
    
    # Create MissionFile record
    mission_file = MissionFile.objects.create(
        mission_progress=progress,
        subtask_number=subtask_number,
        file_url=file_url,
        file_type=file.content_type or 'other',
        filename=file.name,
        file_size=file.size,
        metadata={'content_type': file.content_type}
    )
    
    # Update subtask progress
    subtask_key = str(subtask_number)
    if subtask_key not in progress.subtasks_progress:
        progress.subtasks_progress[subtask_key] = {'completed': False, 'evidence': [], 'notes': ''}
    
    if file_url not in progress.subtasks_progress[subtask_key]['evidence']:
        progress.subtasks_progress[subtask_key]['evidence'].append(file_url)
    
    progress.save()
    
    return Response({
        'file_id': str(mission_file.id),
        'file_url': file_url,
        'subtask_number': subtask_number,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_mission(request, progress_id):
    """
    POST /api/v1/mission-progress/{id}/submit
    Submit complete mission for review
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if progress.status not in ['in_progress']:
        return Response({'error': 'Mission already submitted'}, status=status.HTTP_400_BAD_REQUEST)
    
    reflection = request.data.get('reflection', '')
    final_evidence_bundle = request.data.get('final_evidence_bundle', [])
    
    with transaction.atomic():
        progress.status = 'submitted'
        progress.submitted_at = timezone.now()
        progress.reflection = reflection
        progress.save()
        
        # Trigger AI review (async)
        # Note: process_mission_ai_review expects MissionSubmission, but we're using MissionProgress
        # For now, create a MissionSubmission if it doesn't exist, or update the task to handle MissionProgress
        from .models import MissionSubmission
        submission, created = MissionSubmission.objects.get_or_create(
            mission=progress.mission,
            user=progress.user,
            defaults={'status': 'submitted', 'submitted_at': timezone.now()}
        )
        if not created:
            submission.status = 'submitted'
            submission.submitted_at = timezone.now()
            submission.save()
        process_mission_ai_review.delay(str(submission.id))
        
        # Update progress status after submission is created
        progress.status = 'submitted'
        progress.save()
    
    return Response({
        'status': 'submitted',
        'progress_id': str(progress.id),
        'next_status': 'ai_reviewed',  # Will be updated by async task
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_review(request, progress_id):
    """
    GET /api/v1/mission-progress/{id}/ai-review
    Get AI review results
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if progress.status != 'ai_reviewed':
        return Response({
            'status': progress.status,
            'message': 'AI review not yet completed'
        }, status=status.HTTP_200_OK)
    
    # Get AI feedback if available
    ai_feedback = None
    if hasattr(progress, 'ai_feedback_detail'):
        ai_feedback = {
            'score': float(progress.ai_score) if progress.ai_score else None,
            'strengths': progress.ai_feedback_detail.strengths,
            'gaps': progress.ai_feedback_detail.gaps,
            'suggestions': progress.ai_feedback_detail.suggestions,
            'competencies_detected': progress.ai_feedback_detail.competencies_detected,
        }
    
    return Response({
        'status': progress.status,
        'ai_score': float(progress.ai_score) if progress.ai_score else None,
        'ai_feedback': ai_feedback,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_tier(['$7-premium'])
def submit_for_mentor_review(request, progress_id):
    """
    POST /api/v1/mission-progress/{id}/mentor-review
    Submit for mentor review (Premium only)
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if progress.status != 'ai_reviewed':
        return Response({'error': 'Mission must be AI reviewed first'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        progress.status = 'mentor_review'
        progress.save()
    
    return Response({
        'status': 'mentor_review',
        'message': 'Mission submitted for mentor review',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_tier(['$7-premium'])
def mentor_review_submission(request, progress_id):
    """
    POST /api/v1/mission-progress/{id}/mentor-review/complete
    Mentor completes review (Premium only, mentor role)
    """
    # TODO: Check if user is mentor
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    score_breakdown = request.data.get('score_breakdown', {})
    comments = request.data.get('comments', '')
    pass_fail = request.data.get('pass_fail', 'pending')
    next_mission_id = request.data.get('next_mission_id')
    
    with transaction.atomic():
        # Calculate overall mentor score
        if score_breakdown:
            mentor_score = sum(score_breakdown.values()) / len(score_breakdown)
        else:
            mentor_score = None
        
        progress.mentor_score = mentor_score
        progress.final_status = pass_fail
        progress.status = 'approved' if pass_fail == 'pass' else 'failed'
        
        # Sync mission completion to Coaching OS
        if pass_fail == 'pass':
            try:
                from coaching.integrations import sync_mission_to_coaching
                score = float(progress.ai_score) if progress.ai_score else 80.0
                sync_mission_to_coaching(
                    user=user,
                    mission_id=str(progress.mission.id),
                    mission_title=progress.mission.title,
                    score=score
                )
            except Exception as e:
                logger.error(f"Failed to sync mission to coaching: {e}")
        progress.mentor_reviewed_at = timezone.now()
        progress.save()
        
        # If approved, trigger portfolio and TalentScope updates
        if pass_fail == 'pass':
            # Create portfolio item
            portfolio_item = PortfolioItem.objects.create(
                user=progress.user,
                title=f"Mission: {progress.mission.title}",
                status='approved',
            )
            
            # Update TalentScope skill signals
            if progress.mission.competencies:
                for competency in progress.mission.competencies:
                    SkillSignal.objects.update_or_create(
                        mentee=progress.user,
                        skill_name=competency,
                        defaults={
                            'mastery_level': 50.0,
                            'skill_category': 'technical',
                            'source': 'mission',
                            'last_practiced': timezone.now(),
                        }
                    )
            
            # Refresh dashboard
            DashboardAggregationService.invalidate_cache(progress.user)
    
    return Response({
        'status': progress.status,
        'final_status': progress.final_status,
        'mentor_score': float(mentor_score) if mentor_score else None,
    })

