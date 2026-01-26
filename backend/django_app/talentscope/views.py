"""
API views for TalentScope analytics.
"""
from datetime import datetime, timedelta
from django.db.models import Avg, Count, Sum, Q, F, Max
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from .models import SkillSignal, BehaviorSignal, MentorInfluence, ReadinessSnapshot
from .serializers import (
    ReadinessOverTimeSerializer,
    SkillHeatmapSerializer,
    SkillMasterySerializer,
    BehavioralTrendSerializer,
    ReadinessWindowSerializer,
    ReadinessSnapshotSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def readiness_over_time(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/readiness-over-time
    Get readiness scores over time.
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions - user can only view their own data unless they're analyst/admin
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter parameters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    track_id = request.query_params.get('track_id')
    
    # Query readiness snapshots
    snapshots = ReadinessSnapshot.objects.filter(mentee=mentee)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            snapshots = snapshots.filter(snapshot_date__gte=start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            snapshots = snapshots.filter(snapshot_date__lte=end)
        except ValueError:
            pass
    
    # Group by date and get average score
    readiness_data = snapshots.values('snapshot_date').annotate(
        score=Avg('core_readiness_score')
    ).order_by('snapshot_date')
    
    result = [
        {
            'date': item['snapshot_date'].strftime('%Y-%m-%d'),
            'score': float(item['score']),
            'category': 'overall'
        }
        for item in readiness_data
    ]
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skills_heatmap(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/skills-heatmap
    Get skills heatmap data.
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter parameters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    skill_category = request.query_params.get('skill_category')
    
    # Query skill signals
    skills = SkillSignal.objects.filter(mentee=mentee)
    
    if skill_category:
        skills = skills.filter(skill_category=skill_category)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            skills = skills.filter(created_at__gte=start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            skills = skills.filter(created_at__lte=end)
        except ValueError:
            pass
    
    # Get latest mastery level for each skill
    latest_skills = skills.values('skill_name', 'skill_category').annotate(
        mastery_level=Avg('mastery_level'),
        last_practiced=Max('last_practiced')
    ).order_by('-mastery_level')
    
    result = [
        {
            'skill_name': item['skill_name'],
            'category': item['skill_category'],
            'mastery_level': float(item['mastery_level']),
            'last_practiced': item['last_practiced'].isoformat() if item['last_practiced'] else None
        }
        for item in latest_skills
    ]
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_mastery(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/skills
    Get skill mastery by category.
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    category = request.query_params.get('category')
    
    # Query skill signals
    skills = SkillSignal.objects.filter(mentee=mentee)
    
    if category:
        skills = skills.filter(skill_category=category)
    
    # Aggregate by skill
    skill_data = skills.values('skill_name', 'skill_category').annotate(
        mastery_percentage=Avg('mastery_level'),
        hours_practiced=Sum('hours_practiced'),
        last_updated=Max('updated_at')
    ).order_by('-mastery_percentage')
    
    result = []
    for item in skill_data:
        # Generate a deterministic UUID from skill name for consistency
        import hashlib
        skill_id = hashlib.md5(f"{mentee_id}-{item['skill_name']}".encode()).hexdigest()
        result.append({
            'skill_id': skill_id,
            'skill_name': item['skill_name'],
            'category': item['skill_category'],
            'mastery_percentage': float(item['mastery_percentage']),
            'hours_practiced': float(item['hours_practiced'] or 0),
            'last_updated': item['last_updated'].isoformat() if item['last_updated'] else None
        })
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def behavioral_trends(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/behavioral-trends
    Get behavioral trends over time.
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter parameters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Query behavior signals
    behaviors = BehaviorSignal.objects.filter(mentee=mentee)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            behaviors = behaviors.filter(recorded_at__gte=start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            behaviors = behaviors.filter(recorded_at__lte=end)
        except ValueError:
            pass
    
    # Group by date and aggregate
    trends = behaviors.annotate(
        date=TruncDate('recorded_at')
    ).values('date').annotate(
        missions_completed=Sum(
            'value',
            filter=Q(behavior_type='mission_completion')
        ) or 0,
        hours_studied=Sum(
            'value',
            filter=Q(behavior_type='study_consistency')
        ) or 0,
        reflections_count=Count(
            'id',
            filter=Q(behavior_type='reflection_frequency')
        )
    ).order_by('date')
    
    result = [
        {
            'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None,
            'missions_completed': int(item['missions_completed'] or 0),
            'hours_studied': float(item['hours_studied'] or 0),
            'reflections_count': item['reflections_count'] or 0
        }
        for item in trends
    ]
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def readiness_window(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/readiness-window
    Get estimated readiness window.
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get latest readiness snapshot
    snapshot = ReadinessSnapshot.objects.filter(mentee=mentee).order_by('-snapshot_date').first()
    
    if not snapshot:
        return Response(
            {'error': 'No readiness data available'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate estimated date based on learning velocity
    estimated_date = None
    confidence = 'low'
    
    if snapshot.learning_velocity and snapshot.learning_velocity > 0:
        # Calculate days to reach 100% readiness
        current_score = float(snapshot.core_readiness_score)
        points_needed = 100 - current_score
        days_needed = (points_needed / float(snapshot.learning_velocity)) * 30  # Convert to days
        
        estimated_date = timezone.now() + timedelta(days=int(days_needed))
        
        # Set confidence based on data quality
        if snapshot.learning_velocity > 10:
            confidence = 'high'
        elif snapshot.learning_velocity > 5:
            confidence = 'medium'
    
    result = {
        'label': snapshot.estimated_readiness_window or 'Not available',
        'estimated_date': estimated_date.date().isoformat() if estimated_date else None,
        'confidence': confidence,
        'category': snapshot.career_readiness_stage
    }
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_report(request, mentee_id):
    """
    GET /api/v1/talentscope/mentees/{mentee_id}/export
    Export analytics report (PDF or CSV).
    """
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user_roles = [ur.role.name for ur in request.user.user_roles.filter(is_active=True)]
    is_analyst = 'analyst' in user_roles
    is_admin = 'admin' in user_roles
    
    if not (is_analyst or is_admin) and request.user.id != mentee.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    format_type = request.query_params.get('format', 'csv').lower()
    
    if format_type not in ['csv', 'pdf']:
        return Response(
            {'error': 'Invalid format. Use "csv" or "pdf"'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get latest snapshot
    snapshot = ReadinessSnapshot.objects.filter(mentee=mentee).order_by('-snapshot_date').first()
    
    if not snapshot:
        return Response(
            {'error': 'No data available for export'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # For now, return JSON (actual PDF/CSV generation would require additional libraries)
    serializer = ReadinessSnapshotSerializer(snapshot)
    
    if format_type == 'csv':
        # Simple CSV response (would need proper CSV library for production)
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="readiness_report_{mentee_id}.csv"'
        response.write('Metric,Value\n')
        response.write(f'Core Readiness Score,{snapshot.core_readiness_score}\n')
        response.write(f'Career Stage,{snapshot.career_readiness_stage}\n')
        response.write(f'Job Fit Score,{snapshot.job_fit_score or "N/A"}\n')
        return response
    else:
        # PDF would require reportlab or similar
        return Response(
            {'error': 'PDF export not yet implemented'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
