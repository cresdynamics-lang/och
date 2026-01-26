"""
Director-specific views for managing cohorts.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from programs.models import Cohort
from programs.services.director_service import DirectorService
from programs.serializers import CohortSerializer

logger = logging.getLogger(__name__)


class DirectorCohortViewSet(viewsets.ViewSet):
    """
    ViewSet for director-specific cohort operations.
    Provides endpoints for managing cohorts, enrollments, and seat pools.
    """
    permission_classes = [IsAuthenticated]
    
    def get_cohort(self, pk):
        """Get cohort and verify director has access."""
        cohort = get_object_or_404(Cohort, pk=pk)
        if not DirectorService.can_manage_cohort(self.request.user, cohort):
            return None, Response(
                {'detail': 'You do not have permission to manage this cohort'},
                status=status.HTTP_403_FORBIDDEN
            )
        return cohort, None
    
    @action(detail=True, methods=['post'])
    def manage_seat_pool(self, request, pk=None):
        """Update cohort seat pool allocations."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        seat_pool = request.data.get('seat_pool', {})
        if not isinstance(seat_pool, dict):
            return Response(
                {'error': 'seat_pool must be a dictionary'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_cohort = DirectorService.manage_seat_pool(cohort, seat_pool, request.user)
            serializer = CohortSerializer(updated_cohort)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def approve_enrollment(self, request, pk=None):
        """Approve a single enrollment."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        enrollment_id = request.data.get('enrollment_id')
        if not enrollment_id:
            return Response(
                {'error': 'enrollment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from programs.models import Enrollment
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id, cohort=cohort)
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            approved_enrollment = DirectorService.approve_enrollment(enrollment, request.user)
            from programs.serializers import EnrollmentSerializer
            serializer = EnrollmentSerializer(approved_enrollment)
            return Response(serializer.data)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def bulk_approve_enrollments(self, request, pk=None):
        """Bulk approve enrollments."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        enrollment_ids = request.data.get('enrollment_ids', [])
        if not enrollment_ids:
            return Response(
                {'error': 'enrollment_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_approve_enrollments(cohort, enrollment_ids, request.user)
            return Response(result)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post', 'patch'])
    def update_enrollment_status(self, request, pk=None):
        """Update a single enrollment status."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        enrollment_id = request.data.get('enrollment_id')
        new_status = request.data.get('status')
        
        if not enrollment_id or not new_status:
            return Response(
                {'error': 'enrollment_id and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_update_enrollments_status(
                cohort, [enrollment_id], new_status, request.user
            )
            # Return the updated enrollment object
            from programs.models import Enrollment
            from programs.serializers import EnrollmentSerializer
            enrollment = Enrollment.objects.get(id=enrollment_id, cohort=cohort)
            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data)
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def bulk_update_enrollments(self, request, pk=None):
        """Bulk update enrollment statuses."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        enrollment_ids = request.data.get('enrollment_ids', [])
        new_status = request.data.get('status')
        
        if not enrollment_ids or not new_status:
            return Response(
                {'error': 'enrollment_ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_update_enrollments_status(
                cohort, enrollment_ids, new_status, request.user
            )
            return Response(result)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_enrollments(self, request, pk=None):
        """Bulk remove enrollments."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        enrollment_ids = request.data.get('enrollment_ids', [])
        if not enrollment_ids:
            return Response(
                {'error': 'enrollment_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_remove_enrollments(cohort, enrollment_ids, request.user)
            return Response(result)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def bulk_create_enrollments(self, request, pk=None):
        """Bulk create enrollments for multiple users."""
        cohort, error_response = self.get_cohort(pk)
        if error_response:
            return error_response
        
        user_ids = request.data.get('user_ids', [])
        seat_type = request.data.get('seat_type', 'paid')
        enrollment_type = request.data.get('enrollment_type', 'director')
        
        if not user_ids:
            return Response(
                {'error': 'user_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_create_enrollments(
                cohort=cohort,
                user_ids=user_ids,
                user=request.user,
                seat_type=seat_type,
                enrollment_type=enrollment_type
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Error in bulk_create_enrollments: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
