"""
Director Dashboard API Views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

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
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """
        GET /api/v1/director/students
        Get all students for director management.
        """
        User = get_user_model()
        
        try:
            students = User.objects.filter(
                is_active=True,
                account_status='active'
            ).order_by('-created_at')
            
            students_data = []
            for student in students:
                students_data.append({
                    'id': str(student.uuid_id),
                    'email': student.email,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'cohort_id': student.cohort_id,
                    'track_key': student.track_key,
                    'created_at': student.created_at.isoformat(),
                    'sponsor_id': None,
                    'sponsor_name': None
                })
            
            return Response({'students': students_data})
        except Exception as e:
            logger.error(f"Error getting students: {e}")
            return Response(
                {'error': 'Failed to load students data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def sponsors(self, request):
        """
        GET /api/v1/director/sponsors
        Get all sponsors for linking to students.
        """
        User = get_user_model()
        
        try:
            logger.info("Starting sponsors query")
            
            # Get all users with sponsor_admin role using ORM
            sponsors = User.objects.filter(
                is_active=True,
                account_status='active'
            ).prefetch_related('user_roles__role').distinct()
            
            logger.info(f"Found {sponsors.count()} potential sponsors")
            
            sponsors_data = []
            for sponsor in sponsors:
                # Check if user has sponsor_admin role
                has_sponsor_role = sponsor.user_roles.filter(
                    role__name='sponsor_admin',
                    is_active=True
                ).exists()
                
                if has_sponsor_role:
                    sponsors_data.append({
                        'id': str(sponsor.uuid_id),
                        'email': sponsor.email,
                        'first_name': sponsor.first_name,
                        'last_name': sponsor.last_name,
                        'organization': getattr(sponsor.org_id, 'name', None) if sponsor.org_id else None
                    })
            
            logger.info(f"Returning {len(sponsors_data)} sponsors")
            return Response({'sponsors': sponsors_data})
            
        except Exception as e:
            logger.error(f"Error getting sponsors: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to load sponsors data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='students/link-sponsor')
    def link_students_to_sponsor(self, request):
        """
        POST /api/v1/director/students/link-sponsor/
        Link students to a sponsor.
        """
        print("=== LINK SPONSOR METHOD CALLED ===")
        try:
            print("Starting link_students_to_sponsor")
            
            student_ids = request.data.get('student_ids', [])
            sponsor_id = request.data.get('sponsor_id')
            
            logger.info(f"Received student_ids: {student_ids}, sponsor_id: {sponsor_id}")
            
            if not student_ids or not sponsor_id:
                logger.error("Missing student_ids or sponsor_id")
                return Response(
                    {'error': 'student_ids and sponsor_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            User = get_user_model()
            
            # Validate sponsor exists using ORM
            logger.info("Validating sponsor exists")
            try:
                sponsor = User.objects.get(
                    uuid_id=sponsor_id,
                    is_active=True,
                    account_status='active'
                )
                logger.info(f"Found sponsor: {sponsor.email}")
            except User.DoesNotExist:
                logger.error(f"Sponsor not found: {sponsor_id}")
                return Response(
                    {'error': 'Invalid sponsor'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create sponsor-student links using ORM
            links_created = 0
            for student_id in student_ids:
                logger.info(f"Processing student_id: {student_id}")
                
                try:
                    # Validate student exists
                    student = User.objects.get(
                        uuid_id=student_id,
                        is_active=True,
                        account_status='active'
                    )
                    logger.info(f"Found student: {student.email}")
                    
                    # Create or get sponsor-student link
                    from users.models import SponsorStudentLink
                    link, created = SponsorStudentLink.objects.get_or_create(
                        sponsor=sponsor,
                        student=student,
                        defaults={
                            'created_by': request.user,
                            'is_active': True
                        }
                    )
                    
                    if created:
                        links_created += 1
                        logger.info(f"Created link for student {student.email}")
                    else:
                        logger.info(f"Link already exists for student {student.email}")
                        
                except User.DoesNotExist:
                    logger.warning(f"Student not found: {student_id}")
                    continue
                except Exception as e:
                    logger.error(f"Error creating link for student {student_id}: {e}", exc_info=True)
                    continue
            
            logger.info(f"Successfully created {links_created} links")
            return Response({
                'message': f'Successfully linked {links_created} students to sponsor',
                'links_created': links_created
            })
            
        except Exception as e:
            logger.error(f"Error linking students to sponsor: {e}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

