"""
API views for Sponsor Dashboard.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from organizations.models import Organization, OrganizationMember
from programs.models import Cohort, Enrollment
from users.models import User, ConsentScope, UserRole, Role
from users.utils.consent_utils import check_consent
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode
)
from .serializers import (
    SponsorDashboardSummarySerializer,
    SponsorCohortListSerializer,
    SponsorCohortDetailSerializer,
    SponsorStudentAggregateSerializer,
    SponsorCodeSerializer,
    SponsorCodeGenerateSerializer,
    SponsorSeatAssignSerializer,
    SponsorInvoiceSerializer,
)
from .services import (
    SponsorDashboardService,
    SponsorCodeService,
    TalentScopeService,
    BillingService,
)


class SponsorDashboardViewSet(viewsets.ViewSet):
    """
    Sponsor Dashboard API endpoints.
    Requires authentication and org membership.
    """
    permission_classes = [IsAuthenticated]
    
    def get_org(self, request):
        """Get sponsor organization from user."""
        user = request.user
        # First check user's direct org_id
        org = user.org_id
        if org and hasattr(org, 'org_type') and org.org_type == 'sponsor':
            return org
        
        # Check if user is a member of any sponsor organization
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            status='active',
            organizationmember__user=user
        ).distinct().first()
        
        if sponsor_orgs:
            return sponsor_orgs
        
        # In development mode, auto-create a sponsor organization for the user
        if settings.DEBUG:
            try:
                from django.utils.text import slugify
                # Create a safe slug from user email
                email_prefix = user.email.split('@')[0]
                user_slug = slugify(email_prefix)[:20]  # Limit length
                slug = f'sponsor-{user_slug}-{user.id}'[:50]  # Ensure slug is within max length
                
                # Get or create organization
                org, created = Organization.objects.get_or_create(
                    slug=slug,
                    defaults={
                        'name': f'{email_prefix}\'s Sponsor Organization',
                        'org_type': 'sponsor',
                        'status': 'active',
                        'owner': user,
                    }
                )
                # Ensure user is a member
                OrganizationMember.objects.get_or_create(
                    organization=org,
                    user=user,
                    defaults={'role': 'admin'}
                )
                return org
            except Exception as e:
                # Log error but don't fail - return None to show proper error message
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to auto-create sponsor org for user {user.id}: {e}', exc_info=True)
                return None
        
        # If no sponsor org found, return None
        return None
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        GET /api/v1/sponsor/dashboard/summary
        Get sponsor dashboard summary.
        """
        try:
            org = self.get_org(request)
            if not org:
                return Response(
                    {'detail': 'User is not associated with a sponsor organization'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get or create cache - use get_or_create to avoid race conditions
            cache, created = SponsorDashboardCache.objects.get_or_create(
                org=org,
                defaults={
                    'seats_total': 0,
                    'seats_used': 0,
                    'seats_at_risk': 0,
                    'budget_total': 0,
                    'budget_used': 0,
                    'budget_used_pct': 0,
                    'avg_readiness': 0,
                    'avg_completion_pct': 0,
                    'graduates_count': 0,
                    'active_cohorts_count': 0,
                    'overdue_invoices_count': 0,
                    'low_utilization_cohorts': 0,
                }
            )
            
            # Try to refresh cache if it's empty or stale (older than 5 minutes)
            cache_age = timezone.now() - cache.cache_updated_at
            if created or cache_age > timedelta(minutes=5):
                try:
                    cache = SponsorDashboardService.refresh_sponsor_cache(org.id)
                except Exception as e:
                    # If refresh fails, use existing cache or empty defaults
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f'Failed to refresh sponsor cache for org {org.id}: {e}. Using existing cache.', exc_info=True)
                    # Continue with existing cache or empty cache
            
            try:
                serializer = SponsorDashboardSummarySerializer(cache)
                return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Error serializing sponsor dashboard cache: {e}', exc_info=True)
                # Return minimal valid response
                return Response({
                    'org_id': org.id,
                    'seats_total': 0,
                    'seats_used': 0,
                    'seats_at_risk': 0,
                    'budget_total': 0,
                    'budget_used': 0,
                    'budget_used_pct': 0,
                    'avg_readiness': 0,
                    'avg_completion_pct': 0,
                    'graduates_count': 0,
                    'active_cohorts_count': 0,
                    'alerts': [],
                    'cache_updated_at': timezone.now().isoformat(),
                })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Unexpected error in sponsor dashboard summary: {e}', exc_info=True)
            return Response(
                {'detail': f'An unexpected error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def cohorts(self, request):
        """
        GET /api/v1/sponsor/dashboard/cohorts
        Get list of sponsored cohorts with pagination.
        """
        try:
            org = self.get_org(request)
            if not org:
                return Response(
                    {'detail': 'User is not associated with a sponsor organization'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            limit = int(request.query_params.get('limit', 20))
            offset = int(request.query_params.get('offset', 0))
            cursor = request.query_params.get('cursor')
            
            # Try to get cohorts, but return empty list if table doesn't exist or query fails
            try:
                queryset = SponsorCohortDashboard.objects.filter(org=org).order_by('-updated_at')
                
                # Cursor-based pagination (simplified)
                if cursor:
                    try:
                        cursor_time = timezone.datetime.fromisoformat(cursor.replace('Z', '+00:00'))
                        queryset = queryset.filter(updated_at__lt=cursor_time)
                    except (ValueError, AttributeError):
                        pass
                
                cohorts = list(queryset[offset:offset + limit])
                
                try:
                    serializer = SponsorCohortListSerializer(cohorts, many=True)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f'Error serializing cohorts: {e}. Returning empty list.', exc_info=True)
                    return Response({
                        'results': [],
                        'next_cursor': None,
                        'count': 0,
                    })
                
                # Get next cursor
                next_cursor = None
                if len(cohorts) == limit and cohorts:
                    try:
                        next_cursor = cohorts[-1].updated_at.isoformat()
                    except (AttributeError, IndexError):
                        pass
                
                try:
                    count = queryset.count()
                except Exception:
                    count = len(cohorts)
                
                return Response({
                    'results': serializer.data,
                    'next_cursor': next_cursor,
                    'count': count,
                })
            except Exception as e:
                # If table doesn't exist or query fails, return empty list
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Error querying SponsorCohortDashboard: {e}. Returning empty list.', exc_info=True)
                return Response({
                    'results': [],
                    'next_cursor': None,
                    'count': 0,
                })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error in sponsor dashboard cohorts endpoint: {e}', exc_info=True)
            # Return empty list instead of error to prevent frontend crashes
            return Response({
                'results': [],
                'next_cursor': None,
                'count': 0,
            })
    
    @action(detail=True, methods=['get'])
    def cohort_detail(self, request, pk=None):
        """
        GET /api/v1/sponsor/dashboard/cohorts/{cohort_id}
        Get detailed cohort information.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            dashboard = SponsorCohortDashboard.objects.get(org=org, cohort_id=pk)
        except SponsorCohortDashboard.DoesNotExist:
            # Refresh if doesn't exist
            dashboard = SponsorDashboardService.refresh_cohort_details(org.id, pk)
        
        serializer = SponsorCohortDetailSerializer(dashboard)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """
        GET /api/v1/sponsor/dashboard/students?cohort_id={uuid}
        Get student aggregates (consent-gated).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cohort_id = request.query_params.get('cohort_id')
        queryset = SponsorStudentAggregates.objects.filter(org=org)
        
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        
        # Only show consented profiles
        queryset = queryset.filter(consent_employer_share=True)
        
        serializer = SponsorStudentAggregateSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def seats_assign(self, request):
        """
        POST /api/v1/sponsor/seats/assign
        Bulk assign seats to users.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SponsorSeatAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        cohort_id = serializer.validated_data['cohort_id']
        user_ids = serializer.validated_data['user_ids']
        code = serializer.validated_data.get('code')
        
        try:
            if code:
                # Redeem code
                result = SponsorCodeService.redeem_code(code, cohort_id, user_ids)
            else:
                # Direct assignment
                cohort = Cohort.objects.get(id=cohort_id)
                assigned = []
                for user_id in user_ids:
                    enrollment, created = Enrollment.objects.get_or_create(
                        cohort=cohort,
                        user_id=user_id,
                        defaults={
                            'org': org,
                            'enrollment_type': 'sponsor',
                            'seat_type': 'sponsored',
                            'payment_status': 'waived',
                            'status': 'active',
                        }
                    )
                    assigned.append(str(enrollment.id))
                
                result = {
                    'seats_assigned': len(assigned),
                    'enrollment_ids': assigned,
                }
            
            # Refresh cache
            SponsorDashboardService.refresh_sponsor_cache(org.id)
            SponsorDashboardService.refresh_cohort_details(org.id, cohort_id)
            
            return Response(result, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Cohort.DoesNotExist:
            return Response(
                {'detail': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def codes_generate(self, request):
        """
        POST /api/v1/sponsor/codes/generate
        Generate sponsor codes.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SponsorCodeGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        count = serializer.validated_data.get('count', 1)
        codes = []
        
        for _ in range(count):
            code = SponsorCodeService.generate_code(
                org.id,
                serializer.validated_data['seats'],
                value_per_seat=serializer.validated_data.get('value_per_seat'),
                valid_from=serializer.validated_data.get('valid_from'),
                valid_until=serializer.validated_data.get('valid_until'),
                max_usage=serializer.validated_data.get('max_usage'),
            )
            codes.append(code)
        
        serializer = SponsorCodeSerializer(codes, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def codes(self, request):
        """
        GET /api/v1/sponsor/codes
        List sponsor codes.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = SponsorCode.objects.filter(org=org).order_by('-created_at')
        serializer = SponsorCodeSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def invoices(self, request):
        """
        GET /api/v1/sponsor/invoices
        Get invoice history (placeholder - integrate with billing).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # TODO: Integrate with billing service
        # For now, return empty list
        return Response([])
    
    @action(detail=False, methods=['post'])
    def reports_export(self, request):
        """
        POST /api/v1/sponsor/reports/export
        Export reports (CSV/JSON).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        format_type = request.data.get('format', 'json')
        report_type = request.data.get('type', 'summary')
        
        # TODO: Implement export logic
        return Response({
            'detail': 'Export functionality coming soon',
            'format': format_type,
            'type': report_type,
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    @action(detail=False, methods=['get'], url_path='students/(?P<student_id>[^/.]+)')
    def student_profile(self, request, student_id=None):
        """
        GET /api/v1/sponsor/dashboard/students/{student_id}
        Get detailed student profile (consent-gated with employer.view_candidate_profile).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student is sponsored by this organization
        from programs.models import Enrollment
        enrollment = Enrollment.objects.filter(
            user=student,
            org=org,
            seat_type='sponsored'
        ).first()
        
        if not enrollment:
            return Response(
                {'detail': 'Student is not sponsored by your organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check consent for employer.view_candidate_profile (employer_share scope)
        has_consent = ConsentScope.objects.filter(
            user=student,
            scope_type='employer_share',
            granted=True,
            expires_at__isnull=True
        ).exists()
        
        if not has_consent:
            return Response(
                {
                    'detail': 'Student has not granted consent to share profile with employer',
                    'required_consent': 'employer_share'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get student aggregate data
        try:
            aggregate = SponsorStudentAggregates.objects.get(
                org=org,
                student=student,
                cohort=enrollment.cohort
            )
        except SponsorStudentAggregates.DoesNotExist:
            # Sync aggregate if doesn't exist
            SponsorDashboardService.sync_student_aggregates(org.id, str(enrollment.cohort.id))
            aggregate = SponsorStudentAggregates.objects.get(
                org=org,
                student=student,
                cohort=enrollment.cohort
            )
        
        # Return profile data
        from users.serializers import UserSerializer
        user_data = UserSerializer(student).data
        
        return Response({
            'student_id': str(student.id),
            'name': f"{student.first_name} {student.last_name}".strip() or student.email,
            'email': student.email if has_consent else None,
            'readiness_score': float(aggregate.readiness_score) if aggregate.readiness_score else None,
            'completion_pct': float(aggregate.completion_pct) if aggregate.completion_pct else None,
            'portfolio_items': aggregate.portfolio_items,
            'cohort': {
                'id': str(enrollment.cohort.id),
                'name': enrollment.cohort.name,
            },
            'enrollment_status': enrollment.status,
        })
    
    @action(detail=False, methods=['get'], url_path='students/(?P<student_id>[^/.]+)/portfolio')
    def student_portfolio(self, request, student_id=None):
        """
        GET /api/v1/sponsor/dashboard/students/{student_id}/portfolio
        Get student portfolio (consent-gated with portfolio.public_page).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student is sponsored by this organization
        from programs.models import Enrollment
        enrollment = Enrollment.objects.filter(
            user=student,
            org=org,
            seat_type='sponsored'
        ).first()
        
        if not enrollment:
            return Response(
                {'detail': 'Student is not sponsored by your organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check consent for portfolio.public_page (public_portfolio scope)
        has_consent = ConsentScope.objects.filter(
            user=student,
            scope_type='public_portfolio',
            granted=True,
            expires_at__isnull=True
        ).exists()
        
        if not has_consent:
            return Response(
                {
                    'detail': 'Student has not granted consent to share portfolio publicly',
                    'required_consent': 'public_portfolio'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get portfolio items
        portfolio_items = []
        try:
            from progress.models import PortfolioItem
            items = PortfolioItem.objects.filter(user=student).order_by('-created_at')
            portfolio_items = [{
                'id': str(item.id),
                'title': item.title,
                'description': getattr(item, 'description', ''),
                'created_at': item.created_at.isoformat(),
                'file_url': getattr(item, 'file_url', None),
            } for item in items]
        except ImportError:
            pass
        
        return Response({
            'student_id': str(student.id),
            'portfolio_items': portfolio_items,
            'total_items': len(portfolio_items),
        })
    
    @action(detail=False, methods=['get'])
    def competencies(self, request):
        """
        GET /api/v1/sponsor/dashboard/competencies
        Get competency/role definitions from MCRR (Missions/Competency/Role Registry).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get competencies from Mission model
        from missions.models import Mission
        missions = Mission.objects.all().values('competencies').distinct()
        
        # Extract unique competencies
        competencies = set()
        for mission in missions:
            if mission.get('competencies'):
                competencies.update(mission['competencies'])
        
        # Format as list of competency definitions
        competency_definitions = []
        for comp in sorted(competencies):
            competency_definitions.append({
                'id': comp.lower().replace(' ', '_'),
                'name': comp,
                'description': f"Competency in {comp}",
            })
        
        return Response({
            'competencies': competency_definitions,
            'count': len(competency_definitions),
        })
