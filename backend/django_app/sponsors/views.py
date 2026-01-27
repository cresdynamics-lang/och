"""
Views for the Sponsors app.
Provides dashboard data and management endpoints for sponsors.
"""
import json
from datetime import datetime
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import Sponsor, SponsorCohort, SponsorStudentCohort, SponsorAnalytics
from . import services as sponsor_services
from .services.cohorts_service import SponsorCohortsService
from .services.finance_service import FinanceDataService
from .services.payment_service import PaymentService
from .permissions import IsSponsorUser, IsSponsorAdmin, check_sponsor_access, check_sponsor_admin_access
from .export_service import SponsorExportService
from .audit_service import SponsorAuditService
from .serializers import (
    SponsorSerializer,
    SponsorCohortSerializer,
    SponsorDashboardSerializer,
    SponsorAnalyticsSerializer,
    CohortListResponseSerializer,
    CohortDetailResponseSerializer
)

User = get_user_model()


class SponsorDashboardView(APIView):
    """
    GET /api/sponsors/[slug]/dashboard
    Returns comprehensive dashboard data for a sponsor.
    Cached for 5 minutes to improve performance.
    """
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request, slug):
        # Get sponsor and verify access
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor role/permission checking
        # For now, allow authenticated users to view any sponsor dashboard

        # Get active cohort (assuming one main cohort per sponsor for now)
        cohort = SponsorCohort.objects.filter(
            sponsor=sponsor,
            is_active=True
        ).first()

        if not cohort:
            return Response({
                'error': 'No active cohort found for this sponsor'
            }, status=status.HTTP_404_NOT_FOUND)

        # Aggregate dashboard data
        dashboard_data = self._build_dashboard_data(sponsor, cohort)

        # Log dashboard access
        SponsorAuditService.log_dashboard_access(request.user, sponsor, cohort)

        serializer = SponsorDashboardSerializer(dashboard_data)
        return Response(serializer.data)

    def _build_dashboard_data(self, sponsor, cohort):
        """Build comprehensive dashboard data structure"""

        # Executive Summary
        executive_summary = self._get_executive_summary(cohort)

        # Track Performance
        track_performance = self._get_track_performance(cohort)

        # Top Talent
        top_talent = self._get_top_talent(cohort)

        # Hiring Pipeline
        hiring_pipeline = self._get_hiring_pipeline(cohort)

        # AI Alerts
        ai_alerts = self._get_ai_alerts(cohort)

        return {
            'sponsor': {
                'id': str(sponsor.id),
                'name': sponsor.name,
                'slug': sponsor.slug,
                'type': sponsor.sponsor_type,
                'logo_url': sponsor.logo_url,
                'contact_email': sponsor.contact_email
            },
            'cohort': {
                'id': str(cohort.id),
                'name': cohort.name,
                'track_slug': cohort.track_slug,
                'students_enrolled': cohort.students_enrolled,
                'start_date': cohort.start_date,
                'completion_rate': float(cohort.completion_rate)
            },
            'executive_summary': executive_summary,
            'track_performance': track_performance,
            'top_talent': top_talent,
            'hiring_pipeline': hiring_pipeline,
            'ai_alerts': ai_alerts
        }

    def _get_executive_summary(self, cohort):
        """Calculate executive summary metrics"""
        # Get enrolled students
        enrolled_students = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort,
            is_active=True
        )

        active_students = enrolled_students.count()

        # Calculate completion rate (average of individual completion rates)
        completion_rates = enrolled_students.values_list('completion_percentage', flat=True)
        completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0

        # Mock placement rate and ROI (would be calculated from employer data)
        placement_rate = 23.4  # Mock value
        roi = 4.2  # Mock KES 42M value / KES 10M cost

        # Hires in last 30 days (mock)
        hires_last_30d = 8

        # AI readiness average (mock)
        ai_readiness_avg = 82.7

        return {
            'active_students': active_students,
            'completion_rate': round(completion_rate, 2),
            'placement_rate': placement_rate,
            'roi': roi,
            'hires_last_30d': hires_last_30d,
            'ai_readiness_avg': ai_readiness_avg
        }

    def _get_track_performance(self, cohort):
        """Get performance metrics for the 5 tracks"""
        # Mock data - in production would aggregate from curriculum tables
        tracks = ['defender', 'grc', 'innovation', 'leadership', 'offensive']

        track_performance = []
        for track_slug in tracks:
            # Mock performance data
            track_data = {
                'track_slug': track_slug,
                'students_enrolled': 25,  # Mock
                'completion_rate': 68.2,  # Mock
                'avg_time_to_complete_days': 45,  # Mock
                'top_performer': {
                    'student_name': 'Sarah K.',
                    'completion_percentage': 95.0,
                    'completion_time_days': 38
                },
                'hiring_outcomes': {
                    'total_hires': 12,
                    'avg_salary_kes': 3200000,
                    'top_employer': 'MTN'
                }
            }
            track_performance.append(track_data)

        return track_performance

    def _get_top_talent(self, cohort):
        """Get top 25 students by readiness score"""
        # Get AI insights including readiness scores
        ai_insights = sponsor_services.SponsorAIService.get_dashboard_ai_insights(cohort)
        readiness_scores = ai_insights['readiness_scores']

        # Convert to expected format and get top 25
        top_talent = []
        for score_data in readiness_scores[:25]:
            talent = {
                'id': score_data['student_id'],
                'name': score_data['student_name'],
                'email': score_data['student_email'],
                'readiness_score': score_data['readiness_score'],
                'track_completion_pct': score_data['completion_percentage'],
                'top_skills': ['Network Security', 'Incident Response', 'Python'],  # Mock skills
                'cohort_rank': score_data['cohort_rank'],
                'last_activity_days': 3,  # Mock - would calculate from last_activity
                'mentor_sessions_completed': 5,  # Mock
                'missions_completed': 12  # Mock
            }
            top_talent.append(talent)

        return top_talent

    def _get_hiring_pipeline(self, cohort):
        """Get hiring pipeline data"""
        # Mock hiring pipeline stages
        pipeline_stages = [
            {
                'stage': 'Applied',
                'count': 45,
                'conversion_rate': 100.0
            },
            {
                'stage': 'Screened',
                'count': 32,
                'conversion_rate': 71.1
            },
            {
                'stage': 'Interviewed',
                'count': 18,
                'conversion_rate': 56.3
            },
            {
                'stage': 'Offer Extended',
                'count': 8,
                'conversion_rate': 44.4
            },
            {
                'stage': 'Hired',
                'count': 6,
                'conversion_rate': 75.0
            }
        ]

        return {
            'total_candidates': 45,
            'hired_count': 6,
            'overall_conversion_rate': 13.3,
            'avg_time_to_hire_days': 21,
            'stages': pipeline_stages
        }

    def _get_ai_alerts(self, cohort):
        """Get AI-generated alerts and recommendations"""
        # Get AI insights including alerts
        ai_insights = sponsor_services.SponsorAIService.get_dashboard_ai_insights(cohort)

        # Format alerts for dashboard
        alerts = []
        for alert in ai_insights['ai_alerts']:
            formatted_alert = {
                'id': f"ai-alert-{alert['type']}-{cohort.id}",
                'type': alert['type'],
                'priority': alert['priority'],
                'title': alert['title'],
                'description': alert['description'],
                'cohort_name': alert['cohort_name'],
                'risk_score': alert.get('risk_score'),
                'recommended_action': alert['recommended_action'],
                'roi_estimate': alert['roi_estimate'],
                'action_url': alert['action_url'],
                'expires_at': None
            }
            alerts.append(formatted_alert)

        # Add mock additional alerts for demonstration
        alerts.extend([
            {
                'id': f'placement-bottleneck-{cohort.id}',
                'type': 'placement_bottleneck',
                'priority': 2,
                'title': 'Interview Conversion Bottleneck',
                'description': '18 interviews → 2 hires (11% conversion rate) indicates potential skills gap or interview process issues.',
                'cohort_name': cohort.name,
                'recommended_action': 'Skills gap analysis + employer relationship sync',
                'roi_estimate': '2.1x',
                'action_url': f'/sponsor/{cohort.sponsor.slug}/placement',
                'expires_at': None
            },
            {
                'id': f'curriculum-completion-{cohort.id}',
                'type': 'curriculum_completion',
                'priority': 3,
                'title': f"{cohort.completion_rate:.1f}% Overall Completion Rate",
                'description': f'Strong progress across all tracks with {cohort.completion_rate:.1f}% completion rate.',
                'cohort_name': cohort.name,
                'recommended_action': 'Consider advanced certifications and specialization tracks',
                'roi_estimate': '1.8x',
                'action_url': f'/sponsor/{cohort.sponsor.slug}/curriculum',
                'expires_at': None
            }
        ])

        return alerts


