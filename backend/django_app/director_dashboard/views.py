"""
Director Dashboard API Views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DirectorDashboardCache, DirectorCohortHealth
from .serializers import (
    DirectorDashboardSerializer,
    DirectorCohortHealthSerializer
)
from .services import DirectorDashboardService
from programs.permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorDashboardViewSet(viewsets.ViewSet):
    """Director Dashboard API endpoints."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        GET /api/v1/director/dashboard
        Get director dashboard with hero metrics, alerts, and quick stats.
        """
        director_id = request.user.id
        
        try:
            dashboard_data = DirectorDashboardService.get_dashboard_data(director_id)
            serializer = DirectorDashboardSerializer(dashboard_data)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return Response(
                {'error': 'Failed to load dashboard data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def cohorts(self, request):
        """
        GET /api/v1/director/cohorts?risk_level=high&limit=20
        Get cohorts table data with filtering.
        """
        director_id = request.user.id
        risk_level = request.query_params.get('risk_level')
        limit = int(request.query_params.get('limit', 20))
        
        try:
            cohorts_data = DirectorDashboardService.get_cohorts_table(
                director_id,
                risk_level=risk_level,
                limit=limit
            )
            return Response(cohorts_data)
        except Exception as e:
            logger.error(f"Error getting cohorts table: {e}")
            return Response(
                {'error': 'Failed to load cohorts data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def refresh_cache(self, request):
        """
        POST /api/v1/director/dashboard/refresh_cache
        Manually refresh dashboard cache.
        """
        director_id = request.user.id
        
        try:
            cache = DirectorDashboardService.refresh_director_cache(director_id)
            return Response({
                'message': 'Cache refreshed successfully',
                'updated_at': cache.cache_updated_at.isoformat(),
            })
        except Exception as e:
            logger.error(f"Error refreshing cache: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

