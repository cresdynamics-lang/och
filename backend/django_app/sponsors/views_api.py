"""
Sponsor/Employer API Views for OCH SMP Technical Specifications.
Implements all required APIs for sponsor/employer dashboard operations.
"""
import json
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.db import models, transaction
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.http import StreamingHttpResponse, HttpResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from organizations.models import Organization, OrganizationMember
from users.models import ConsentScope, UserRole, Role
from users.utils.consent_utils import check_consent
from programs.models import Cohort, Enrollment
from .models import (
    Sponsor, SponsorCohort, SponsorStudentCohort, SponsorAnalytics,
    SponsorIntervention, SponsorFinancialTransaction, SponsorCohortBilling,
    RevenueShareTracking
)
from .serializers import (
    SponsorSerializer, SponsorCohortSerializer, SponsorDashboardSerializer,
    SponsorAnalyticsSerializer
)
from .permissions import IsSponsorUser, IsSponsorAdmin, check_sponsor_access
from . import services as sponsor_services

User = get_user_model()


# =============================================================================
# 🔑 Identity & Organization APIs (prefix /api/v1/auth)
# =============================================================================

@api_view(['POST'])
@permission_classes([])
def sponsor_signup(request):
    """POST /api/v1/auth/signup - Create sponsor/employer admin accounts."""
    data = request.data
    
    required_fields = ['email', 'password', 'first_name', 'last_name', 'organization_name']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                user_type='sponsor_admin'
            )
            
            # Create sponsor organization
            from django.utils.text import slugify
            org_slug = slugify(data['organization_name'])[:50]
            
            sponsor = Sponsor.objects.create(
                slug=org_slug,
                name=data['organization_name'],
                sponsor_type=data.get('sponsor_type', 'corporate'),
                contact_email=data['email'],
                website=data.get('website'),
                country=data.get('country'),
                city=data.get('city'),
                region=data.get('region')
            )
            
            # Create organization record
            org = Organization.objects.create(
                slug=org_slug,
                name=data['organization_name'],
                org_type='sponsor',
                status='active',
                owner=user
            )
            
            # Add user as admin member
            OrganizationMember.objects.create(
                organization=org,
                user=user,
                role='admin'
            )
            
            # Assign sponsor admin role
            sponsor_role, _ = Role.objects.get_or_create(
                name='sponsor_admin',
                defaults={'description': 'Sponsor Administrator'}
            )
            UserRole.objects.create(
                user=user,
                role=sponsor_role,
                scope_type='organization',
                scope_id=str(org.id)
            )
            
            return Response({
                'user_id': str(user.id),
                'sponsor_id': str(sponsor.id),
                'organization_id': str(org.id),
                'message': 'Sponsor account created successfully'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'error': f'Failed to create sponsor account: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_sponsor_org(request):
    """POST /api/v1/auth/orgs - Create sponsor/employer organization entity."""
    data = request.data
    
    required_fields = ['name', 'sponsor_type']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from django.utils.text import slugify
        org_slug = slugify(data['name'])[:50]
        
        sponsor = Sponsor.objects.create(
            slug=org_slug,
            name=data['name'],
            sponsor_type=data['sponsor_type'],
            contact_email=data.get('contact_email', request.user.email),
            website=data.get('website'),
            country=data.get('country'),
            city=data.get('city'),
            region=data.get('region')
        )
        
        return Response({
            'sponsor_id': str(sponsor.id),
            'slug': sponsor.slug,
            'message': f'Sponsor organization "{sponsor.name}" created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create sponsor organization: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def add_org_members(request, org_id):
    """POST /api/v1/auth/orgs/{id}/members - Add sponsor admins or staff to the org."""
    data = request.data
    
    required_fields = ['user_emails', 'role']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        org = get_object_or_404(Organization, id=org_id, org_type='sponsor')
        
        # Verify user has admin access to this org
        if not OrganizationMember.objects.filter(
            organization=org, user=request.user, role='admin'
        ).exists():
            return Response({
                'error': 'Only organization admins can add members'
            }, status=status.HTTP_403_FORBIDDEN)
        
        added_members = []
        for email in data['user_emails']:
            try:
                user = User.objects.get(email=email)
                member, created = OrganizationMember.objects.get_or_create(
                    organization=org,
                    user=user,
                    defaults={'role': data['role']}
                )
                
                if created:
                    added_members.append({
                        'user_id': str(user.id),
                        'email': email,
                        'role': data['role']
                    })
                    
            except User.DoesNotExist:
                continue
        
        return Response({
            'added_members': added_members,
            'message': f'Added {len(added_members)} members to organization'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to add organization members: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def assign_sponsor_roles(request, user_id):
    """POST /api/v1/auth/users/{id}/roles - Assign sponsor roles scoped to org/cohort."""
    data = request.data
    
    required_fields = ['role_name', 'scope_type']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = get_object_or_404(User, id=user_id)
        role = get_object_or_404(Role, name=data['role_name'])
        
        user_role = UserRole.objects.create(
            user=user,
            role=role,
            scope_type=data['scope_type'],
            scope_id=data.get('scope_id')
        )
        
        return Response({
            'user_role_id': str(user_role.id),
            'message': f'Role "{role.name}" assigned to user'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to assign role: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_profile(request):
    """GET /api/v1/auth/me - Retrieve profile, roles, and consent scopes."""
    user = request.user
    
    # Get user roles
    user_roles = UserRole.objects.filter(user=user).select_related('role')
    roles_data = [{
        'role_name': ur.role.name,
        'scope_type': ur.scope_type,
        'scope_id': ur.scope_id
    } for ur in user_roles]
    
    # Get consent scopes
    consent_scopes = ConsentScope.objects.filter(user=user, granted=True)
    consents_data = [{
        'scope_type': cs.scope_type,
        'granted_at': cs.granted_at.isoformat(),
        'expires_at': cs.expires_at.isoformat() if cs.expires_at else None
    } for cs in consent_scopes]
    
    # Get sponsor organizations
    sponsor_orgs = Organization.objects.filter(
        org_type='sponsor',
        organizationmember__user=user
    ).distinct()
    
    orgs_data = [{
        'id': str(org.id),
        'name': org.name,
        'slug': org.slug,
        'role': OrganizationMember.objects.get(organization=org, user=user).role
    } for org in sponsor_orgs]
    
    return Response({
        'user_id': str(user.id),
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'user_type': user.user_type,
        'roles': roles_data,
        'consent_scopes': consents_data,
        'sponsor_organizations': orgs_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_consent_scopes(request):
    """POST /api/v1/auth/consents - Update consent scopes (e.g., employer view of candidate)."""
    data = request.data
    
    required_fields = ['scope_type', 'granted']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        consent, created = ConsentScope.objects.update_or_create(
            user=request.user,
            scope_type=data['scope_type'],
            defaults={
                'granted': data['granted'],
                'granted_at': timezone.now() if data['granted'] else None,
                'expires_at': None
            }
        )
        
        return Response({
            'consent_id': str(consent.id),
            'scope_type': consent.scope_type,
            'granted': consent.granted,
            'message': f'Consent scope "{consent.scope_type}" updated'
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to update consent: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# 📚 Program & Cohort Management APIs (prefix /api/v1/programs)
# =============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def create_sponsored_cohort(request):
    """POST /api/v1/programs/cohorts - Create sponsored cohorts."""
    data = request.data
    
    required_fields = ['name', 'track_slug', 'sponsor_slug']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        sponsor = get_object_or_404(Sponsor, slug=data['sponsor_slug'])
        
        cohort = SponsorCohort.objects.create(
            sponsor=sponsor,
            name=data['name'],
            track_slug=data['track_slug'],
            target_size=data.get('target_size', 100),
            start_date=data.get('start_date'),
            expected_graduation_date=data.get('expected_graduation_date'),
            budget_allocated=data.get('budget_allocated', 0),
            placement_goal=data.get('placement_goal', 0)
        )
        
        return Response({
            'cohort_id': str(cohort.id),
            'name': cohort.name,
            'sponsor': sponsor.name,
            'track_slug': cohort.track_slug,
            'message': 'Sponsored cohort created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create cohort: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def enroll_sponsored_students(request, cohort_id):
    """POST /api/v1/programs/cohorts/{id}/enrollments - Enroll sponsored students."""
    data = request.data
    
    required_fields = ['student_emails']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cohort = get_object_or_404(SponsorCohort, id=cohort_id)
        
        enrolled_students = []
        for email in data['student_emails']:
            try:
                student = User.objects.get(email=email)
                enrollment, created = SponsorStudentCohort.objects.get_or_create(
                    sponsor_cohort=cohort,
                    student=student,
                    defaults={
                        'enrollment_status': 'enrolled',
                        'is_active': True
                    }
                )
                
                if created:
                    enrolled_students.append({
                        'student_id': str(student.id),
                        'email': email,
                        'enrollment_id': str(enrollment.id)
                    })
                    
            except User.DoesNotExist:
                continue
        
        # Update cohort enrollment count
        cohort.students_enrolled = cohort.student_enrollments.filter(is_active=True).count()
        cohort.save()
        
        return Response({
            'enrolled_students': enrolled_students,
            'total_enrolled': len(enrolled_students),
            'message': f'Enrolled {len(enrolled_students)} students in cohort'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to enroll students: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def list_sponsored_students(request, cohort_id):
    """GET /api/v1/programs/cohorts/{id}/enrollments - List sponsored students in a cohort."""
    try:
        cohort = get_object_or_404(SponsorCohort, id=cohort_id)
        
        # Check sponsor access
        sponsor = check_sponsor_access(request.user, cohort.sponsor.slug)
        
        enrollments = SponsorStudentCohort.objects.filter(
            sponsor_cohort=cohort,
            is_active=True
        ).select_related('student')
        
        students_data = []
        for enrollment in enrollments:
            # Check consent for employer view
            has_consent = ConsentScope.objects.filter(
                user=enrollment.student,
                scope_type='employer_share',
                granted=True
            ).exists()
            
            student_data = {
                'enrollment_id': str(enrollment.id),
                'student_id': str(enrollment.student.id),
                'name': f"{enrollment.student.first_name} {enrollment.student.last_name}".strip(),
                'email': enrollment.student.email if has_consent else None,
                'enrollment_status': enrollment.enrollment_status,
                'completion_percentage': float(enrollment.completion_percentage),
                'joined_at': enrollment.joined_at.isoformat(),
                'last_activity_at': enrollment.last_activity_at.isoformat() if enrollment.last_activity_at else None,
                'has_employer_consent': has_consent
            }
            students_data.append(student_data)
        
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'students': students_data,
            'total_students': len(students_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to list students: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def cohort_reports(request, cohort_id):
    """GET /api/v1/programs/cohorts/{id}/reports - View seat utilization, completion rates, and payments."""
    try:
        cohort = get_object_or_404(SponsorCohort, id=cohort_id)
        
        # Check sponsor access
        sponsor = check_sponsor_access(request.user, cohort.sponsor.slug)
        
        # Calculate metrics
        total_enrolled = cohort.student_enrollments.filter(is_active=True).count()
        completed_students = cohort.student_enrollments.filter(enrollment_status='completed').count()
        
        # Seat utilization
        seat_utilization = (total_enrolled / cohort.target_size * 100) if cohort.target_size > 0 else 0
        
        # Completion rate
        completion_rate = (completed_students / total_enrolled * 100) if total_enrolled > 0 else 0
        
        # Financial metrics
        billing_records = SponsorCohortBilling.objects.filter(sponsor_cohort=cohort)
        total_cost = sum(record.total_cost for record in billing_records)
        total_revenue = sum(record.revenue_share_kes for record in billing_records)
        net_cost = total_cost - total_revenue
        
        # Payment status
        paid_invoices = billing_records.filter(payment_status='paid').count()
        pending_invoices = billing_records.filter(payment_status='pending').count()
        overdue_invoices = billing_records.filter(payment_status='overdue').count()
        
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'seat_utilization': {
                'target_seats': cohort.target_size,
                'used_seats': total_enrolled,
                'utilization_percentage': round(seat_utilization, 2)
            },
            'completion_metrics': {
                'total_enrolled': total_enrolled,
                'completed_students': completed_students,
                'completion_rate': round(completion_rate, 2),
                'average_completion_percentage': float(cohort.completion_rate)
            },
            'financial_summary': {
                'total_cost_kes': float(total_cost),
                'total_revenue_kes': float(total_revenue),
                'net_cost_kes': float(net_cost),
                'budget_allocated_kes': float(cohort.budget_allocated),
                'budget_utilization_pct': round((float(total_cost) / float(cohort.budget_allocated) * 100), 2) if cohort.budget_allocated > 0 else 0
            },
            'payment_status': {
                'paid_invoices': paid_invoices,
                'pending_invoices': pending_invoices,
                'overdue_invoices': overdue_invoices,
                'total_invoices': billing_records.count()
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate reports: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# 💳 Billing & Finance APIs (prefix /api/v1/billing)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def billing_catalog(request):
    """GET /api/v1/billing/catalog - View pricing models for seats/programs."""
    return Response({
        'pricing_models': [
            {
                'model_type': 'per_seat_monthly',
                'name': 'Per Seat Monthly',
                'description': 'Monthly fee per active student',
                'price_kes': 20000,
                'currency': 'KES',
                'billing_cycle': 'monthly'
            },
            {
                'model_type': 'mentor_session',
                'name': 'Mentor Session',
                'description': 'Per mentor session fee',
                'price_kes': 7000,
                'currency': 'KES',
                'billing_cycle': 'per_session'
            },
            {
                'model_type': 'lab_usage',
                'name': 'Lab Usage',
                'description': 'Per hour lab usage fee',
                'price_kes': 200,
                'currency': 'KES',
                'billing_cycle': 'per_hour'
            },
            {
                'model_type': 'revenue_share',
                'name': 'Revenue Share',
                'description': 'Revenue share from successful placements',
                'percentage': 3.0,
                'description_detail': '3% of first year salary'
            }
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def create_checkout_session(request):
    """POST /api/v1/billing/checkout/sessions - Pay for sponsored seats."""
    data = request.data
    
    required_fields = ['cohort_id', 'seats_count']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cohort = get_object_or_404(SponsorCohort, id=data['cohort_id'])
        
        # Calculate amount (20,000 KES per seat per month)
        seats_count = data['seats_count']
        price_per_seat = 20000  # KES
        total_amount = seats_count * price_per_seat
        
        # Create financial transaction
        transaction = SponsorFinancialTransaction.objects.create(
            sponsor=cohort.sponsor,
            cohort=cohort,
            transaction_type='platform_fee',
            description=f'Payment for {seats_count} seats in {cohort.name}',
            amount=total_amount,
            currency='KES',
            status='pending'
        )
        
        # In a real implementation, integrate with payment gateway
        checkout_session = {
            'session_id': str(transaction.id),
            'amount': total_amount,
            'currency': 'KES',
            'seats_count': seats_count,
            'cohort_name': cohort.name,
            'payment_url': f'/payment/checkout/{transaction.id}',  # Mock URL
            'expires_at': (timezone.now() + timedelta(hours=1)).isoformat()
        }
        
        return Response(checkout_session, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create checkout session: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def sponsor_invoices(request):
    """GET /api/v1/billing/invoices - Retrieve invoices linked to sponsor org."""
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get sponsor
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({'invoices': []})
        
        # Get billing records
        billing_records = SponsorCohortBilling.objects.filter(
            sponsor_cohort__sponsor=sponsor
        ).order_by('-billing_month')
        
        invoices_data = []
        for record in billing_records:
            invoice_data = {
                'invoice_id': str(record.id),
                'billing_month': record.billing_month.strftime('%Y-%m'),
                'cohort_name': record.sponsor_cohort.name,
                'total_amount_kes': float(record.total_cost),
                'revenue_share_kes': float(record.revenue_share_kes),
                'net_amount_kes': float(record.net_amount),
                'payment_status': record.payment_status,
                'payment_date': record.payment_date.isoformat() if record.payment_date else None,
                'invoice_generated': record.invoice_generated,
                'created_at': record.created_at.isoformat()
            }
            invoices_data.append(invoice_data)
        
        return Response({
            'invoices': invoices_data,
            'total_invoices': len(invoices_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve invoices: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def sponsor_entitlements(request):
    """GET /api/v1/billing/entitlements - Check seat entitlements for sponsored students."""
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get sponsor
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({'entitlements': []})
        
        # Get cohorts and calculate entitlements
        cohorts = SponsorCohort.objects.filter(sponsor=sponsor, is_active=True)
        
        entitlements_data = []
        for cohort in cohorts:
            active_students = cohort.student_enrollments.filter(is_active=True).count()
            
            entitlement = {
                'cohort_id': str(cohort.id),
                'cohort_name': cohort.name,
                'seats_allocated': cohort.target_size,
                'seats_used': active_students,
                'seats_available': cohort.target_size - active_students,
                'utilization_percentage': round((active_students / cohort.target_size * 100), 2) if cohort.target_size > 0 else 0,
                'track_slug': cohort.track_slug,
                'status': cohort.status
            }
            entitlements_data.append(entitlement)
        
        return Response({
            'entitlements': entitlements_data,
            'total_cohorts': len(entitlements_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve entitlements: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# 📢 Notifications & Automation APIs (prefix /api/v1/notifications)
# =============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorAdmin])
def send_sponsor_message(request):
    """POST /api/v1/notifications/send - Send sponsor/employer messages to students."""
    data = request.data
    
    required_fields = ['recipient_type', 'message', 'subject']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({
                'error': 'Sponsor organization not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get recipients based on type
        recipients = []
        if data['recipient_type'] == 'cohort' and 'cohort_id' in data:
            cohort = get_object_or_404(SponsorCohort, id=data['cohort_id'], sponsor=sponsor)
            enrollments = SponsorStudentCohort.objects.filter(
                sponsor_cohort=cohort,
                is_active=True
            ).select_related('student')
            recipients = [enrollment.student for enrollment in enrollments]
            
        elif data['recipient_type'] == 'all_students':
            # All sponsored students
            enrollments = SponsorStudentCohort.objects.filter(
                sponsor_cohort__sponsor=sponsor,
                is_active=True
            ).select_related('student')
            recipients = [enrollment.student for enrollment in enrollments]
            
        elif data['recipient_type'] == 'specific_students' and 'student_ids' in data:
            recipients = User.objects.filter(id__in=data['student_ids'])
        
        # TODO: Integrate with actual notification service
        # For now, just log the message
        message_log = {
            'sender': request.user.email,
            'sponsor': sponsor.name,
            'subject': data['subject'],
            'message': data['message'],
            'recipient_count': len(recipients),
            'sent_at': timezone.now().isoformat()
        }
        
        return Response({
            'message_id': f"msg_{timezone.now().timestamp()}",
            'recipients_count': len(recipients),
            'status': 'sent',
            'message': 'Message sent successfully to sponsored students'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to send message: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# 🔒 Consent & Privacy APIs (prefix /api/v1/privacy)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def sponsor_consents(request):
    """GET /api/v1/privacy/consents/my - View sponsor-related consents granted by students."""
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({'consents': []})
        
        # Get sponsored students
        sponsored_students = User.objects.filter(
            sponsor_enrollments__sponsor_cohort__sponsor=sponsor,
            sponsor_enrollments__is_active=True
        ).distinct()
        
        consents_data = []
        for student in sponsored_students:
            # Get consent scopes for this student
            consent_scopes = ConsentScope.objects.filter(
                user=student,
                granted=True
            )
            
            student_consents = {
                'student_id': str(student.id),
                'student_name': f"{student.first_name} {student.last_name}".strip(),
                'student_email': student.email,
                'consents': []
            }
            
            for consent in consent_scopes:
                consent_data = {
                    'scope_type': consent.scope_type,
                    'granted': consent.granted,
                    'granted_at': consent.granted_at.isoformat() if consent.granted_at else None,
                    'expires_at': consent.expires_at.isoformat() if consent.expires_at else None
                }
                student_consents['consents'].append(consent_data)
            
            consents_data.append(student_consents)
        
        return Response({
            'consents': consents_data,
            'total_students': len(consents_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve consents: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def check_student_consent(request):
    """POST /api/v1/privacy/check - Real-time consent check (e.g., employer viewing candidate profile)."""
    data = request.data
    
    required_fields = ['student_id', 'scope_type']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = get_object_or_404(User, id=data['student_id'])
        
        # Check if student is sponsored by this user's organization
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({
                'has_consent': False,
                'reason': 'Sponsor organization not found'
            })
        
        # Check if student is sponsored
        is_sponsored = SponsorStudentCohort.objects.filter(
            sponsor_cohort__sponsor=sponsor,
            student=student,
            is_active=True
        ).exists()
        
        if not is_sponsored:
            return Response({
                'has_consent': False,
                'reason': 'Student is not sponsored by your organization'
            })
        
        # Check consent
        has_consent = ConsentScope.objects.filter(
            user=student,
            scope_type=data['scope_type'],
            granted=True
        ).exists()
        
        return Response({
            'student_id': str(student.id),
            'scope_type': data['scope_type'],
            'has_consent': has_consent,
            'checked_at': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to check consent: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# 📊 Analytics & Reporting APIs (prefix /api/v1/analytics)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def sponsor_metrics(request, metric_key):
    """GET /api/v1/analytics/metrics/{key} - Sponsor dashboards (seat utilization, completion)."""
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({
                'error': 'Sponsor organization not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create analytics cache
        analytics, created = SponsorAnalytics.objects.get_or_create(
            sponsor=sponsor,
            defaults={
                'total_students': 0,
                'active_students': 0,
                'completion_rate': 0,
                'placement_rate': 0,
                'roi_multiplier': 1.0
            }
        )
        
        # Define available metrics
        metrics_map = {
            'seat_utilization': {
                'total_seats': sum(cohort.target_size for cohort in sponsor.cohorts.filter(is_active=True)),
                'used_seats': analytics.active_students,
                'utilization_percentage': (analytics.active_students / sum(cohort.target_size for cohort in sponsor.cohorts.filter(is_active=True)) * 100) if sum(cohort.target_size for cohort in sponsor.cohorts.filter(is_active=True)) > 0 else 0
            },
            'completion_rates': {
                'overall_completion_rate': float(analytics.completion_rate),
                'total_students': analytics.total_students,
                'active_students': analytics.active_students
            },
            'placement_metrics': {
                'placement_rate': float(analytics.placement_rate),
                'total_hires': analytics.total_hires,
                'hires_last_30d': analytics.hires_last_30d,
                'avg_salary_kes': analytics.avg_salary_kes
            },
            'roi_analysis': {
                'roi_multiplier': float(analytics.roi_multiplier),
                'avg_readiness_score': float(analytics.avg_readiness_score)
            }
        }
        
        if metric_key not in metrics_map:
            return Response({
                'error': f'Unknown metric key: {metric_key}',
                'available_metrics': list(metrics_map.keys())
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'metric_key': metric_key,
            'sponsor_id': str(sponsor.id),
            'sponsor_name': sponsor.name,
            'data': metrics_map[metric_key],
            'last_updated': analytics.last_updated.isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve metrics: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSponsorUser])
def export_dashboard_pdf(request, dashboard_id):
    """GET /api/v1/analytics/dashboards/{id}/pdf - Export sponsor-specific analytics reports."""
    try:
        # Get sponsor from user
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            organizationmember__user=request.user
        ).first()
        
        if not sponsor_orgs:
            return Response({
                'error': 'User is not associated with a sponsor organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        sponsor = Sponsor.objects.filter(slug=sponsor_orgs.slug).first()
        if not sponsor:
            return Response({
                'error': 'Sponsor organization not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # TODO: Implement actual PDF generation
        # For now, return a mock response
        
        pdf_data = {
            'dashboard_id': dashboard_id,
            'sponsor_name': sponsor.name,
            'generated_at': timezone.now().isoformat(),
            'pdf_url': f'/api/v1/analytics/dashboards/{dashboard_id}/pdf/download',
            'expires_at': (timezone.now() + timedelta(hours=24)).isoformat(),
            'file_size_bytes': 1024000,  # Mock 1MB
            'status': 'ready'
        }
        
        return Response(pdf_data)
        
    except Exception as e:
        return Response({
            'error': f'Failed to export dashboard: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_sponsors_to_cohort(request):
    """POST /api/v1/programs/cohorts/assign-sponsors - Assign sponsors to cohorts"""
    data = request.data
    
    required_fields = ['cohort_id', 'sponsor_assignments']
    for field in required_fields:
        if field not in data:
            return Response({
                'error': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from programs.models import Cohort
        from .models import SponsorCohortAssignment
        
        cohort = get_object_or_404(Cohort, id=data['cohort_id'])
        
        created_assignments = []
        for assignment_data in data['sponsor_assignments']:
            sponsor_uuid = assignment_data.get('sponsor_uuid_id')
            seat_allocation = assignment_data.get('seat_allocation', 1)
            role = assignment_data.get('role', 'funding')
            
            if not sponsor_uuid:
                continue
                
            try:
                sponsor_user = User.objects.get(uuid_id=sponsor_uuid)
                
                assignment, created = SponsorCohortAssignment.objects.get_or_create(
                    sponsor=sponsor_user,
                    cohort=cohort,
                    defaults={
                        'role': role,
                        'seat_allocation': seat_allocation,
                        'start_date': assignment_data.get('start_date'),
                        'end_date': assignment_data.get('end_date'),
                        'funding_agreement_id': assignment_data.get('funding_agreement_id')
                    }
                )
                
                if created:
                    created_assignments.append({
                        'assignment_id': str(assignment.id),
                        'sponsor_email': sponsor_user.email,
                        'cohort_name': cohort.name,
                        'seat_allocation': assignment.seat_allocation,
                        'role': assignment.role
                    })
                    
            except User.DoesNotExist:
                continue
        
        return Response({
            'message': f'Successfully assigned {len(created_assignments)} sponsor(s) to cohort',
            'assignments': created_assignments,
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to assign sponsors: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sponsor_assignments(request):
    """GET /api/v1/programs/cohorts/assignments - Get all sponsor assignments"""
    try:
        from .models import SponsorCohortAssignment
        
        assignments = SponsorCohortAssignment.objects.all().select_related('sponsor', 'cohort')
        
        assignments_data = []
        for assignment in assignments:
            assignment_data = {
                'id': str(assignment.id),
                'sponsor_uuid_id': str(assignment.sponsor.uuid_id),
                'sponsor_name': f"{assignment.sponsor.first_name} {assignment.sponsor.last_name}".strip(),
                'sponsor_email': assignment.sponsor.email,
                'cohort_id': str(assignment.cohort.id),
                'cohort_name': assignment.cohort.name,
                'role': assignment.role,
                'seat_allocation': assignment.seat_allocation,
                'start_date': assignment.start_date.isoformat() if assignment.start_date else None,
                'end_date': assignment.end_date.isoformat() if assignment.end_date else None,
                'funding_agreement_id': assignment.funding_agreement_id,
                'created_at': assignment.created_at.isoformat(),
                'updated_at': assignment.updated_at.isoformat()
            }
            assignments_data.append(assignment_data)
        
        return Response({
            'assignments': assignments_data,
            'total_assignments': len(assignments_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve assignments: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)