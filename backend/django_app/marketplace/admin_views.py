"""
Admin API views for Marketplace/Career module management.
Only accessible to admin users (is_staff=True).
"""
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import generics
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate
import logging

from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting, JobApplication
from .serializers import (
    EmployerSerializer,
    MarketplaceProfileListSerializer,
    MarketplaceProfileDetailSerializer,
    EmployerInterestLogSerializer,
    JobPostingSerializer,
    JobApplicationSerializer,
)
from users.models import UserRole, Role
from users.utils.audit_utils import log_audit_event

User = get_user_model()
logger = logging.getLogger(__name__)


class IsAdmin(permissions.BasePermission):
    """Permission check for admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class AdminEmployerViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing employers.
    
    GET /api/v1/admin/marketplace/employers/ - List all employers
    POST /api/v1/admin/marketplace/employers/ - Create employer (for onboarding)
    GET /api/v1/admin/marketplace/employers/{id}/ - Get employer details
    PATCH /api/v1/admin/marketplace/employers/{id}/ - Update employer
    DELETE /api/v1/admin/marketplace/employers/{id}/ - Delete employer
    POST /api/v1/admin/marketplace/employers/{id}/suspend/ - Suspend employer account
    POST /api/v1/admin/marketplace/employers/{id}/assign-admin/ - Assign employer admin role
    """
    queryset = Employer.objects.all().select_related('user')
    permission_classes = [IsAdmin]
    serializer_class = EmployerSerializer
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return EmployerSerializer
        return EmployerSerializer
    
    def get_queryset(self):
        queryset = Employer.objects.all().select_related('user')
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(sector__icontains=search) |
                Q(country__icontains=search)
            )
        
        # Filter by country
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country=country)
        
        # Filter by sector
        sector = self.request.query_params.get('sector')
        if sector:
            queryset = queryset.filter(sector=sector)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create a new employer (onboarding)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get or create user
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {'detail': 'user_email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response(
                {'detail': f'User with email {user_email} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already has employer profile
        if hasattr(user, 'employer_profile'):
            return Response(
                {'detail': 'User already has an employer profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employer = serializer.save(user=user)
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='employer_created',
            resource_type='employer',
            resource_id=str(employer.id),
            metadata={'company_name': employer.company_name}
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend an employer account."""
        employer = self.get_object()
        user = employer.user
        
        # Deactivate user account
        user.is_active = False
        user.save()
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='employer_suspended',
            resource_type='employer',
            resource_id=str(employer.id),
            metadata={'company_name': employer.company_name, 'reason': request.data.get('reason', '')}
        )
        
        return Response({
            'detail': f'Employer {employer.company_name} has been suspended',
            'employer': EmployerSerializer(employer).data
        })
    
    @action(detail=True, methods=['post'])
    def unsuspend(self, request, pk=None):
        """Unsuspend an employer account."""
        employer = self.get_object()
        user = employer.user
        
        # Activate user account
        user.is_active = True
        user.save()
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='employer_unsuspended',
            resource_type='employer',
            resource_id=str(employer.id),
            metadata={'company_name': employer.company_name}
        )
        
        return Response({
            'detail': f'Employer {employer.company_name} has been unsuspended',
            'employer': EmployerSerializer(employer).data
        })
    
    @action(detail=True, methods=['post'])
    def assign_admin(self, request, pk=None):
        """Assign employer admin role to a user within the company."""
        employer = self.get_object()
        user_email = request.data.get('user_email')
        
        if not user_email:
            return Response(
                {'detail': 'user_email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response(
                {'detail': f'User with email {user_email} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create sponsor_admin role
        try:
            role = Role.objects.get(name='sponsor_admin')
        except Role.DoesNotExist:
            return Response(
                {'detail': 'sponsor_admin role does not exist'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Assign role
        user_role, created = UserRole.objects.get_or_create(
            user=target_user,
            role=role,
            scope='employer',
            scope_ref=str(employer.id),
            defaults={'assigned_by': request.user, 'is_active': True}
        )
        
        if not created:
            user_role.is_active = True
            user_role.assigned_by = request.user
            user_role.save()
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='employer_admin_assigned',
            resource_type='employer',
            resource_id=str(employer.id),
            metadata={
                'company_name': employer.company_name,
                'assigned_user': target_user.email
            }
        )
        
        return Response({
            'detail': f'Employer admin role assigned to {target_user.email}',
            'user_role': {
                'id': user_role.id,
                'user': target_user.email,
                'role': role.name,
                'scope': user_role.scope,
                'scope_ref': user_role.scope_ref
            }
        })


class AdminMarketplaceProfileViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing marketplace profiles.
    
    GET /api/v1/admin/marketplace/profiles/ - List all profiles
    GET /api/v1/admin/marketplace/profiles/{id}/ - Get profile details
    PATCH /api/v1/admin/marketplace/profiles/{id}/ - Update profile (status, visibility)
    """
    queryset = MarketplaceProfile.objects.all().select_related('mentee')
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return MarketplaceProfileDetailSerializer
        return MarketplaceProfileListSerializer
    
    def get_queryset(self):
        queryset = MarketplaceProfile.objects.all().select_related('mentee')
        
        # Filter by profile status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(profile_status=status_filter)
        
        # Filter by tier
        tier = self.request.query_params.get('tier')
        if tier:
            queryset = queryset.filter(tier=tier)
        
        # Filter by visibility
        is_visible = self.request.query_params.get('is_visible')
        if is_visible is not None:
            queryset = queryset.filter(is_visible=is_visible.lower() == 'true')
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(mentee__email__icontains=search) |
                Q(mentee__first_name__icontains=search) |
                Q(mentee__last_name__icontains=search) |
                Q(primary_role__icontains=search)
            )
        
        # Filter by min readiness score
        min_readiness = self.request.query_params.get('min_readiness')
        if min_readiness:
            try:
                queryset = queryset.filter(readiness_score__gte=float(min_readiness))
            except ValueError:
                pass
        
        return queryset.order_by('-last_updated_at')
    
    def update(self, request, *args, **kwargs):
        """Update marketplace profile (status, visibility, etc.)."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Log changes
        changes = {}
        if 'profile_status' in request.data:
            changes['profile_status'] = {
                'old': instance.profile_status,
                'new': request.data['profile_status']
            }
        if 'is_visible' in request.data:
            changes['is_visible'] = {
                'old': instance.is_visible,
                'new': request.data['is_visible']
            }
        
        serializer.save()
        
        # Log audit event
        if changes:
            log_audit_event(
                request=request,
                user=request.user,
                action='marketplace_profile_updated',
                resource_type='marketplace_profile',
                resource_id=str(instance.id),
                metadata={
                    'mentee_email': instance.mentee.email,
                    'changes': changes
                }
            )
        
        return Response(serializer.data)


class AdminJobPostingViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for moderating job postings.
    
    GET /api/v1/admin/marketplace/jobs/ - List all job postings
    GET /api/v1/admin/marketplace/jobs/{id}/ - Get job details
    PATCH /api/v1/admin/marketplace/jobs/{id}/ - Update job (moderation)
    DELETE /api/v1/admin/marketplace/jobs/{id}/ - Delete job
    POST /api/v1/admin/marketplace/jobs/{id}/approve/ - Approve job posting
    POST /api/v1/admin/marketplace/jobs/{id}/reject/ - Reject job posting
    """
    queryset = JobPosting.objects.all().select_related('employer', 'employer__user')
    permission_classes = [IsAdmin]
    serializer_class = JobPostingSerializer
    
    def get_queryset(self):
        queryset = JobPosting.objects.all().select_related('employer', 'employer__user')
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by employer
        employer_id = self.request.query_params.get('employer_id')
        if employer_id:
            queryset = queryset.filter(employer_id=employer_id)
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(employer__company_name__icontains=search)
            )
        
        return queryset.order_by('-posted_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a job posting."""
        job = self.get_object()
        job.is_active = True
        job.save()
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='job_posting_approved',
            resource_type='job_posting',
            resource_id=str(job.id),
            metadata={'title': job.title, 'employer': job.employer.company_name}
        )
        
        return Response({
            'detail': 'Job posting approved',
            'job': JobPostingSerializer(job).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a job posting."""
        job = self.get_object()
        job.is_active = False
        job.save()
        
        reason = request.data.get('reason', '')
        
        # Log audit event
        log_audit_event(
            request=request,
            user=request.user,
            action='job_posting_rejected',
            resource_type='job_posting',
            resource_id=str(job.id),
            metadata={
                'title': job.title,
                'employer': job.employer.company_name,
                'reason': reason
            }
        )
        
        return Response({
            'detail': 'Job posting rejected',
            'job': JobPostingSerializer(job).data
        })


class AdminInterestLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for monitoring employer interest logs.
    
    GET /api/v1/admin/marketplace/interest-logs/ - List all interest logs
    GET /api/v1/admin/marketplace/interest-logs/{id}/ - Get log details
    GET /api/v1/admin/marketplace/interest-logs/stats/ - Get statistics
    """
    queryset = EmployerInterestLog.objects.all().select_related('employer', 'profile', 'profile__mentee')
    permission_classes = [IsAdmin]
    serializer_class = EmployerInterestLogSerializer
    
    def get_queryset(self):
        queryset = EmployerInterestLog.objects.all().select_related('employer', 'profile', 'profile__mentee')
        
        # Filter by action
        action_filter = self.request.query_params.get('action')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
        # Filter by employer
        employer_id = self.request.query_params.get('employer_id')
        if employer_id:
            queryset = queryset.filter(employer_id=employer_id)
        
        # Filter by profile
        profile_id = self.request.query_params.get('profile_id')
        if profile_id:
            queryset = queryset.filter(profile_id=profile_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get interest log statistics."""
        queryset = self.get_queryset()
        
        # Count by action
        action_counts = queryset.values('action').annotate(count=Count('id'))
        
        # Count by date
        daily_counts = queryset.annotate(date=TruncDate('created_at')).values('date').annotate(
            count=Count('id')
        ).order_by('-date')[:30]
        
        # Top employers by activity
        top_employers = queryset.values('employer__company_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Top profiles by interest
        top_profiles = queryset.values('profile__mentee__email').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'action_counts': list(action_counts),
            'daily_counts': list(daily_counts),
            'top_employers': list(top_employers),
            'top_profiles': list(top_profiles),
            'total_logs': queryset.count()
        })


class AdminMarketplaceAnalyticsView(generics.GenericAPIView):
    """
    Admin view for marketplace analytics and insights.
    
    GET /api/v1/admin/marketplace/analytics/ - Get marketplace analytics
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        """Get marketplace analytics."""
        # Profile statistics
        total_profiles = MarketplaceProfile.objects.count()
        visible_profiles = MarketplaceProfile.objects.filter(is_visible=True).count()
        profiles_by_status = MarketplaceProfile.objects.values('profile_status').annotate(
            count=Count('id')
        )
        profiles_by_tier = MarketplaceProfile.objects.values('tier').annotate(
            count=Count('id')
        )
        
        # Readiness scores
        avg_readiness = MarketplaceProfile.objects.aggregate(
            avg=Avg('readiness_score')
        )['avg'] or 0
        
        job_ready_count = MarketplaceProfile.objects.filter(
            profile_status='job_ready',
            readiness_score__gte=70
        ).count()
        
        # Employer statistics
        total_employers = Employer.objects.count()
        active_employers = Employer.objects.filter(user__is_active=True).count()
        
        # Job posting statistics
        total_jobs = JobPosting.objects.count()
        active_jobs = JobPosting.objects.filter(is_active=True).count()
        jobs_by_type = JobPosting.objects.values('job_type').annotate(
            count=Count('id')
        )
        
        # Application statistics
        total_applications = JobApplication.objects.count()
        applications_by_status = JobApplication.objects.values('status').annotate(
            count=Count('id')
        )
        
        # Interest log statistics
        total_interest_logs = EmployerInterestLog.objects.count()
        interest_by_action = EmployerInterestLog.objects.values('action').annotate(
            count=Count('id')
        )
        
        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_profiles = MarketplaceProfile.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        recent_jobs = JobPosting.objects.filter(
            posted_at__gte=thirty_days_ago
        ).count()
        recent_applications = JobApplication.objects.filter(
            applied_at__gte=thirty_days_ago
        ).count()
        recent_interest = EmployerInterestLog.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        # Time-series data for charts (last 30 days, daily aggregation)
        daily_activity = []
        for i in range(30):
            date = timezone.now() - timedelta(days=29-i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            daily_activity.append({
                'date': date_start.date().isoformat(),
                'profiles_created': MarketplaceProfile.objects.filter(
                    created_at__gte=date_start,
                    created_at__lte=date_end
                ).count(),
                'jobs_posted': JobPosting.objects.filter(
                    posted_at__gte=date_start,
                    posted_at__lte=date_end
                ).count(),
                'applications': JobApplication.objects.filter(
                    applied_at__gte=date_start,
                    applied_at__lte=date_end
                ).count(),
                'interest_logs': EmployerInterestLog.objects.filter(
                    created_at__gte=date_start,
                    created_at__lte=date_end
                ).count(),
            })
        
        # Readiness score distribution (buckets)
        readiness_distribution = []
        for bucket in range(0, 101, 10):
            bucket_end = bucket + 9 if bucket < 100 else 100
            count = MarketplaceProfile.objects.filter(
                readiness_score__gte=bucket,
                readiness_score__lte=bucket_end
            ).count()
            if count > 0:
                readiness_distribution.append({
                    'range': f'{bucket}-{bucket_end}',
                    'count': count,
                })
        
        return Response({
            'profiles': {
                'total': total_profiles,
                'visible': visible_profiles,
                'by_status': list(profiles_by_status),
                'by_tier': list(profiles_by_tier),
                'avg_readiness': float(avg_readiness),
                'job_ready_count': job_ready_count,
            },
            'employers': {
                'total': total_employers,
                'active': active_employers,
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs,
                'by_type': list(jobs_by_type),
            },
            'applications': {
                'total': total_applications,
                'by_status': list(applications_by_status),
            },
            'interest_logs': {
                'total': total_interest_logs,
                'by_action': list(interest_by_action),
            },
            'recent_activity': {
                'profiles_created': recent_profiles,
                'jobs_posted': recent_jobs,
                'applications': recent_applications,
                'interest_logs': recent_interest,
            },
            'time_series': {
                'daily_activity': daily_activity,
            },
            'readiness_distribution': readiness_distribution,
        })


class AdminMarketplaceSettingsView(generics.GenericAPIView):
    """
    Admin view for marketplace settings and governance.
    
    GET /api/v1/admin/marketplace/settings/ - Get marketplace settings
    PATCH /api/v1/admin/marketplace/settings/ - Update marketplace settings
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        """Get marketplace settings."""
        # Note: In a real implementation, these would be stored in a Settings model
        # For now, we'll return default values
        return Response({
            'visibility_rules': {
                'free_tier_can_contact': False,
                'starter_tier_can_contact': False,
                'professional_tier_can_contact': True,
                'min_readiness_for_visibility': 50,
            },
            'profile_requirements': {
                'min_portfolio_items': 1,
                'min_readiness_for_job_ready': 70,
            },
            'job_posting_rules': {
                'require_approval': False,
                'auto_approve': True,
            }
        })
    
    def patch(self, request):
        """Update marketplace settings."""
        # Note: In a real implementation, these would be stored in a Settings model
        # For now, we'll just log the changes
        log_audit_event(
            request=request,
            user=request.user,
            action='marketplace_settings_updated',
            resource_type='marketplace_settings',
            resource_id='global',
            metadata={'changes': request.data}
        )
        
        return Response({
            'detail': 'Settings updated',
            'settings': request.data
        })
