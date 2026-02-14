"""
Portfolio API Views
Handles CRUD operations for student portfolio items
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import PortfolioItem, ReadinessScore
from users.models import User
from programs.models import Enrollment
import json
import uuid
import os


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio_items(request, user_id):
    """
    GET /api/v1/student/dashboard/portfolio/{user_id}
    Get all portfolio items for a user
    """
    # Only allow users to access their own portfolio
    if str(request.user.id) != str(user_id):
        return Response(
            {'detail': 'You can only access your own portfolio'},
            status=status.HTTP_403_FORBIDDEN
        )

    items = PortfolioItem.objects.filter(user=request.user).order_by('-created_at')
    
    items_data = []
    for item in items:
        # Parse JSON fields safely
        skill_tags = []
        evidence_files = []
        
        if item.skill_tags:
            try:
                skill_tags = json.loads(item.skill_tags) if isinstance(item.skill_tags, str) else item.skill_tags
            except:
                skill_tags = []
        
        if item.evidence_files:
            try:
                evidence_files = json.loads(item.evidence_files) if isinstance(item.evidence_files, str) else item.evidence_files
            except:
                evidence_files = []
        
        items_data.append({
            'id': str(item.id),
            'title': item.title,
            'summary': item.summary or '',
            'type': item.item_type or 'mission',
            'status': item.status,
            'visibility': item.visibility or 'private',
            'skillTags': skill_tags if isinstance(skill_tags, list) else [],
            'evidenceFiles': evidence_files if isinstance(evidence_files, list) else [],
            'createdAt': item.created_at.isoformat() if item.created_at else None,
            'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
        })
    
    return Response({'items': items_data})


@api_view(['GET', 'PATCH', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def get_portfolio_item(request, item_id):
    """
    GET /api/v1/student/dashboard/portfolio/item/{item_id}
    PATCH /api/v1/student/dashboard/portfolio/item/{item_id}
    DELETE /api/v1/student/dashboard/portfolio/item/{item_id}
    Get, update, or delete a single portfolio item
    """
    if request.method == 'DELETE':
        return delete_portfolio_item_logic(request, item_id)
    elif request.method in ['PATCH', 'PUT']:
        return update_portfolio_item_logic(request, item_id)
    try:
        item = PortfolioItem.objects.get(id=item_id)
    except PortfolioItem.DoesNotExist:
        return Response(
            {'detail': 'Portfolio item not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only allow users to access their own portfolio items
    if item.user != request.user:
        return Response(
            {'detail': 'You can only access your own portfolio items'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    skill_tags = []
    evidence_files = []
    
    if item.skill_tags:
        try:
            skill_tags = json.loads(item.skill_tags) if isinstance(item.skill_tags, str) else item.skill_tags
        except:
            skill_tags = []
    
    if item.evidence_files:
        try:
            evidence_files = json.loads(item.evidence_files) if isinstance(item.evidence_files, str) else item.evidence_files
        except:
            evidence_files = []
    
    return Response({
        'id': str(item.id),
        'title': item.title,
        'summary': item.summary or '',
        'type': item.item_type or 'mission',
        'status': item.status,
        'visibility': item.visibility or 'private',
        'skillTags': skill_tags if isinstance(skill_tags, list) else [],
        'evidenceFiles': evidence_files if isinstance(evidence_files, list) else [],
        'createdAt': item.created_at.isoformat() if item.created_at else None,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_portfolio_item(request, user_id):
    """
    POST /api/v1/student/dashboard/portfolio/{user_id}/items
    Create a new portfolio item
    """
    # Only allow users to create items in their own portfolio
    if str(request.user.id) != str(user_id):
        return Response(
            {'detail': 'You can only create items in your own portfolio'},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data

    # Create portfolio item
    item = PortfolioItem.objects.create(
        user=request.user,
        title=data.get('title', 'Untitled'),
        summary=data.get('summary', ''),
        item_type=data.get('type', 'mission'),
        status=data.get('status', 'draft'),
        visibility=data.get('visibility', 'private'),
        skill_tags=json.dumps(data.get('skillTags', [])),
        evidence_files=json.dumps(data.get('evidenceFiles', [])),
    )
    
    skill_tags = data.get('skillTags', [])
    evidence_files = data.get('evidenceFiles', [])
    
    return Response({
        'id': str(item.id),
        'title': item.title,
        'summary': item.summary or '',
        'type': item.item_type or 'mission',
        'status': item.status,
        'visibility': item.visibility or 'private',
        'skillTags': skill_tags if isinstance(skill_tags, list) else [],
        'evidenceFiles': evidence_files if isinstance(evidence_files, list) else [],
        'createdAt': item.created_at.isoformat() if item.created_at else None,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    }, status=status.HTTP_201_CREATED)


def update_portfolio_item_logic(request, item_id):
    """Helper function to update a portfolio item"""
    try:
        item = PortfolioItem.objects.get(id=item_id)
    except PortfolioItem.DoesNotExist:
        return Response(
            {'detail': 'Portfolio item not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only allow users to update their own portfolio items
    if item.user != request.user:
        return Response(
            {'detail': 'You can only update your own portfolio items'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data
    
    # Update fields
    if 'title' in data:
        item.title = data['title']
    if 'summary' in data:
        item.summary = data.get('summary', '')
    if 'type' in data:
        item.item_type = data['type']
    if 'status' in data:
        item.status = data['status']
    if 'visibility' in data:
        item.visibility = data['visibility']
    if 'skillTags' in data:
        item.skill_tags = json.dumps(data['skillTags'])
    if 'evidenceFiles' in data:
        item.evidence_files = json.dumps(data['evidenceFiles'])
    
    item.save()
    
    skill_tags = []
    evidence_files = []
    
    if item.skill_tags:
        try:
            skill_tags = json.loads(item.skill_tags) if isinstance(item.skill_tags, str) else item.skill_tags
        except:
            skill_tags = []
    
    if item.evidence_files:
        try:
            evidence_files = json.loads(item.evidence_files) if isinstance(item.evidence_files, str) else item.evidence_files
        except:
            evidence_files = []
    
    return Response({
        'id': str(item.id),
        'title': item.title,
        'summary': item.summary or '',
        'type': item.item_type or 'mission',
        'status': item.status,
        'visibility': item.visibility or 'private',
        'skillTags': skill_tags if isinstance(skill_tags, list) else [],
        'evidenceFiles': evidence_files if isinstance(evidence_files, list) else [],
        'createdAt': item.created_at.isoformat() if item.created_at else None,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    })


def delete_portfolio_item_logic(request, item_id):
    """Helper function to delete a portfolio item"""
    try:
        item = PortfolioItem.objects.get(id=item_id)
    except PortfolioItem.DoesNotExist:
        return Response(
            {'detail': 'Portfolio item not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only allow users to delete their own portfolio items
    if item.user != request.user:
        return Response(
            {'detail': 'You can only delete your own portfolio items'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio_health(request, user_id):
    """
    GET /api/v1/student/dashboard/portfolio/{user_id}/health
    Get portfolio health metrics
    """
    # Only allow users to access their own portfolio health
    if str(request.user.id) != str(user_id):
        return Response(
            {'detail': 'You can only access your own portfolio health'},
            status=status.HTTP_403_FORBIDDEN
        )

    items = PortfolioItem.objects.filter(user=request.user)
    total_items = items.count()
    approved_items = items.filter(status='approved').count()
    pending_items = items.filter(status__in=['draft', 'submitted', 'pending']).count()
    in_review_items = items.filter(status='in_review').count()
    
    # Calculate health score (0-100)
    if total_items > 0:
        health_score = (approved_items / total_items) * 100
    else:
        health_score = 0
    
    # Get top skills from all items
    all_skills = []
    for item in items:
        if item.skill_tags:
            try:
                skills = json.loads(item.skill_tags) if isinstance(item.skill_tags, str) else item.skill_tags
                if isinstance(skills, list):
                    all_skills.extend(skills)
            except:
                pass
    
    # Count skill frequency
    skill_counts = {}
    for skill in all_skills:
        if skill:  # Only count non-empty skills
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    # Get top 10 skills with count and score
    # Score is based on frequency (normalized to 0-10 scale)
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    max_count = top_skills[0][1] if top_skills else 1  # Get max count for normalization
    
    top_skills_list = [
        {
            'skill': skill,
            'count': count,
            'score': min(10, (count / max_count) * 10) if max_count > 0 else 0  # Normalize to 0-10
        }
        for skill, count in top_skills
    ]
    
    # Readiness score from ReadinessScore model (TalentScope/profiler)
    readiness = ReadinessScore.objects.filter(user=request.user).order_by('-updated_at').first()
    readiness_score = readiness.score if readiness else 0
    readiness_trend = readiness.trend if readiness else 0
    
    return Response({
        'totalItems': total_items,
        'approvedItems': approved_items,
        'pendingItems': pending_items,
        'inReviewItems': in_review_items,
        'healthScore': round(health_score, 2),
        'averageScore': 0,  # TODO: Calculate from mentor reviews
        'topSkills': top_skills_list,
        'readinessScore': readiness_score,
        'readinessTrend': readiness_trend,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_portfolio_file(request, user_id):
    """
    POST /api/v1/student/dashboard/portfolio/{user_id}/upload
    Upload a file for portfolio evidence
    """
    # Only allow users to upload files to their own portfolio
    if str(request.user.id) != str(user_id):
        return Response(
            {'detail': 'You can only upload files to your own portfolio'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'file' not in request.FILES:
        return Response(
            {'detail': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_file = request.FILES['file']

    # Validate file size (50MB max)
    max_size = 50 * 1024 * 1024  # 50MB
    if uploaded_file.size > max_size:
        return Response(
            {'detail': 'File size exceeds 50MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate unique filename
    file_extension = os.path.splitext(uploaded_file.name)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"portfolio/{user_id}/{unique_filename}"

    # Save file
    saved_path = default_storage.save(file_path, ContentFile(uploaded_file.read()))

    # Determine file type
    file_type = 'link'
    if uploaded_file.content_type.startswith('image/'):
        file_type = 'image'
    elif uploaded_file.content_type.startswith('video/'):
        file_type = 'video'
    elif uploaded_file.content_type == 'application/pdf':
        file_type = 'pdf'

    # Build file URL
    file_url = f"/media/{saved_path}"

    return Response({
        'url': file_url,
        'name': uploaded_file.name,
        'size': uploaded_file.size,
        'type': file_type,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cohort_peers(request):
    """
    GET /api/v1/student/dashboard/portfolio/cohort-peers
    Get cohort peers for the current user with readiness, portfolio health, and item counts.
    """
    user = request.user

    # Get user's cohort IDs from enrollments
    enrollments = Enrollment.objects.filter(
        user=user,
        status__in=['active', 'completed']
    ).select_related('cohort', 'cohort__track')

    cohort_ids = list(enrollments.values_list('cohort_id', flat=True).distinct())
    cohort_names = list(
        enrollments.values_list('cohort__name', flat=True).distinct()
    )
    cohort_names = [n for n in cohort_names if n]

    if not cohort_ids:
        return Response({
            'peers': [],
            'cohortName': None,
            'averageReadiness': 0,
            'totalOutcomes': 0,
        })

    # Get peer user IDs in same cohort(s), excluding self
    peer_user_ids = set(
        Enrollment.objects.filter(
            cohort_id__in=cohort_ids,
            status__in=['active', 'completed']
        ).exclude(user=user).values_list('user_id', flat=True).distinct()
    )

    # Build peer data with readiness, portfolio health, items
    peers_data = []
    total_readiness = 0
    total_outcomes = 0

    for peer_user in User.objects.filter(id__in=peer_user_ids).select_related():
        items = PortfolioItem.objects.filter(user=peer_user)
        items_count = items.count()
        approved_count = items.filter(status='approved').count()
        health = round((approved_count / items_count * 100), 1) if items_count > 0 else 0
        health_display = round(health / 10, 1)  # 0-10 scale for display

        readiness = ReadinessScore.objects.filter(user=peer_user).order_by('-updated_at').first()
        readiness_val = readiness.score if readiness else 0
        total_readiness += readiness_val
        total_outcomes += items_count

        # Get track from enrollment
        peer_enrollment = Enrollment.objects.filter(
            user=peer_user,
            cohort_id__in=cohort_ids,
            status__in=['active', 'completed']
        ).select_related('cohort__track').first()
        track_key = peer_enrollment.cohort.track.key if peer_enrollment and peer_enrollment.cohort and peer_enrollment.cohort.track else ''

        # Handle: use username or email prefix for public profile link
        handle = getattr(peer_user, 'username', None) or (peer_user.email.split('@')[0] if peer_user.email else str(peer_user.uuid_id))
        name = f"{peer_user.first_name or ''} {peer_user.last_name or ''}".strip() or peer_user.email or handle

        # Status based on readiness
        if readiness_val >= 80:
            status_key = 'job_ready'
        elif readiness_val >= 50:
            status_key = 'emerging'
        else:
            status_key = 'building'

        peers_data.append({
            'id': str(peer_user.uuid_id),
            'name': name,
            'handle': handle,
            'track': track_key,
            'readiness': readiness_val,
            'health': health_display,
            'items': items_count,
            'status': status_key,
        })

    peer_count = len(peers_data)
    avg_readiness = round(total_readiness / peer_count, 0) if peer_count > 0 else 0

    return Response({
        'peers': peers_data,
        'cohortName': cohort_names[0] if cohort_names else None,
        'averageReadiness': int(avg_readiness),
        'totalOutcomes': total_outcomes,
    })

