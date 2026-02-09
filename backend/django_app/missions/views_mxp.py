"""
MXP Mission Execution Platform API Views
Full implementation of mission workflow
"""
from django.utils import timezone
from django.db.models import Q, Count
from django.db import transaction
from datetime import timedelta
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
    Get mission dashboard with available, in-progress, and completed missions.
    Ensures missions appear progressively from Beginner → Mastery based on Foundations completion.
    """
    user = request.user
    track = request.query_params.get('track', 'defender')
    tier = request.query_params.get('tier', 'beginner')
    
    # CRITICAL: Check Foundations completion - gate missions until Foundations is complete
    if not user.foundations_complete:
        return Response({
            'foundations_required': True,
            'message': 'Please complete Foundations orientation before accessing missions.',
            'foundations_url': '/dashboard/student/foundations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get user's subscription tier
    user_tier = get_user_tier(user)
    
    # Get user's enrollment for track
    enrollment = Enrollment.objects.filter(user=user, status='active').select_related('cohort__track').first()
    
    # Get track_key from enrollment (uses the property that accesses cohort.track.key)
    # This uses the track_key defined by the director when assigning the student to a cohort
    user_track = enrollment.track_key if enrollment and enrollment.track_key else track
    
    # Progressive tier unlocking: Users start with Beginner, unlock higher tiers based on progress
    # Get user's highest completed mission tier
    completed_tiers = []
    completed_missions = MissionProgress.objects.filter(
        user=user,
        status='approved'
    ).select_related('mission')
    
    for progress in completed_missions:
        if progress.mission.tier:
            completed_tiers.append(progress.mission.tier)
    
    # Determine available tiers
    # Beginner always available after Foundations
    available_tiers = ['beginner']
    
    # Unlock Intermediate if user has completed Beginner missions
    beginner_completed = any(t == 'beginner' for t in completed_tiers)
    if beginner_completed:
        available_tiers.append('intermediate')
    
    # Unlock Advanced if user has completed Intermediate missions
    intermediate_completed = any(t == 'intermediate' for t in completed_tiers)
    if intermediate_completed:
        available_tiers.append('advanced')
    
    # Unlock Mastery if user has completed Advanced missions
    advanced_completed = any(t == 'advanced' for t in completed_tiers)
    if advanced_completed:
        available_tiers.append('mastery')
    
    # Filter missions by available tier
    # If requesting a locked tier, only show missions user has access to
    if tier not in available_tiers:
        tier = 'beginner'  # Fallback to beginner if tier is locked
    
    # Get all missions for this track/tier
    all_missions = Mission.objects.filter(
        Q(track=track) | Q(track_id=track),  # Support both track field and track_id
        Q(tier=tier) | Q(mission_type=tier),  # Support both tier field and mission_type
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
    
    # Filter missions by profiler difficulty
    try:
        from missions.services import get_max_mission_difficulty_for_user
        max_difficulty = get_max_mission_difficulty_for_user(user)
        available_missions = [m for m in available_missions if m.difficulty <= max_difficulty]
        # Filter locked missions if they're dicts with mission objects
        filtered_locked = []
        for m in locked_missions:
            if isinstance(m, dict) and 'mission' in m:
                if m['mission'].difficulty <= max_difficulty:
                    filtered_locked.append(m)
            elif hasattr(m, 'difficulty') and m.difficulty <= max_difficulty:
                filtered_locked.append(m)
        locked_missions = filtered_locked
        logger.debug(f"Filtered missions by profiler difficulty: max_difficulty={max_difficulty}")
    except Exception as e:
        logger.warning(f"Failed to apply profiler difficulty filter: {e}")
    
    # Get recommended recipes (from gaps analysis - placeholder)
    recommended_recipes = []  # TODO: Integrate with RecipeEngine
    
    # Get next mission (Profiler-guided - prioritize by difficulty match)
    next_mission = None
    if available_missions:
        # Sort by difficulty ascending (start with easier missions)
        available_missions.sort(key=lambda m: m.difficulty if hasattr(m, 'difficulty') else 999)
        next_mission = available_missions[0].id
    
    # Check tier lock
    tier_lock = False
    if user_tier == 'free' and tier in ['advanced', 'mastery', 'capstone']:
        tier_lock = True
    
    # Tier locking based on progress (in addition to subscription)
    tier_locked_by_progress = tier not in available_tiers
    
    return Response({
        'track': track,
        'tier': tier,
        'available_tiers': available_tiers,
        'tier_locked': tier_lock or tier_locked_by_progress,
        'tier_locked_reason': 'subscription' if tier_lock else ('progress' if tier_locked_by_progress else None),
        'available_missions': [MissionSerializer(m).data for m in available_missions],
        'locked_missions': [
            {
                'mission': MissionSerializer(m['mission']).data if isinstance(m, dict) else MissionSerializer(m).data,
                'gates': m.get('gates', []) if isinstance(m, dict) else [],
                'warnings': m.get('warnings', []) if isinstance(m, dict) else []
            } for m in locked_missions
        ],
        'in_progress': [MissionSerializer(p.mission).data for p in in_progress],
        'completed': [MissionSerializer(p.mission).data for p in completed],
        'recommended_recipes': recommended_recipes,
        'next_mission': str(next_mission) if next_mission else None,
        'foundations_complete': user.foundations_complete,
    }, status=status.HTTP_200_OK) Response({
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
    Start a new mission for the user.
    Ensures Foundations is complete before allowing mission start.
    """
    user = request.user
    
    # CRITICAL: Check Foundations completion
    if not user.foundations_complete:
        return Response({
            'foundations_required': True,
            'message': 'Please complete Foundations orientation before starting missions.',
            'foundations_url': '/dashboard/student/foundations'
        }, status=status.HTTP_403_FORBIDDEN)
    
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
        
        # Calculate deadline if mission has time constraint
        deadline_at = None
        if mission.time_constraint_hours:
            deadline_at = progress.started_at + timedelta(hours=mission.time_constraint_hours)
        
        # Initialize subtasks progress
        if mission.subtasks:
            for idx, subtask in enumerate(mission.subtasks, start=1):
                progress.subtasks_progress[str(idx)] = {
                    'completed': False,
                    'evidence': [],
                    'notes': '',
                }
            progress.save()
    
    # Calculate deadline info if time-bound
    deadline_info = None
    if mission.time_constraint_hours and progress.started_at:
        deadline_at = progress.started_at + timedelta(hours=mission.time_constraint_hours)
        time_remaining = deadline_at - timezone.now()
        deadline_info = {
            'deadline_at': deadline_at.isoformat(),
            'time_remaining_hours': max(0, time_remaining.total_seconds() / 3600),
            'is_expired': time_remaining.total_seconds() <= 0,
            'time_constraint_hours': mission.time_constraint_hours
        }
    
    return Response({
        'progress_id': str(progress.id),
        'status': progress.status,
        'current_subtask': progress.current_subtask,
        'mission': MissionSerializer(mission).data,
        'deadline_info': deadline_info,
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
    subtask_scores = request.data.get('subtask_scores', {})  # Per-subtask scores
    comments = request.data.get('comments', '')
    pass_fail = request.data.get('pass_fail', 'pending')
    next_mission_id = request.data.get('next_mission_id')
    recommended_recipes = request.data.get('recommended_recipes', [])  # Mentor can recommend recipes
    recommended_next_missions = request.data.get('recommended_next_missions', [])  # Alternative field name
    
    with transaction.atomic():
        # Store per-subtask scores if provided
        if subtask_scores:
            progress.subtask_scores = subtask_scores
        
        # Store mentor-recommended recipes
        recipes_to_store = recommended_recipes or recommended_next_missions or []
        if recipes_to_store:
            progress.mentor_recommended_recipes = recipes_to_store
        
        # Calculate overall mentor score (weighted by subtask scores if available)
        if subtask_scores:
            # Use subtask scores if available
            scores_list = [float(s) for s in subtask_scores.values() if s is not None]
            if scores_list:
                mentor_score = sum(scores_list) / len(scores_list)
            else:
                mentor_score = None
        elif score_breakdown:
            # Fallback to score_breakdown
            mentor_score = sum(score_breakdown.values()) / len(score_breakdown)
        else:
            mentor_score = None
        
        progress.mentor_score = mentor_score
        progress.final_status = pass_fail
        progress.status = 'approved' if pass_fail == 'pass' else 'failed'
        
        # Store mentor-recommended recipes
        recipes_to_store = recommended_recipes or recommended_next_missions or []
        if recipes_to_store:
            progress.mentor_recommended_recipes = recipes_to_store
        
        # Sync mission completion to Coaching OS
        portfolio_item = None
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
            
            # Create portfolio item with comprehensive metadata
            import json
            
            # Collect evidence files
            evidence_files = []
            mission_files = MissionFile.objects.filter(mission_progress=progress)
            for mf in mission_files:
                evidence_files.append({
                    'file_url': mf.file_url,
                    'file_name': mf.filename,
                    'file_type': mf.file_type,
                    'subtask_number': mf.subtask_number
                })
            
            # Create portfolio item
            portfolio_item, created = PortfolioItem.objects.get_or_create(
                user=progress.user,
                item_type='mission',
                title=f"Mission: {progress.mission.title}",
                defaults={
                    'summary': progress.mission.description or f"Completed mission: {progress.mission.title}",
                    'status': 'approved' if mentor_score and mentor_score >= 85 else 'draft',
                    'visibility': 'private',
                    'skill_tags': json.dumps(progress.mission.skills_tags or []),
                    'evidence_files': json.dumps(evidence_files),
                }
            )
            
            # If portfolio item already exists, update it
            if not created:
                portfolio_item.status = 'approved' if mentor_score and mentor_score >= 85 else 'draft'
                portfolio_item.evidence_files = json.dumps(evidence_files)
                portfolio_item.save()
            
            # Update TalentScope skill signals
            if progress.mission.skills_tags:
                for skill_tag in progress.mission.skills_tags:
                    SkillSignal.objects.update_or_create(
                        mentee=progress.user,
                        skill_name=skill_tag,
                        defaults={
                            'mastery_level': float(mentor_score) if mentor_score else 50.0,
                            'skill_category': 'technical',
                            'source': 'mission',
                            'last_practiced': timezone.now(),
                        }
                    )
            
            # Refresh dashboard
            DashboardAggregationService.invalidate_cache(progress.user)
            
            logger.info(f"Portfolio item created/updated for mission {progress.mission.id}: {portfolio_item.id}")
        
        progress.mentor_reviewed_at = timezone.now()
        progress.save()
    
    return Response({
        'status': progress.status,
        'final_status': progress.final_status,
        'mentor_score': float(mentor_score) if mentor_score else None,
        'subtask_scores': progress.subtask_scores,
        'recommended_recipes': progress.mentor_recommended_recipes,
        'portfolio_item_id': str(portfolio_item.id) if portfolio_item else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_hints(request, mission_id, subtask_id):
    """
    GET /api/v1/missions/{mission_id}/hints/{subtask_id}
    Get hints for a specific subtask.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id, is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get user's progress
    progress = MissionProgress.objects.filter(user=user, mission=mission).first()
    if not progress:
        return Response({'error': 'Mission not started'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get hints for this subtask
    hints = mission.hints or []
    subtask_hints = [h for h in hints if h.get('subtask_id') == subtask_id]
    
    if not subtask_hints:
        return Response({
            'subtask_id': subtask_id,
            'hints': [],
            'message': 'No hints available for this subtask'
        })
    
    # Track hint usage
    if not progress.hints_used:
        progress.hints_used = []
    
    # Add hint access to tracking (without revealing hint text yet)
    hint_access = {
        'subtask_id': subtask_id,
        'hint_level': subtask_hints[0].get('hint_level', 1),
        'timestamp': timezone.now().isoformat()
    }
    
    # Check if already accessed
    already_accessed = any(
        h.get('subtask_id') == subtask_id 
        for h in progress.hints_used
    )
    
    if not already_accessed:
        progress.hints_used.append(hint_access)
        progress.save()
    
    return Response({
        'subtask_id': subtask_id,
        'hints': subtask_hints,
        'hints_accessed': already_accessed
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_decisions(request, mission_id):
    """
    GET /api/v1/missions/{mission_id}/decisions
    Get available decision points for a mission.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id, is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get user's progress
    progress = MissionProgress.objects.filter(user=user, mission=mission).first()
    if not progress:
        return Response({'error': 'Mission not started'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get branching paths
    branching_paths = mission.branching_paths or {}
    
    # Filter decisions available for current subtask
    current_subtask = progress.current_subtask
    available_decisions = {}
    
    for subtask_id, decision_data in branching_paths.items():
        if int(subtask_id) <= current_subtask:
            available_decisions[subtask_id] = decision_data
    
    # Include user's previous decisions
    user_decisions = progress.decision_paths or {}
    
    return Response({
        'mission_id': str(mission_id),
        'current_subtask': current_subtask,
        'available_decisions': available_decisions,
        'user_decisions': user_decisions
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_decision(request, mission_id, decision_id):
    """
    POST /api/v1/missions/{mission_id}/decisions/{decision_id}/choose
    Record user's decision choice.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id, is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get user's progress
    progress = MissionProgress.objects.filter(user=user, mission=mission).first()
    if not progress:
        return Response({'error': 'Mission not started'}, status=status.HTTP_400_BAD_REQUEST)
    
    choice_id = request.data.get('choice_id')
    if not choice_id:
        return Response({'error': 'choice_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get branching paths
    branching_paths = mission.branching_paths or {}
    
    # Find the decision point
    decision_found = False
    for subtask_id, decision_data in branching_paths.items():
        if decision_data.get('decision_id') == decision_id:
            decision_found = True
            choices = decision_data.get('choices', [])
            consequences = decision_data.get('consequences', {})
            
            # Validate choice
            valid_choices = [c.get('id') for c in choices]
            if choice_id not in valid_choices:
                return Response({
                    'error': 'Invalid choice_id',
                    'valid_choices': valid_choices
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Record decision
            if not progress.decision_paths:
                progress.decision_paths = {}
            
            progress.decision_paths[decision_id] = {
                'choice_id': choice_id,
                'timestamp': timezone.now().isoformat(),
                'subtask_id': int(subtask_id)
            }
            progress.save()
            
            # Return consequence if available
            consequence = consequences.get(choice_id, {})
            
            return Response({
                'success': True,
                'decision_id': decision_id,
                'choice_id': choice_id,
                'consequence': consequence,
                'message': 'Decision recorded successfully'
            })
    
    if not decision_found:
        return Response({'error': 'Decision point not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_time_stage(request, progress_id):
    """
    POST /api/v1/mission-progress/{progress_id}/track-time
    Track time spent on current subtask/stage.
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subtask_id = request.data.get('subtask_id', progress.current_subtask)
    minutes_spent = request.data.get('minutes_spent', 0)
    
    if not progress.time_per_stage:
        progress.time_per_stage = {}
    
    current_time = progress.time_per_stage.get(str(subtask_id), 0)
    progress.time_per_stage[str(subtask_id)] = current_time + minutes_spent
    progress.save()
    
    return Response({
        'success': True,
        'subtask_id': subtask_id,
        'total_minutes': progress.time_per_stage[str(subtask_id)]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_tool_usage(request, progress_id):
    """
    POST /api/v1/mission-progress/{progress_id}/track-tools
    Track tools used during mission.
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    tool_name = request.data.get('tool_name')
    if not tool_name:
        return Response({'error': 'tool_name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not progress.tools_used:
        progress.tools_used = []
    
    if tool_name not in progress.tools_used:
        progress.tools_used.append(tool_name)
        progress.save()
    
    return Response({
        'success': True,
        'tools_used': progress.tools_used
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_reflection(request, progress_id):
    """
    POST /api/v1/mission-progress/{progress_id}/reflection
    Submit mission reflection.
    """
    user = request.user
    
    try:
        progress = MissionProgress.objects.get(id=progress_id, user=user)
    except MissionProgress.DoesNotExist:
        return Response({'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)
    
    reflection_text = request.data.get('reflection', '')
    if not reflection_text:
        return Response({'error': 'reflection text is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    progress.reflection = reflection_text
    progress.reflection_submitted = True
    progress.save()
    
    return Response({
        'success': True,
        'message': 'Reflection submitted successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mission_performance_analytics(request):
    """
    GET /api/v1/missions/analytics/performance
    Mission performance dashboard analytics.
    Returns completion rates, subtask performance, decision paths, drop-off points, etc.
    """
    user = request.user
    
    # Check if user is admin or has analytics permissions
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or user.is_staff
    
    if not is_admin:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get all mission progress data
    from django.db.models import Avg, Count, Q, F
    from django.utils import timezone
    from datetime import timedelta
    
    # Overall statistics
    total_missions = Mission.objects.filter(is_active=True).count()
    total_progress = MissionProgress.objects.count()
    completed_missions = MissionProgress.objects.filter(status='approved').count()
    in_progress = MissionProgress.objects.filter(status__in=['in_progress', 'submitted', 'ai_reviewed', 'mentor_review']).count()
    
    # Completion rate
    completion_rate = (completed_missions / total_progress * 100) if total_progress > 0 else 0
    
    # Average scores
    avg_ai_score = MissionProgress.objects.filter(ai_score__isnull=False).aggregate(
        avg=Avg('ai_score')
    )['avg'] or 0
    
    avg_mentor_score = MissionProgress.objects.filter(mentor_score__isnull=False).aggregate(
        avg=Avg('mentor_score')
    )['avg'] or 0
    
    # Drop-off analysis
    drop_off_data = MissionProgress.objects.filter(
        drop_off_stage__isnull=False
    ).values('drop_off_stage').annotate(
        count=Count('id')
    ).order_by('drop_off_stage')
    
    # Time per stage analysis
    time_analysis = []
    progress_with_time = MissionProgress.objects.filter(
        time_per_stage__isnull=False
    ).exclude(time_per_stage={})
    
    for progress in progress_with_time[:100]:  # Sample first 100
        time_per_stage = progress.time_per_stage or {}
        for subtask_id, minutes in time_per_stage.items():
            time_analysis.append({
                'subtask_id': subtask_id,
                'minutes': minutes
            })
    
    # Decision path analysis
    decision_paths_data = []
    progress_with_decisions = MissionProgress.objects.filter(
        decision_paths__isnull=False
    ).exclude(decision_paths={})
    
    for progress in progress_with_decisions[:100]:  # Sample first 100
        decision_paths = progress.decision_paths or {}
        for decision_id, choice_data in decision_paths.items():
            decision_paths_data.append({
                'decision_id': decision_id,
                'choice_id': choice_data.get('choice_id'),
                'subtask_id': choice_data.get('subtask_id')
            })
    
    # Mission difficulty breakdown
    difficulty_breakdown = Mission.objects.filter(is_active=True).values('difficulty').annotate(
        count=Count('id')
    ).order_by('difficulty')
    
    return Response({
        'overall_stats': {
            'total_missions': total_missions,
            'total_progress_entries': total_progress,
            'completed_missions': completed_missions,
            'in_progress': in_progress,
            'completion_rate': round(completion_rate, 2),
            'avg_ai_score': float(avg_ai_score) if avg_ai_score else None,
            'avg_mentor_score': float(avg_mentor_score) if avg_mentor_score else None,
        },
        'drop_off_analysis': list(drop_off_data),
        'time_analysis': time_analysis[:50],  # Limit response size
        'decision_paths': decision_paths_data[:50],
        'difficulty_breakdown': list(difficulty_breakdown),
        'generated_at': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mission_completion_heatmap(request):
    """
    GET /api/v1/missions/analytics/heatmap
    Mission completion heatmap data.
    Shows completion patterns by mission, tier, track, etc.
    """
    user = request.user
    
    # Check if user is admin
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or user.is_staff
    
    if not is_admin:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count, Q
    
    # Heatmap by mission
    mission_completions = MissionProgress.objects.filter(
        status='approved'
    ).values('mission__title', 'mission__tier', 'mission__track').annotate(
        completions=Count('id')
    ).order_by('-completions')[:50]
    
    # Heatmap by tier
    tier_completions = MissionProgress.objects.filter(
        status='approved'
    ).values('mission__tier').annotate(
        completions=Count('id')
    ).order_by('mission__tier')
    
    # Heatmap by track
    track_completions = MissionProgress.objects.filter(
        status='approved'
    ).values('mission__track').annotate(
        completions=Count('id')
    ).order_by('mission__track')
    
    return Response({
        'mission_heatmap': list(mission_completions),
        'tier_heatmap': list(tier_completions),
        'track_heatmap': list(track_completions),
        'generated_at': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enterprise_mission_analytics(request, cohort_id=None):
    """
    GET /api/v1/missions/analytics/enterprise/{cohort_id}
    Enterprise dashboard mission performance analytics for a specific cohort.
    """
    user = request.user
    
    # Check if user is admin, director, or has enterprise access
    user_roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
    is_admin = 'admin' in user_roles or user.is_staff
    is_director = 'director' in user_roles
    
    if not (is_admin or is_director):
        return Response({'error': 'Admin or Director access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Avg, Count, Q, F
    from programs.models import Enrollment
    
    # Get cohort enrollments
    if cohort_id:
        enrollments = Enrollment.objects.filter(
            cohort_id=cohort_id,
            status='active'
        ).select_related('user')
    else:
        # If no cohort_id, get all enterprise enrollments
        enrollments = Enrollment.objects.filter(
            status='active'
        ).select_related('user')
    
    student_ids = [e.user.id for e in enrollments]
    
    # Mission completion stats for cohort
    cohort_progress = MissionProgress.objects.filter(
        user_id__in=student_ids
    )
    
    total_attempts = cohort_progress.count()
    completed = cohort_progress.filter(status='approved', final_status='pass').count()
    in_progress = cohort_progress.filter(status__in=['in_progress', 'submitted', 'ai_reviewed', 'mentor_review']).count()
    failed = cohort_progress.filter(final_status='fail').count()
    
    completion_rate = (completed / total_attempts * 100) if total_attempts > 0 else 0
    
    # Average scores
    avg_ai_score = cohort_progress.filter(ai_score__isnull=False).aggregate(
        avg=Avg('ai_score')
    )['avg'] or 0
    
    avg_mentor_score = cohort_progress.filter(mentor_score__isnull=False).aggregate(
        avg=Avg('mentor_score')
    )['avg'] or 0
    
    # Mission performance by tier
    tier_performance = cohort_progress.filter(
        status='approved'
    ).values('mission__tier').annotate(
        completions=Count('id'),
        avg_score=Avg('mentor_score')
    ).order_by('mission__tier')
    
    # Mission performance by track
    track_performance = cohort_progress.filter(
        status='approved'
    ).values('mission__track').annotate(
        completions=Count('id'),
        avg_score=Avg('mentor_score')
    ).order_by('mission__track')
    
    # Student-level summary
    student_summaries = []
    for enrollment in enrollments[:50]:  # Limit to first 50 students
        student = enrollment.user
        student_progress = MissionProgress.objects.filter(user=student)
        student_summaries.append({
            'user_id': str(student.id),
            'email': student.email,
            'name': f"{student.first_name} {student.last_name}".strip() or student.email,
            'total_missions': student_progress.count(),
            'completed_missions': student_progress.filter(status='approved', final_status='pass').count(),
            'in_progress': student_progress.filter(status__in=['in_progress', 'submitted', 'ai_reviewed', 'mentor_review']).count(),
            'avg_score': float(student_progress.filter(mentor_score__isnull=False).aggregate(avg=Avg('mentor_score'))['avg'] or 0),
        })
    
    return Response({
        'cohort_id': str(cohort_id) if cohort_id else None,
        'overall_stats': {
            'total_students': len(student_ids),
            'total_attempts': total_attempts,
            'completed': completed,
            'in_progress': in_progress,
            'failed': failed,
            'completion_rate': round(completion_rate, 2),
            'avg_ai_score': float(avg_ai_score) if avg_ai_score else None,
            'avg_mentor_score': float(avg_mentor_score) if avg_mentor_score else None,
        },
        'tier_performance': list(tier_performance),
        'track_performance': list(track_performance),
        'student_summaries': student_summaries,
        'generated_at': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)

