"""
API views for Missions MXP.
"""
import uuid
from django.utils import timezone
from django.db.models import Count, Q
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Mission, MissionSubmission, MissionArtifact
from .serializers import (
    MissionSerializer,
    MissionSubmissionSerializer,
    SubmitMissionSerializer,
    MissionStatusSerializer,
)
from student_dashboard.services import DashboardAggregationService
from missions.tasks import process_mission_ai_review
from subscriptions.utils import require_tier, get_user_tier


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommended_missions(request):
    """
    GET /api/v1/missions/recommended?limit=3
    Get recommended missions for user.
    """
    limit = int(request.query_params.get('limit', 3))
    
    # Get user's track from profiler or default
    user_track_id = None
    if hasattr(request.user, 'profiler_sessions'):
        session = request.user.profiler_sessions.filter(
            status__in=['future_you_complete', 'finished']
        ).first()
        if session and session.recommended_track_id:
            user_track_id = session.recommended_track_id
    
    # Get missions (filter by track if available)
    missions = Mission.objects.all()
    if user_track_id:
        missions = missions.filter(track_id=user_track_id)
    
    missions = missions.order_by('difficulty', 'created_at')[:limit]
    
    serializer = MissionSerializer(missions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_mission(request, mission_id):
    """
    POST /api/v1/missions/{mission_id}/submit
    Submit mission with files.
    """
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response(
            {'error': 'Mission not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    
    # Check tier limits
    user_tier = get_user_tier(user.id)
    if user_tier and user_tier != 'premium':
        # Check monthly mission limit
        from subscriptions.models import UserSubscription
        try:
            subscription = user.subscription
            if subscription.plan.max_missions_monthly:
                month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
                month_submissions = MissionSubmission.objects.filter(
                    user=user,
                    submitted_at__gte=month_start
                ).count()
                if month_submissions >= subscription.plan.max_missions_monthly:
                    return Response(
                        {'error': 'Monthly mission limit reached. Upgrade to premium for unlimited.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except UserSubscription.DoesNotExist:
            pass
    
    # Get or create submission
    submission, created = MissionSubmission.objects.get_or_create(
        mission=mission,
        user=user,
        status='draft',
        defaults={'notes': request.data.get('notes', '')}
    )
    
    if not created:
        submission.notes = request.data.get('notes', submission.notes)
        submission.save()
    
    # Handle file uploads
    files = request.FILES.getlist('files', [])
    max_file_size = 10 * 1024 * 1024  # 10MB
    
    for file in files:
        if file.size > max_file_size:
            return Response(
                {'error': f'File {file.name} exceeds 10MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save file (in production, upload to S3)
        import os
        from django.conf import settings
        upload_dir = settings.MEDIA_ROOT / 'missions' / str(submission.id)
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = upload_dir / file.name
        with open(file_path, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)
        
        # Create file record
        MissionArtifact.objects.create(
            submission=submission,
            kind='file',
            url=f'/media/missions/{submission.id}/{file.name}',
            filename=file.name,
            size_bytes=file.size,
            metadata={'content_type': file.content_type or 'application/octet-stream'}
        )
    
    # Update submission status
    submission.status = 'submitted'
    submission.submitted_at = timezone.now()
    submission.save()
    
    # Trigger AI review
    process_mission_ai_review.delay(str(submission.id))
    
    # Trigger mentor work queue item creation (if mentor assigned)
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
    except Exception as e:
        # Graceful failure if mentorship_coordination not available
        import logging
        logging.getLogger(__name__).warning(f"Failed to create mentor work queue item: {e}")
    
    # Trigger dashboard refresh
    DashboardAggregationService.queue_update(user, 'mission_submitted', 'high')
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mission_status(request):
    """
    GET /api/v1/missions/status
    Get user's mission status summary.
    """
    user = request.user
    
    in_progress = MissionSubmission.objects.filter(
        user=user,
        status__in=['draft', 'submitted', 'ai_reviewed']
    ).count()
    
    in_review = MissionSubmission.objects.filter(
        user=user,
        status='mentor_review'
    ).count()
    
    completed_total = MissionSubmission.objects.filter(
        user=user,
        status='approved'
    ).count()
    
    # Get next recommended mission
    next_recommended = None
    recommended = get_recommended_missions(request._request if hasattr(request, '_request') else request)
    if recommended.status_code == 200 and recommended.data:
        next_recommended = recommended.data[0]
    
    return Response({
        'in_progress': in_progress,
        'in_review': in_review,
        'completed_total': completed_total,
        'next_recommended': next_recommended,
    }, status=status.HTTP_200_OK)
