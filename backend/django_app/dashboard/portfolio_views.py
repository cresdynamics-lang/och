"""
Portfolio API Views
Handles CRUD operations for student portfolio items
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import PortfolioItem
from users.models import User
import json
import uuid


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
    
    items = PortfolioItem.objects.filter(user_id=user_id).order_by('-created_at')
    
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
    if item.user_id != request.user.id:
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
        user_id=user_id,
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
    if item.user_id != request.user.id:
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
    if item.user_id != request.user.id:
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
    
    items = PortfolioItem.objects.filter(user_id=user_id)
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
    
    return Response({
        'totalItems': total_items,
        'approvedItems': approved_items,
        'pendingItems': pending_items,
        'inReviewItems': in_review_items,
        'healthScore': round(health_score, 2),
        'averageScore': 0,  # TODO: Calculate from mentor reviews
        'topSkills': top_skills_list,
    })

