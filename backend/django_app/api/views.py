"""
API views for health check and monitoring.
"""
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint.
    GET /api/v1/health/
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'OCH Cyber Talent Engine API',
        'version': '1.0.0'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """
    Dashboard monitoring metrics endpoint.
    GET /api/v1/metrics/dashboard
    Requires authentication and admin role.
    """
    from student_dashboard.monitoring import get_dashboard_metrics, get_dashboard_health
    
    # Check if user is admin
    user = request.user
    if not user.is_staff and not user.user_roles.filter(role__name='admin', is_active=True).exists():
        return Response(
            {'error': 'Access denied. Admin role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    metrics = get_dashboard_metrics()
    health = get_dashboard_health()
    
    return Response({
        'health': health,
        'metrics': metrics,
    }, status=status.HTTP_200_OK)
