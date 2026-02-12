"""
Student-facing mission API views.
Implements complete MXP specification.
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, F
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from users.models import User
from programs.models import Enrollment
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback
from .serializers import (
    MissionSerializer,
    MissionSubmissionSerializer,
)
from subscriptions.utils import get_user_tier
from subscriptions.models import UserSubscription, SubscriptionPlan
from .tasks import process_mission_ai_review
from student_dashboard.services import DashboardAggregationService
from django.core.cache import cache
from .services import upload_file_to_storage, generate_presigned_upload_url
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_funnel(request):
    """
    GET /api/v1/student/missions/funnel
    Get mission funnel summary with priorities.
    """
    user = request.user
    
    # Cache key
    cache_key = f'mission_funnel:{user.id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data, status=status.HTTP_200_OK)
    
    # Get user's enrollment for track/cohort info
    enrollment = Enrollment.objects.filter(user=user, status='active').first()
    track_name = enrollment.track.name if enrollment and enrollment.track else None
    cohort_name = enrollment.cohort.name if enrollment and enrollment.cohort else None
    
    # Count submissions by status
    submissions = MissionSubmission.objects.filter(student=user)
    
    pending = submissions.filter(status__in=['draft', 'submitted']).count()
    in_progress = submissions.filter(status='draft').count()
    in_ai_review = submissions.filter(status='in_ai_review').count()
    in_mentor_review = submissions.filter(status='in_mentor_review').count()
    approved = submissions.filter(status='approved').count()
    failed = submissions.filter(status='failed').count()
    
    total_reviewed = approved + failed
    approval_rate = (approved / total_reviewed * 100) if total_reviewed > 0 else 0
    
    # Get priorities (urgent/recommended)
    priorities = []
    
    # Urgent: missions with deadlines approaching
    # Note: requirements field doesn't exist in Mission model yet
    # urgent_submissions = submissions.filter(
    #     status__in=['draft', 'submitted'],
    # ).select_related('mission')[:3]
    
    # Recommended: based on AI recommendations from dashboard
    try:
        dashboard_data = DashboardAggregationService.get_dashboard(user.id)
        if dashboard_data and dashboard_data.get('top_recommendation'):
            rec = dashboard_data['top_recommendation']
            if rec.get('mission_id'):
                try:
                    mission = Mission.objects.get(id=rec['mission_id'])
                    if not submissions.filter(assignment__mission=mission, status='approved').exists():
                        priorities.append({
                            'mission_id': str(mission.id),
                            'code': str(mission.id),
                            'title': mission.title,
                            'priority': 'recommended',
                            'ai_hint': rec.get('reason', 'Fills competency gap'),
                        })
                except Mission.DoesNotExist:
                    pass
    except Exception:
        pass
    
    response_data = {
        'funnel': {
            'pending': pending,
            'in_progress': in_progress,
            'in_ai_review': in_ai_review,
            'in_mentor_review': in_mentor_review,
            'approved': approved,
            'failed': failed,
            'approval_rate': round(approval_rate, 1),
        },
        'track_name': track_name,
        'cohort_name': cohort_name,
        'priorities': priorities[:5],
    }
    
    # Cache for 30 seconds
    cache.set(cache_key, response_data, 30)
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_student_missions(request):
    """
    GET /api/v1/student/missions
    List missions with filters (status, difficulty, track, search).
    """
    user = request.user

    # Check entitlement (mentors bypass subscription checks)
    # Gracefully handle missing subscription system
    tier = 'professional'  # Default to full access if subscription system not set up
    try:
        if not user.is_mentor:
            tier = get_user_tier(user)
            if tier == 'free':
                return Response({
                    'error': 'Missions require Starter 3 or higher subscription',
                    'upgrade_required': True
                }, status=status.HTTP_403_FORBIDDEN)

        # Check starter3_normal limits (5 submissions/month) - mentors bypass this check
        if not user.is_mentor and tier in ['starter_3', 'starter_normal']:
            try:
                subscription = UserSubscription.objects.filter(user=user, status='active').first()
                if subscription and subscription.plan:
                    plan_name = subscription.plan.name.lower()
                    if 'normal' in plan_name or (plan_name == 'starter_3' and not getattr(subscription.plan, 'max_missions_monthly', None)):
                        max_missions = getattr(subscription.plan, 'max_missions_monthly', 5)
                        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        month_submissions = MissionSubmission.objects.filter(
                            student=user,
                            submitted_at__gte=month_start
                        ).count()
                        if month_submissions >= max_missions:
                            return Response({
                                'error': f'Monthly limit of {max_missions} missions reached. Upgrade for unlimited.',
                                'upgrade_required': True,
                                'limit_reached': True
                            }, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                pass
    except Exception as e:
        # Subscription system not available - allow access for development
        logger.warning(f"Subscription check failed (table may not exist): {e}")
        tier = 'professional'
    
    # Get filters
    status_filter = request.query_params.get('status', 'all')
    difficulty_filter = request.query_params.get('difficulty', 'all')
    track_filter = request.query_params.get('track', 'all')
    tier_filter = request.query_params.get('tier', 'all')
    search = request.query_params.get('search', '').strip()
    recommended = request.query_params.get('recommended', 'false').lower() == 'true'
    urgent = request.query_params.get('urgent', 'false').lower() == 'true'

    # Base queryset - only active missions
    missions = Mission.objects.filter(is_active=True)

    # Apply profiler-based difficulty filtering if no explicit filter
    if difficulty_filter == 'all':
        try:
            from missions.services import get_max_mission_difficulty_for_user
            max_difficulty = get_max_mission_difficulty_for_user(user)
            missions = missions.filter(difficulty__lte=max_difficulty)
            logger.debug(f"Filtered missions by profiler difficulty for user {user.id}: max_difficulty={max_difficulty}")
        except Exception as e:
            logger.warning(f"Failed to apply profiler difficulty filter for user {user.id}: {e}", exc_info=True)
            # Fallback: show beginner missions only
            missions = missions.filter(difficulty=1)
    else:
        # Apply explicit difficulty filter
        missions = missions.filter(difficulty=difficulty_filter)

    if track_filter != 'all':
        missions = missions.filter(track__isnull=False, track=track_filter)

    if tier_filter != 'all':
        missions = missions.filter(tier__isnull=False, tier=tier_filter)
    
    if search:
        missions = missions.filter(
            Q(title__icontains=search) |
            Q(code__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Get user submissions to add status
    user_submissions = {
        str(sub.assignment.mission_id): sub
        for sub in MissionSubmission.objects.filter(student=user).select_related('assignment__mission')
    }
    
    # Filter by status if needed (before pagination)
    if status_filter != 'all':
        mission_ids_by_status = []
        for mission in missions:
            submission = user_submissions.get(str(mission.id))
            mission_status = submission.status if submission else 'not_started'
            if mission_status == status_filter:
                mission_ids_by_status.append(mission.id)
        missions = missions.filter(id__in=mission_ids_by_status)
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    offset = (page - 1) * page_size
    
    total_count = missions.count()
    missions_page = missions[offset:offset + page_size]
    
    # Get student's track (simplified)
    from programs.models import Enrollment
    try:
        enrollment = Enrollment.objects.filter(user=user, status='active').select_related('cohort').first()
        student_track = enrollment.cohort.track_key if enrollment and hasattr(enrollment.cohort, 'track_key') else None
    except Exception:
        student_track = None
    
    # Build response with submission status
    results = []
    for mission in missions_page:
        submission = user_submissions.get(str(mission.id))
        
        # Simplified locking: just lock if track doesn't match
        is_locked = False
        lock_reason = None
        
        if student_track and mission.track_id and mission.track_id != student_track:
            is_locked = True
            track_names = {
                'defender': 'Defender',
                'offensive': 'Offensive',
                'grc': 'GRC',
                'innovation': 'Innovation',
                'leadership': 'Leadership',
            }
            lock_reason = f"This mission is for {track_names.get(mission.track_id, mission.track_id)} track."
        
        mission_data = {
            'id': str(mission.id),
            'code': str(mission.id),
            'title': mission.title,
            'description': mission.description,
            'difficulty': mission.difficulty,
            'type': mission.mission_type,
            'estimated_time_minutes': mission.estimated_duration_min,
            'competency_tags': mission.skills_tags or [],
            'track_key': mission.track_id,
            'track': mission.track,
            'tier': mission.tier,
            'requirements': {},
            'is_locked': is_locked,
            'lock_reason': lock_reason,
        }
        
        if submission:
            mission_data['status'] = submission.status
            mission_data['progress_percent'] = 0

            # Get AI score from AIFeedback if exists
            try:
                ai_feedback_obj = AIFeedback.objects.filter(submission=submission).first()
                mission_data['ai_score'] = float(ai_feedback_obj.score) if ai_feedback_obj and ai_feedback_obj.score else None

                # AI feedback summary
                if ai_feedback_obj:
                    mission_data['ai_feedback'] = {
                        'score': float(ai_feedback_obj.score) if ai_feedback_obj.score else None,
                        'strengths': ai_feedback_obj.strengths[:3] if ai_feedback_obj.strengths else [],
                        'gaps': ai_feedback_obj.improvements[:3] if ai_feedback_obj.improvements else [],
                    }
            except Exception:
                mission_data['ai_score'] = None

            mission_data['submission_id'] = str(submission.id)

            # Count artifacts
            from missions.models import MissionArtifact
            artifacts = MissionArtifact.objects.filter(submission=submission)
            mission_data['artifacts_uploaded'] = artifacts.count()
            mission_data['artifacts_required'] = 0  # requirements field doesn't exist yet
        else:
            mission_data['status'] = 'not_started'
            mission_data['progress_percent'] = 0
        
        results.append(mission_data)
    
    return Response({
        'results': results,
        'count': len(results),
        'total': total_count,
        'page': page,
        'page_size': page_size,
        'has_next': offset + page_size < total_count,
        'has_previous': page > 1,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_detail(request, mission_id):
    """
    GET /api/v1/student/missions/:mission_id
    Get full mission details with submission state.
    """
    user = request.user

    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)

    # Import MissionAssignment
    from .models import MissionAssignment

    # Get or create assignment for this mission and student
    assignment, assignment_created = MissionAssignment.objects.get_or_create(
        mission=mission,
        student=user,
        assignment_type='individual',
        defaults={'status': 'assigned'}
    )

    # Get or create submission for this assignment (get latest if multiple exist)
    submission = MissionSubmission.objects.filter(
        assignment=assignment,
        student=user
    ).order_by('-created_at').first()

    if not submission:
        submission = MissionSubmission.objects.create(
            assignment=assignment,
            student=user,
            status='draft',
            content=''
        )

    # Get artifacts
    artifacts = MissionArtifact.objects.filter(submission=submission)

    # Get AI feedback
    ai_feedback = None
    try:
        ai_feedback_obj = AIFeedback.objects.filter(submission=submission).first()
        if ai_feedback_obj:
            ai_feedback = {
                'score': float(ai_feedback_obj.score) if ai_feedback_obj.score else None,
                'strengths': ai_feedback_obj.strengths,
                'gaps': ai_feedback_obj.gaps,
                'suggestions': ai_feedback_obj.suggestions,
                'improvements': ai_feedback_obj.improvements,  # Legacy field
                'feedback_text': ai_feedback_obj.feedback_text,
                'feedback_date': ai_feedback_obj.generated_at.isoformat(),
            }
    except Exception:
        # AI feedback doesn't exist for this submission
        pass

    # Get mentor review (if exists)
    mentor_review = None
    if submission.reviewed_at:
        mentor_review = {
            'status': 'approved' if submission.status == 'approved' else 'changes_requested' if submission.status == 'needs_revision' else 'waiting',
            'decision': 'pass' if submission.status == 'approved' else 'fail' if submission.status == 'rejected' else None,
            'comments': submission.feedback,
            'reviewed_at': submission.reviewed_at.isoformat(),
        }

    # Build response
    response_data = {
        'id': str(mission.id),
        'code': str(mission.id),
        'title': mission.title,
        'description': mission.description,
        'brief': mission.description,  # Use description as brief for now
        'objectives': mission.subtasks or [],  # Return subtasks as objectives
        'subtasks': mission.subtasks or [],  # Also include as subtasks for compatibility
        'difficulty': mission.difficulty,
        'type': mission.mission_type,
        'estimated_time_minutes': mission.estimated_duration_min,
        'competency_tags': mission.skills_tags or [],
        'track_key': mission.track_id,
        'track': mission.track,
        'tier': mission.tier,
        'requirements': {},
        'status': submission.status,
        'submission': {
            'id': str(submission.id),
            'notes': submission.content,
            'file_urls': [a.file_url for a in artifacts if a.file_type == 'document'],
            'github_url': next((a.file_url for a in artifacts if 'github' in a.file_name.lower()), None),
            'notebook_url': next((a.file_url for a in artifacts if a.file_type == 'code'), None),
            'video_url': next((a.file_url for a in artifacts if a.file_type == 'video'), None),
        },
        'artifacts': [
            {
                'id': str(a.id),
                'type': a.file_type,
                'url': a.file_url,
                'filename': a.file_name,
            }
            for a in artifacts
        ],
        'ai_feedback': ai_feedback,
        'mentor_review': mentor_review,
        'portfolio_linked': False,  # portfolio_item_id doesn't exist in model
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def submit_mission_for_ai(request, mission_id):
    """
    POST /api/v1/student/missions/:mission_id/submit
    Submit mission for AI review.
    """
    user = request.user

    # Check entitlement (gracefully handle missing subscription system)
    tier = 'professional'  # Default to full access if subscription system not set up
    try:
        tier = get_user_tier(user)
        if tier == 'free':
            return Response({
                'error': 'AI feedback requires Starter 3 or higher subscription',
                'upgrade_required': True
            }, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        # Subscription system not available - allow access for development
        logger.warning(f"Subscription check failed (table may not exist): {e}")
        tier = 'professional'

    # Check starter3_normal limits
    if tier in ['starter_3', 'starter_normal']:
        try:
            subscription = UserSubscription.objects.filter(user=user, status='active').first()
            if subscription and subscription.plan:
                plan_name = subscription.plan.name.lower()
                if 'normal' in plan_name or (plan_name == 'starter_3' and not getattr(subscription.plan, 'max_missions_monthly', None)):
                    max_missions = getattr(subscription.plan, 'max_missions_monthly', 5)
                    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    month_submissions = MissionSubmission.objects.filter(
                        student=user,
                        submitted_at__gte=month_start
                    ).count()
                    if month_submissions >= max_missions:
                        return Response({
                            'error': f'Monthly limit of {max_missions} missions reached. Upgrade for unlimited.',
                            'upgrade_required': True,
                            'limit_reached': True
                        }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass
    
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)

    # Import MissionAssignment
    from .models import MissionAssignment

    # Get or create assignment for this mission and student
    assignment, _ = MissionAssignment.objects.get_or_create(
        mission=mission,
        student=user,
        assignment_type='individual',
        defaults={'status': 'assigned'}
    )

    # Get or create submission (get latest if multiple exist)
    submission = MissionSubmission.objects.filter(
        assignment=assignment,
        student=user
    ).order_by('-created_at').first()

    if not submission:
        submission = MissionSubmission.objects.create(
            assignment=assignment,
            student=user,
            status='draft',
            content=''
        )

    # Update content (notes)
    if 'notes' in request.data:
        submission.content = request.data['notes']
    
    # Handle file uploads
    files = request.FILES.getlist('files', [])
    
    for file in files:
        try:
            # Upload to S3 or local storage
            file_url = upload_file_to_storage(file, str(submission.id))
            
            # Create artifact
            MissionArtifact.objects.create(
                submission=submission,
                file_type='document',
                file_url=file_url,
                file_name=file.name,
                file_size=file.size,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"File upload error: {e}")
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Handle URLs
    if 'github_url' in request.data and request.data['github_url']:
        MissionArtifact.objects.create(
            submission=submission,
            file_type='code',
            file_url=request.data['github_url'],
            file_name='github_link',
        )

    if 'notebook_url' in request.data and request.data['notebook_url']:
        MissionArtifact.objects.create(
            submission=submission,
            file_type='code',
            file_url=request.data['notebook_url'],
            file_name='notebook_link',
        )

    if 'video_url' in request.data and request.data['video_url']:
        MissionArtifact.objects.create(
            submission=submission,
            file_type='video',
            file_url=request.data['video_url'],
            file_name='video_link',
        )
    
    # Update submission status
    submission.status = 'submitted'
    submission.submitted_at = timezone.now()
    submission.save()
    
    # Trigger AI review (with fallback)
    try:
        from .tasks import process_mission_ai_review
        # Try Celery first
        if hasattr(process_mission_ai_review, 'delay'):
            process_mission_ai_review.delay(str(submission.id))
        else:
            # Run synchronously if Celery not available
            import threading
            thread = threading.Thread(target=process_mission_ai_review, args=(str(submission.id),))
            thread.start()
    except Exception as e:
        logger.warning(f"AI review task failed: {e}")
        # Run AI review directly as fallback
        try:
            from .tasks import process_mission_ai_review
            process_mission_ai_review(str(submission.id))
        except Exception as e2:
            logger.error(f"Direct AI review also failed: {e2}")
    
    # Invalidate cache
    cache_key = f'mission_funnel:{user.id}'
    cache.delete(cache_key)
    
    # Queue dashboard update
    try:
        DashboardAggregationService.queue_update(user, 'mission_submitted', 'high')
    except Exception as e:
        logger.warning(f"Dashboard update failed: {e}")

    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_mission_artifacts(request, submission_id):
    """
    POST /api/v1/student/missions/submissions/:submission_id/artifacts
    Upload artifacts (files, links) to existing submission.
    """
    user = request.user

    try:
        submission = MissionSubmission.objects.get(id=submission_id, student=user)
    except MissionSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if submission.status == 'approved':
        return Response({'error': 'Cannot modify approved submission'}, status=status.HTTP_400_BAD_REQUEST)
    
    artifacts = []
    
    # Handle file uploads
    files = request.FILES.getlist('files', [])
    for file in files:
        try:
            # Upload to S3 or local storage
            file_url = upload_file_to_storage(file, str(submission.id))
            
            artifact = MissionArtifact.objects.create(
                submission=submission,
                file_type='document',
                file_url=file_url,
                file_name=file.name,
                file_size=file.size,
            )
            artifacts.append(artifact)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"File upload error: {e}")
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Handle URLs
    if 'github_url' in request.data and request.data['github_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            file_type='code',
            file_url=request.data['github_url'],
            file_name='github_link',
        )
        artifacts.append(artifact)

    if 'notebook_url' in request.data and request.data['notebook_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            file_type='code',
            file_url=request.data['notebook_url'],
            file_name='notebook_link',
        )
        artifacts.append(artifact)

    if 'video_url' in request.data and request.data['video_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            file_type='video',
            file_url=request.data['video_url'],
            file_name='video_link',
        )
        artifacts.append(artifact)

    return Response({
        'artifacts': [
            {
                'id': str(a.id),
                'type': a.file_type,
                'url': a.file_url,
                'filename': a.file_name,
            }
            for a in artifacts
        ]
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def save_mission_draft(request, mission_id):
    """
    POST /api/v1/student/missions/:mission_id/draft
    Save mission submission as draft.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)

    # Import MissionAssignment
    from .models import MissionAssignment

    # Get or create assignment for this mission and student
    assignment, _ = MissionAssignment.objects.get_or_create(
        mission=mission,
        student=user,
        assignment_type='individual',
        defaults={'status': 'assigned'}
    )

    submission, created = MissionSubmission.objects.get_or_create(
        assignment=assignment,
        student=user,
        defaults={'status': 'draft', 'content': ''}
    )

    if 'notes' in request.data:
        submission.content = request.data['notes']

    submission.status = 'draft'
    submission.save()
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def submit_for_mentor_review(request, submission_id):
    """
    POST /api/v1/student/missions/submissions/:submission_id/submit-mentor
    Submit for mentor review (7-tier only).
    """
    user = request.user
    
    # Check entitlement
    tier = get_user_tier(user)
    if tier != 'professional_7':
        return Response({
            'error': 'Mentor review requires Professional 7 subscription',
            'upgrade_required': True
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        submission = MissionSubmission.objects.get(id=submission_id, student=user)
    except MissionSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

    if submission.status != 'ai_reviewed' and submission.status != 'in_ai_review':
        return Response({
            'error': 'Submission must be AI reviewed before mentor review'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    submission.status = 'in_mentor_review'
    submission.save()
    
    # Invalidate cache
    cache_key = f'mission_funnel:{user.id}'
    cache.delete(cache_key)
    
    # Create mentor work queue item
    try:
        from mentorship_coordination.tasks import create_mission_review_queue_item
        from mentorship_coordination.models import MenteeMentorAssignment
        
        assignment = MenteeMentorAssignment.objects.filter(
            mentee=user,
            status='active'
        ).first()
        
        if assignment:
            create_mission_review_queue_item.delay(
                str(submission.id),
                str(assignment.mentor.id)
            )
    except Exception:
        pass
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_mission_student(request, mission_id):
    """
    POST /api/v1/student/missions/{id}/start
    Start a mission for the authenticated student.
    """
    from .models_mxp import MissionProgress
    
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id, is_active=True)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
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
            'message': 'Mission already started'
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

        # Initialize subtasks progress (if subtasks field exists in future)
        # Note: Mission model doesn't have subtasks field yet
        # if hasattr(mission, 'subtasks') and mission.subtasks:
        #     for idx, subtask in enumerate(mission.subtasks, start=1):
        #         progress.subtasks_progress[str(idx)] = {
        #             'completed': False,
        #             'evidence': [],
        #             'notes': '',
        #         }
        #     progress.save()

        return Response({
            'progress_id': str(progress.id),
            'status': progress.status,
            'current_subtask': progress.current_subtask,
            'message': 'Mission started successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_mission_progress(request, mission_id):
    """
    GET/PATCH /api/v1/student/missions/{id}/progress
    Get or update mission progress for execution interface.
    """
    from .models_mxp import MissionProgress
    
    user = request.user
    
    try:
        progress = MissionProgress.objects.select_related('mission').get(
            user=user,
            mission_id=mission_id
        )
    except MissionProgress.DoesNotExist:
        return Response(
            {'error': 'Mission progress not found. Please start the mission first.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # Return progress with mission details
        return Response({
            'id': str(progress.id),
            'mission': {
                'id': str(progress.mission.id),
                'code': str(progress.mission.id),
                'title': progress.mission.title,
                'description': progress.mission.description,
                'difficulty': progress.mission.difficulty,
                'track_key': progress.mission.track_id,
                'estimated_duration_minutes': progress.mission.estimated_duration_min,
                'objectives': progress.mission.subtasks or [],
                'subtasks': progress.mission.subtasks or [],
            },
            'status': progress.status,
            'progress_percent': 0,  # calculate_progress_percent function doesn't exist
            'current_subtask_index': progress.current_subtask - 1,  # Convert to 0-indexed
            'time_spent_minutes': 0,  # calculate_time_spent function doesn't exist
            'started_at': progress.started_at.isoformat() if progress.started_at else None,
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Update progress
        data = request.data
        
        if 'current_subtask_index' in data:
            progress.current_subtask = data['current_subtask_index'] + 1  # Convert to 1-indexed
        
        if 'notes' in data:
            # Store notes in subtasks_progress
            subtask_key = str(progress.current_subtask)
            if subtask_key not in progress.subtasks_progress:
                progress.subtasks_progress[subtask_key] = {}
            progress.subtasks_progress[subtask_key]['notes'] = data['notes']
        
        if 'status' in data and data['status'] in ['in_progress', 'paused']:
            progress.status = data['status']
        
        progress.save()
        
        return Response({'success': True}, status=status.HTTP_200_OK)


def calculate_progress_percent(progress):
    """Calculate progress percentage based on completed subtasks."""
    if not progress.mission.subtasks:
        return 0
    
    total = len(progress.mission.subtasks)
    completed = sum(
        1 for key, val in progress.subtasks_progress.items()
        if isinstance(val, dict) and val.get('completed', False)
    )
    
    return int((completed / total) * 100) if total > 0 else 0


def calculate_time_spent(progress):
    """Calculate time spent on mission in minutes."""
    if not progress.started_at:
        return 0
    
    if progress.submitted_at:
        delta = progress.submitted_at - progress.started_at
    else:
        delta = timezone.now() - progress.started_at
    
    return int(delta.total_seconds() / 60)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_subtask(request, mission_id, subtask_index):
    """
    POST /api/v1/student/missions/{id}/subtasks/{index}/complete
    Mark a subtask as complete and move to next.
    """
    from .models_mxp import MissionProgress
    
    user = request.user
    
    try:
        progress = MissionProgress.objects.select_related('mission').get(
            user=user,
            mission_id=mission_id
        )
    except MissionProgress.DoesNotExist:
        return Response(
            {'error': 'Mission progress not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate subtask index
    subtasks = progress.mission.subtasks or []
    if subtask_index >= len(subtasks):
        return Response(
            {'error': 'Invalid subtask index'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark subtask as complete
    subtask_key = str(subtask_index + 1)  # Convert to 1-indexed
    if subtask_key not in progress.subtasks_progress:
        progress.subtasks_progress[subtask_key] = {}
    
    progress.subtasks_progress[subtask_key]['completed'] = True
    progress.subtasks_progress[subtask_key]['completed_at'] = timezone.now().isoformat()
    
    if 'notes' in request.data:
        progress.subtasks_progress[subtask_key]['notes'] = request.data['notes']
    
    # Move to next subtask or mark as ready for submission
    if subtask_index < len(subtasks) - 1:
        progress.current_subtask = subtask_index + 2  # Move to next (1-indexed)
        progress.save()
        return Response({
            'success': True,
            'next_subtask_index': subtask_index + 1
        }, status=status.HTTP_200_OK)
    else:
        # All subtasks complete
        progress.current_subtask = len(subtasks)
        progress.save()
        return Response({
            'success': True,
            'all_complete': True,
            'message': 'All subtasks completed! Ready to submit mission.'
        }, status=status.HTTP_200_OK)