class SponsorInterventionView(APIView):
    """
    POST /api/sponsors/[slug]/cohorts/[cohortId]/interventions
    Deploy AI interventions for cohort students.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, cohort_id):
        # Get cohort and verify sponsor access
        cohort = get_object_or_404(
            SponsorCohort,
            id=cohort_id,
            sponsor__slug=slug,
            is_active=True
        )

        intervention_type = request.data.get('intervention_type')
        title = request.data.get('title', f'AI Intervention: {intervention_type}')
        description = request.data.get('description', '')

        if not intervention_type:
            return Response({
                'error': 'intervention_type is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create intervention record
        from .models import SponsorIntervention
        intervention = SponsorIntervention.objects.create(
            sponsor_cohort=cohort,
            intervention_type=intervention_type,
            title=title,
            description=description,
            ai_trigger_reason=request.data.get('ai_trigger_reason', ''),
            expected_roi=request.data.get('expected_roi', 1.0),
            status='deployed'
        )

        # Log intervention deployment
        SponsorAuditService.log_intervention_deployment(request.user, intervention)

        # TODO: Actually deploy the intervention (send notifications, assign mentors, etc.)
        # For now, just log it

        return Response({
            'intervention_id': str(intervention.id),
            'status': 'deployed',
            'message': f'{intervention_type} intervention deployed for {cohort.students_enrolled} students'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_list(request):
    """GET /api/sponsors - List all active sponsors"""
    sponsors = Sponsor.objects.filter(is_active=True)
    serializer = SponsorSerializer(sponsors, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_detail(request, slug):
    """GET /api/sponsors/[slug] - Get sponsor details"""
    sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
    serializer = SponsorSerializer(sponsor)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_stream(request, slug):
    """
    GET /api/sponsors/[slug]/stream
    Server-Sent Events endpoint for real-time sponsor dashboard updates
    """
    sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

    # Return SSE response
    from django.http import StreamingHttpResponse
    from django.core.cache import cache

    def event_generator():
        """Generate SSE events for dashboard updates"""
        last_update = None

        while True:
            # Check for updates every 30 seconds
            cache_key = f'sponsor_dashboard_updates_{sponsor.id}'
            current_update = cache.get(cache_key)

            if current_update and current_update != last_update:
                # Send update event
                yield f"event: dashboard_update\ndata: {json.dumps(current_update)}\n\n"
                last_update = current_update

            # Also send periodic ping to keep connection alive
            yield f"event: ping\ndata: {json.dumps({'timestamp': timezone.now().isoformat()})}\n\n"

            # Wait before checking again
            import time
            time.sleep(30)

    response = StreamingHttpResponse(
        event_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_export(request, slug):
    """
    GET /api/sponsors/[slug]/export?format=csv|pdf|pptx
    Export sponsor dashboard data in various formats
    """
    sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
    export_format = request.GET.get('format', 'csv').lower()

    # Get active cohort
    cohort = SponsorCohort.objects.filter(
        sponsor=sponsor,
        is_active=True
    ).first()

    if not cohort:
        return Response({
            'error': 'No active cohort found for this sponsor'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        # Log export action
        SponsorAuditService.log_export_action(request.user, sponsor, export_format, cohort)

        if export_format == 'csv':
            return SponsorExportService.generate_csv_export(sponsor, cohort)
        elif export_format == 'pdf':
            return SponsorExportService.generate_pdf_export(sponsor, cohort)
        elif export_format in ['pptx', 'ppt']:
            return SponsorExportService.generate_pptx_export(sponsor, cohort)
        else:
            return Response({
                'error': 'Unsupported export format. Use csv, pdf, or pptx'
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Export failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SponsorCohortsListView(APIView):
    """
    GET /api/sponsors/[slug]/cohorts - List all cohorts for a sponsor
    POST /api/sponsors/[slug]/cohorts - Create a new cohort
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor access control
        cohorts = SponsorCohortsService.get_cohorts_list(sponsor)

        response_data = {
            'sponsor': {
                'id': str(sponsor.id),
                'name': sponsor.name,
                'slug': sponsor.slug
            },
            'cohorts': cohorts
        }

        serializer = CohortListResponseSerializer(response_data)
        return Response(serializer.data)

    def post(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor admin permission check

        required_fields = ['name', 'track_slug']
        for field in required_fields:
            if field not in request.data:
                return Response({
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate track_slug
        valid_tracks = ['defender', 'grc', 'innovation', 'leadership', 'offensive']
        if request.data['track_slug'] not in valid_tracks:
            return Response({
                'error': f'Invalid track_slug. Must be one of: {", ".join(valid_tracks)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            cohort = SponsorCohortsService.create_cohort(sponsor, request.data)

            # Log cohort creation
            SponsorAuditService.log_cohort_action(
                request.user, cohort, 'cohort_created',
                {'track_slug': cohort.track_slug, 'target_size': cohort.target_size}
            )

            return Response({
                'cohort_id': str(cohort.id),
                'message': f'Cohort "{cohort.name}" created successfully',
                'status': cohort.status
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Failed to create cohort: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SponsorCohortsDetailView(APIView):
    """
    GET /api/sponsors/[slug]/cohorts/[cohortId]
    Get detailed information for a specific cohort
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug, cohort_id):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
        cohort = get_object_or_404(
            SponsorCohort,
            id=cohort_id,
            sponsor=sponsor
        )

        # TODO: Add sponsor access control
        cohort_detail = SponsorCohortsService.get_cohort_detail(cohort)

        serializer = CohortDetailResponseSerializer(cohort_detail)
        return Response(serializer.data)


class AddStudentsToCohortView(APIView):
    """
    POST /api/sponsors/[slug]/cohorts/[cohortId]/students
    Add students to a cohort via various methods
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, cohort_id):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
        cohort = get_object_or_404(
            SponsorCohort,
            id=cohort_id,
            sponsor=sponsor
        )

        # TODO: Add sponsor admin permission check

        method = request.data.get('method')
        if not method:
            return Response({
                'error': 'method is required (csv, auto_enroll, manual)'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = SponsorCohortsService.add_students_to_cohort(cohort, request.data)

            # Log student enrollment
            SponsorAuditService.log_cohort_action(
                request.user, cohort, 'students_added',
                {'method': method, 'added_count': result['added']}
            )

            return Response({
                'message': f'Added {result["added"]} students to cohort {cohort.name}',
                'result': result
            })

        except Exception as e:
            return Response({
                'error': f'Failed to add students: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CohortAIInterventionView(APIView):
    """
    POST /api/sponsors/[slug]/cohorts/[cohortId]/interventions
    Deploy AI intervention suite for the cohort
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, cohort_id):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
        cohort = get_object_or_404(
            SponsorCohort,
            id=cohort_id,
            sponsor=sponsor
        )

        # TODO: Add sponsor admin permission check

        intervention_type = request.data.get('type', 'comprehensive')
        valid_types = ['comprehensive', 'nudge', 'mentor', 'recipe', 'quiz']

        if intervention_type not in valid_types:
            return Response({
                'error': f'Invalid intervention type. Must be one of: {", ".join(valid_types)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = SponsorCohortsService.deploy_ai_intervention(cohort, request.data)

            # Log intervention deployment
            SponsorAuditService.log_cohort_action(
                request.user, cohort, 'intervention_deployed',
                {'intervention_type': intervention_type, 'deployed_count': result['total_deployed']}
            )

            return Response({
                'message': f'Deployed {result["total_deployed"]} AI interventions for cohort {cohort.name}',
                'result': result
            })

        except Exception as e:
            return Response({
                'error': f'Failed to deploy interventions: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SponsorFinanceOverviewView(APIView):
    """
    GET /api/sponsors/[slug]/finance
    Get comprehensive financial overview for a sponsor
    """
    permission_classes = [IsSponsorUser]

    def get(self, request, slug):
        sponsor = check_sponsor_access(request.user, slug)
        finance_data = FinanceDataService.get_finance_overview(sponsor)

        return Response(finance_data)


class SponsorCohortBillingView(APIView):
    """
    GET /api/sponsors/[slug]/cohorts/[cohortId]/billing
    Get detailed billing information for a cohort
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug, cohort_id):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)
        cohort = get_object_or_404(
            SponsorCohort,
            id=cohort_id,
            sponsor=sponsor
        )

        # TODO: Add sponsor access control
        billing_data = FinanceDataService.get_cohort_billing_detail(cohort)

        return Response(billing_data)


class GenerateInvoiceView(APIView):
    """
    POST /api/sponsors/[slug]/invoices
    Generate invoice for sponsor or specific cohort
    """
    permission_classes = [IsSponsorAdmin]

    def post(self, request, slug):
        sponsor = check_sponsor_admin_access(request.user, slug)

        cohort_id = request.data.get('cohort_id')
        billing_month_str = request.data.get('billing_month')

        billing_month = None
        if billing_month_str:
            try:
                billing_month = datetime.fromisoformat(billing_month_str).date()
            except ValueError:
                return Response({
                    'error': 'Invalid billing_month format. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invoice_data = FinanceDataService.generate_invoice(sponsor, cohort_id, billing_month)

            # Log invoice generation
            SponsorAuditService.log_cohort_action(
                request.user, None, 'invoice_generated',
                {'cohort_id': cohort_id, 'billing_month': billing_month_str}
            )

            return Response(invoice_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': f'Failed to generate invoice: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkPaymentView(APIView):
    """
    POST /api/sponsors/[slug]/payments
    Mark a billing record as paid
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor admin permission check

        billing_record_id = request.data.get('billing_record_id')
        payment_date_str = request.data.get('payment_date')

        if not billing_record_id:
            return Response({
                'error': 'billing_record_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        payment_date = None
        if payment_date_str:
            try:
                payment_date = datetime.fromisoformat(payment_date_str)
            except ValueError:
                return Response({
                    'error': 'Invalid payment_date format. Use ISO format'
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment_data = FinanceDataService.mark_payment(sponsor, billing_record_id, payment_date)

            # Log payment
            SponsorAuditService.log_cohort_action(
                request.user, None, 'payment_marked',
                {'billing_record_id': billing_record_id, 'amount': payment_data['amount_paid']}
            )

            return Response(payment_data)

        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Failed to mark payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentSummaryView(APIView):
    """
    GET /api/sponsors/[slug]/payments/summary
    Get payment summary for a sponsor
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor access control
        summary = PaymentService.get_payment_summary(sponsor)

        return Response(summary)


class ProcessPaymentView(APIView):
    """
    POST /api/sponsors/[slug]/payments/process
    Process a payment for a billing record
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor admin permission check

        billing_record_id = request.data.get('billing_record_id')
        payment_amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'bank_transfer')
        payment_date_str = request.data.get('payment_date')

        if not billing_record_id or not payment_amount:
            return Response({
                'error': 'billing_record_id and amount are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment_amount = float(payment_amount)
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid payment amount'
            }, status=status.HTTP_400_BAD_REQUEST)

        payment_date = None
        if payment_date_str:
            try:
                payment_date = datetime.fromisoformat(payment_date_str)
            except ValueError:
                return Response({
                    'error': 'Invalid payment_date format. Use ISO format'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Get billing record
        try:
            billing_record = get_object_or_404(
                SponsorCohortBilling,
                id=billing_record_id,
                sponsor_cohort__sponsor=sponsor
            )
        except:
            return Response({
                'error': 'Billing record not found'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            payment_result = PaymentService.process_payment(
                sponsor, billing_record, payment_amount, payment_date, payment_method
            )

            # Log payment
            SponsorAuditService.log_cohort_action(
                request.user, billing_record.sponsor_cohort, 'payment_processed',
                {'amount': payment_amount, 'method': payment_method}
            )

            return Response(payment_result)

        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Failed to process payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessRevenueSharePaymentView(APIView):
    """
    POST /api/sponsors/[slug]/revenue-share/[id]/pay
    Mark a revenue share payment as paid
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, revenue_share_id):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor admin permission check

        payment_date_str = request.data.get('payment_date')

        payment_date = None
        if payment_date_str:
            try:
                payment_date = datetime.fromisoformat(payment_date_str)
            except ValueError:
                return Response({
                    'error': 'Invalid payment_date format. Use ISO format'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Get revenue share record
        try:
            from .models import RevenueShareTracking
            revenue_share = get_object_or_404(
                RevenueShareTracking,
                id=revenue_share_id,
                sponsor=sponsor
            )
        except:
            return Response({
                'error': 'Revenue share record not found'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            payment_result = PaymentService.process_revenue_share_payment(
                revenue_share, payment_date
            )

            # Log payment
            SponsorAuditService.log_cohort_action(
                request.user, revenue_share.cohort, 'revenue_share_paid',
                {'amount': float(revenue_share.revenue_share_3pct)}
            )

            return Response(payment_result)

        except Exception as e:
            return Response({
                'error': f'Failed to process revenue share payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentTermsView(APIView):
    """
    GET /api/sponsors/[slug]/payment-terms
    POST /api/sponsors/[slug]/payment-terms
    Get or update payment terms configuration
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor access control
        # For now, return default terms
        terms = {
            'payment_terms_days': 30,
            'auto_reminders': True,
            'preferred_currency': 'KES',
            'payment_methods': ['bank_transfer', 'mpesa', 'card'],
            'late_payment_fee': 0.02  # 2% per month
        }

        return Response(terms)

    def post(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor admin permission check

        try:
            terms_result = PaymentService.configure_payment_terms(sponsor, request.data)

            # Log terms update
            SponsorAuditService.log_cohort_action(
                request.user, None, 'payment_terms_updated',
                request.data
            )

            return Response(terms_result)

        except Exception as e:
            return Response({
                'error': f'Failed to update payment terms: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FinanceRealtimeView(APIView):
    """
    GET /api/sponsors/[slug]/finance/stream
    Server-Sent Events endpoint for real-time financial updates
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        sponsor = get_object_or_404(Sponsor, slug=slug, is_active=True)

        # TODO: Add sponsor access control

        def event_stream():
            # Send initial connection confirmation
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'sponsor': sponsor.name})}\n\n"

            # Monitor for financial updates (simplified - in production use Django Channels or similar)
            last_update = datetime.now()

            while True:
                current_time = datetime.now()

                # Check for new billing records
                from .models import SponsorCohortBilling, SponsorFinancialTransaction
                new_billing = SponsorCohortBilling.objects.filter(
                    sponsor_cohort__sponsor=sponsor,
                    created_at__gt=last_update
                ).exists()

                # Check for new transactions
                new_transactions = SponsorFinancialTransaction.objects.filter(
                    sponsor=sponsor,
                    created_at__gt=last_update
                ).exists()

                # Check for payment status changes
                payment_changes = SponsorCohortBilling.objects.filter(
                    sponsor_cohort__sponsor=sponsor,
                    updated_at__gt=last_update
                ).exists()

                if new_billing or new_transactions or payment_changes:
                    # Send update notification
                    yield f"event: finance_update\ndata: {json.dumps({'type': 'data_changed', 'timestamp': current_time.isoformat()})}\n\n"
                    last_update = current_time

                # Check for overdue payments
                overdue_count = SponsorCohortBilling.objects.filter(
                    sponsor_cohort__sponsor=sponsor,
                    payment_status='overdue'
                ).count()

                yield f"event: overdue_alert\ndata: {json.dumps({'overdue_count': overdue_count})}\n\n"

                # Wait before next check (30 seconds)
                import time
                time.sleep(30)

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'

        return response