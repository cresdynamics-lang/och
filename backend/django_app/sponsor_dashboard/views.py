"""
API views for Sponsor Dashboard.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from organizations.models import Organization, OrganizationMember
from programs.models import Cohort, Enrollment
from users.models import User, ConsentScope, UserRole, Role
from users.models import SponsorStudentLink
from users.utils.consent_utils import check_consent
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode,
    SponsorReportRequest,
)
from .serializers import (
    SponsorDashboardSummarySerializer,
    SponsorCohortListSerializer,
    SponsorCohortDetailSerializer,
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
            
            # Get cohorts that have sponsor assignments for users in this org
            try:
                from sponsors.models import SponsorCohortAssignment
                from programs.models import Cohort
                
                # Get users from this organization
                org_users = User.objects.filter(
                    Q(org_id=org) | Q(organizationmember__organization=org)
                ).distinct()
                
                # Get cohorts that have assignments from these users
                assigned_cohorts = SponsorCohortAssignment.objects.filter(
                    sponsor_uuid_id__in=org_users
                ).select_related('cohort_id', 'cohort_id__track').values_list('cohort_id', flat=True).distinct()
                
                cohorts = Cohort.objects.filter(id__in=assigned_cohorts).select_related('track')[offset:offset + limit]
                
                results = []
                for cohort in cohorts:
                    # Get assignment details for this cohort
                    assignment = SponsorCohortAssignment.objects.filter(
                        cohort_id=cohort,
                        sponsor_uuid_id__in=org_users
                    ).first()
                    
                    results.append({
                        'cohort_id': str(cohort.id),
                        'cohort_name': cohort.name,
                        'name': cohort.name,  # For backward compatibility
                        'track_name': cohort.track.name if cohort.track else 'Unknown Track',
                        'track_slug': cohort.track.key if cohort.track else 'unknown',
                        'seats_total': assignment.seat_allocation if assignment else 0,
                        'seats_used': cohort.enrollments.filter(status='active').count(),
                        'completion_pct': 0,  # TODO: Calculate from enrollments
                        'avg_readiness': 0,   # TODO: Calculate from student data
                        'graduates_count': cohort.enrollments.filter(status='completed').count(),
                        'flags': [],
                        'status': cohort.status,
                        'start_date': cohort.start_date.isoformat() if cohort.start_date else None,
                        'end_date': cohort.end_date.isoformat() if cohort.end_date else None,
                    })
                
                return Response({
                    'results': results,
                    'next_cursor': None,
                    'count': len(results),
                })
                
            except Exception as e:
                # If query fails, return empty list
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Error querying sponsor assignments: {e}. Returning empty list.', exc_info=True)
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
        List all students in enrollments created by this sponsor (org=org, seat_type=sponsored).
        Consent-gates PII (name/email); aggregates supply readiness/completion when synced.
        Uses raw SQL with explicit cast on users.id to avoid varchar=bigint type mismatch.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        cohort_id = request.query_params.get('cohort_id')
        # Raw query with cast so join works when users.id is bigint and enrollments.user_id is varchar
        with connection.cursor() as cursor:
            sql = """
                SELECT e.id AS enrollment_id, e.cohort_id, e.user_id, e.status AS enrollment_status,
                       u.uuid_id AS user_uuid_id, u.email, u.first_name, u.last_name,
                       c.name AS cohort_name
                FROM enrollments e
                INNER JOIN users u ON u.id::text = e.user_id::text
                INNER JOIN cohorts c ON c.id = e.cohort_id
                WHERE e.org_id = %s AND e.seat_type = %s
            """
            params = [org.id, 'sponsored']
            if cohort_id:
                sql += " AND e.cohort_id = %s"
                params.append(cohort_id)
            sql += " ORDER BY e.joined_at DESC"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
        enrollment_rows = [dict(zip(columns, row)) for row in rows]
        if not enrollment_rows:
            return Response([])
        cohort_ids = list({r['cohort_id'] for r in enrollment_rows})
        user_ids = list({r['user_id'] for r in enrollment_rows})
        aggregate_map = {}
        agg_qs = SponsorStudentAggregates.objects.filter(
            org=org,
            cohort_id__in=cohort_ids,
            student_id__in=user_ids
        )
        for agg in agg_qs:
            key = (str(agg.cohort_id), str(agg.student_id))
            aggregate_map[key] = agg
        students = []
        for r in enrollment_rows:
            key = (str(r['cohort_id']), str(r['user_id']))
            agg = aggregate_map.get(key)
            if agg:
                name = agg.name_anonymized
                consent = agg.consent_employer_share
                readiness_score = float(agg.readiness_score) if agg.readiness_score is not None else None
                completion_pct = float(agg.completion_pct) if agg.completion_pct is not None else None
                portfolio_items = agg.portfolio_items or 0
            else:
                consent = False
                name = f"Student #{str(r['enrollment_id'])[:8]}"
                readiness_score = None
                completion_pct = None
                portfolio_items = 0
            if consent:
                first = r['first_name'] or ''
                last = r['last_name'] or ''
                name = f"{first} {last}".strip() or (r['email'] or '')
            students.append({
                'id': str(r['user_uuid_id']),
                'name': name,
                'email': r['email'] if consent else '',
                'cohort_name': r['cohort_name'] or '',
                'cohort_id': str(r['cohort_id']),
                'readiness_score': readiness_score,
                'completion_pct': completion_pct,
                'portfolio_items': portfolio_items,
                'enrollment_status': r['enrollment_status'],
                'consent_employer_share': consent,
            })
        return Response(students)
    
    @action(detail=False, methods=['get'], url_path='cohort-enrollments')
    def cohort_enrollments(self, request):
        """
        GET /api/v1/sponsor/dashboard/cohort-enrollments/?cohort_id={uuid}
        List enrollments in a programs Cohort for this sponsor (seat_type=sponsored, org=sponsor org).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        cohort_id = request.query_params.get('cohort_id')
        if not cohort_id:
            return Response({'detail': 'cohort_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({'detail': 'Cohort not found'}, status=status.HTTP_404_NOT_FOUND)
        from sponsors.models import SponsorCohortAssignment
        if not SponsorCohortAssignment.objects.filter(
            cohort_id=cohort, sponsor_uuid_id=request.user
        ).exists():
            return Response({'detail': 'Not assigned to this cohort'}, status=status.HTTP_403_FORBIDDEN)
        enrollments = Enrollment.objects.filter(
            cohort=cohort,
            org=org,
            seat_type='sponsored'
        ).select_related('user').order_by('-joined_at')
        students = []
        for e in enrollments:
            u = e.user
            students.append({
                'enrollment_id': str(e.id),
                'student_id': str(u.uuid_id),
                'name': f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email,
                'email': u.email,
                'enrollment_status': e.status,
                'completion_percentage': 0,
                'joined_at': e.joined_at.isoformat(),
                'last_activity_at': None,
                'has_employer_consent': True,
            })
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'students': students,
            'total_students': len(students),
        })

    @action(detail=False, methods=['get'], url_path='cohort-reports')
    def cohort_reports(self, request):
        """
        GET /api/v1/sponsor/dashboard/cohort-reports/?cohort_id={uuid}
        Get report data for a programs Cohort.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        cohort_id = request.query_params.get('cohort_id')
        if not cohort_id:
            return Response({'detail': 'cohort_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({'detail': 'Cohort not found'}, status=status.HTTP_404_NOT_FOUND)
        from sponsors.models import SponsorCohortAssignment
        assignment = SponsorCohortAssignment.objects.filter(
            cohort_id=cohort, sponsor_uuid_id=request.user
        ).first()
        if not assignment:
            return Response({'detail': 'Not assigned to this cohort'}, status=status.HTTP_403_FORBIDDEN)
        enrollments = Enrollment.objects.filter(
            cohort=cohort, org=org, seat_type='sponsored'
        )
        total = enrollments.count()
        completed = enrollments.filter(status='completed').count()
        active = enrollments.filter(status='active').count()
        completion_rate = (completed / total * 100) if total > 0 else 0
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'seat_utilization': {
                'target_seats': assignment.seat_allocation,
                'used_seats': active,
                'utilization_percentage': round((active / assignment.seat_allocation * 100), 2) if assignment.seat_allocation else 0,
            },
            'completion_metrics': {
                'total_enrolled': total,
                'completed_students': completed,
                'completion_rate': round(completion_rate, 2),
                'average_completion_percentage': round(completion_rate, 2),
            },
            'financial_summary': {
                'total_cost_kes': 0,
                'total_revenue_kes': 0,
                'net_cost_kes': 0,
                'budget_allocated_kes': 0,
                'budget_utilization_pct': 0,
            },
            'payment_status': {
                'paid_invoices': 0,
                'pending_invoices': 0,
                'overdue_invoices': 0,
                'total_invoices': 0,
            },
        })

    @action(detail=False, methods=['get'], url_path='linked-students')
    def linked_students(self, request):
        """
        GET /api/v1/sponsor/dashboard/linked-students/
        Get students linked to the current sponsor admin via SponsorStudentLink.
        Only these students can be enrolled in cohorts.
        """
        try:
            links = SponsorStudentLink.objects.filter(
                sponsor=request.user,
                is_active=True
            ).select_related('student')
            students = []
            for link in links:
                s = link.student
                students.append({
                    'id': str(s.id),
                    'uuid_id': str(s.uuid_id),
                    'email': s.email,
                    'first_name': s.first_name or '',
                    'last_name': s.last_name or '',
                })
            return Response({'students': students})
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception('Error fetching linked students')
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
                # Direct assignment - only allow students linked to this sponsor admin
                cohort = Cohort.objects.get(id=cohort_id)
                assigned = []
                linked_student_uuids = {
                    str(u) for u in
                    SponsorStudentLink.objects.filter(
                        sponsor=request.user,
                        is_active=True
                    ).values_list('student__uuid_id', flat=True)
                }
                for user_uuid in user_ids:
                    uuid_str = str(user_uuid)
                    if uuid_str not in linked_student_uuids:
                        continue
                    try:
                        student = User.objects.get(uuid_id=user_uuid, is_active=True)
                    except User.DoesNotExist:
                        continue
                    enrollment, created = Enrollment.objects.update_or_create(
                        cohort=cohort,
                        user=student,
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

    @action(detail=False, methods=['get', 'post'], url_path='report-requests')
    def report_requests(self, request):
        """
        GET /api/v1/sponsor/dashboard/report-requests/
        List report requests for this sponsor org.
        POST /api/v1/sponsor/dashboard/report-requests/
        Create a new report request (sponsor requests detailed report from director).
        Body: { request_type, cohort_id?: string, details?: string }
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.method == 'GET':
            qs = SponsorReportRequest.objects.filter(org=org).select_related('cohort').order_by('-created_at')
            data = [
                {
                    'id': str(r.id),
                    'request_type': r.request_type,
                    'cohort_id': str(r.cohort_id) if r.cohort_id else None,
                    'cohort_name': r.cohort.name if r.cohort else None,
                    'details': r.details or '',
                    'status': r.status,
                    'created_at': r.created_at.isoformat(),
                    'delivered_at': r.delivered_at.isoformat() if r.delivered_at else None,
                    'attachment_url': r.attachment_url or '',
                }
                for r in qs
            ]
            return Response(data)
        # POST
        body = request.data or {}
        request_type = body.get('request_type', 'graduate_breakdown')
        if request_type not in dict(SponsorReportRequest.REQUEST_TYPE_CHOICES):
            request_type = 'graduate_breakdown'
        cohort_id = body.get('cohort_id')
        details = (body.get('details') or '').strip()
        cohort = None
        if cohort_id:
            try:
                cohort = Cohort.objects.get(id=cohort_id)
            except (Cohort.DoesNotExist, ValueError, TypeError):
                pass
        report_request = SponsorReportRequest.objects.create(
            org=org,
            request_type=request_type,
            cohort=cohort,
            details=details,
            status='pending',
        )
        return Response(
            {
                'id': str(report_request.id),
                'request_type': report_request.request_type,
                'cohort_id': str(report_request.cohort_id) if report_request.cohort_id else None,
                'cohort_name': report_request.cohort.name if report_request.cohort else None,
                'details': report_request.details or '',
                'status': report_request.status,
                'created_at': report_request.created_at.isoformat(),
                'delivered_at': None,
                'attachment_url': '',
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def reports_export(self, request):
        """
        POST /api/v1/sponsor/reports/export
        Export cohort report (CSV/JSON).
        Body: { cohort_id: string, format?: 'json' | 'csv' }
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        cohort_id = request.data.get('cohort_id')
        format_type = request.data.get('format', 'json')
        if not cohort_id:
            return Response({'detail': 'cohort_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({'detail': 'Cohort not found'}, status=status.HTTP_404_NOT_FOUND)
        from sponsors.models import SponsorCohortAssignment
        if not SponsorCohortAssignment.objects.filter(
            cohort_id=cohort, sponsor_uuid_id=request.user
        ).exists():
            return Response({'detail': 'Not assigned to this cohort'}, status=status.HTTP_403_FORBIDDEN)
        enrollments = Enrollment.objects.filter(
            cohort=cohort, org=org, seat_type='sponsored'
        ).select_related('user').order_by('user__last_name', 'user__first_name')
        report_data = {
            'cohort_name': cohort.name,
            'cohort_id': str(cohort.id),
            'exported_at': timezone.now().isoformat(),
            'total_students': enrollments.count(),
            'students': [
                {
                    'name': f"{e.user.first_name or ''} {e.user.last_name or ''}".strip() or e.user.email,
                    'email': e.user.email,
                    'status': e.status,
                    'joined_at': e.joined_at.isoformat(),
                }
                for e in enrollments
            ],
        }
        if format_type == 'csv':
            import csv
            import io
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(['Name', 'Email', 'Status', 'Joined'])
            for e in enrollments:
                name = f"{e.user.first_name or ''} {e.user.last_name or ''}".strip() or e.user.email
                writer.writerow([name, e.user.email, e.status, e.joined_at.strftime('%Y-%m-%d')])
            from django.http import HttpResponse
            resp = HttpResponse(buf.getvalue(), content_type='text/csv')
            resp['Content-Disposition'] = f'attachment; filename="cohort-{cohort.name[:30].replace(chr(32), "_")}-report.csv"'
            return resp
        return Response(report_data)
    
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
