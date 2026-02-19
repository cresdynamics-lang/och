"""
AI Coach usage tracking endpoint.
"""
from datetime import date
from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AICoachMessage, AICoachSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_coach_usage(request):
    """
    GET /api/v1/coaching/ai-coach/usage
    Get today's AI Coach usage count.
    """
    user = request.user
    today = date.today()
    
    # Count user messages sent today
    usage_count = AICoachMessage.objects.filter(
        session__user=user,
        role='user',
        created_at__date=today
    ).count()
    
    return Response({
        'usage_today': usage_count,
        'date': today.isoformat(),
    }, status=status.HTTP_200_OK)
