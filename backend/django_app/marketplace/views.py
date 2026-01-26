from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
import logging

from users.utils.consent_utils import check_consent
from subscriptions.utils import get_user_tier

logger = logging.getLogger(__name__)

from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting, JobApplication
from .serializers import (
    EmployerSerializer,
    MarketplaceProfileListSerializer,
    MarketplaceProfileDetailSerializer,
    EmployerInterestLogSerializer,
    JobPostingSerializer,
    JobPostingListSerializer,
    JobApplicationSerializer,
    JobApplicationCreateSerializer,
)


class IsEmployer(permissions.BasePermission):
    """
    Only users with an Employer profile or employer role can access these endpoints.
    Checks for:
    1. Direct employer_profile relationship
    2. UserRole with 'sponsor_admin' role (which is the employer role)
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if user has employer_profile
        if hasattr(request.user, 'employer_profile'):
            return True
        
        # Check if user has sponsor_admin role (employer role)
        if request.user.user_roles.filter(
            role__name='sponsor_admin',
            is_active=True
        ).exists():
            return True
        
        return False


from .utils import get_employer_for_user


class MarketplaceTalentListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/talent

    Employer talent browsing endpoint with filtering.
    Only exposes Professional ($7) mentees that:
    - have marketplace feature enabled via subscription tier
    - have granted employer_share consent
    - have is_visible=True on their marketplace profile
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = MarketplaceProfileListSerializer

    def get_queryset(self):
        qs = MarketplaceProfile.objects.filter(
            is_visible=True,
            employer_share_consent=True,
            tier__in=['starter', 'professional'],  # free tier never visible
        )

        # Filter: only Professional tier are directly contactable
        contactable_only = self.request.query_params.get('contactable_only')
        if contactable_only and contactable_only.lower() == 'true':
            qs = qs.filter(tier='professional')

        # Filter by profile status
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(profile_status=status_param)

        # Filter by minimum readiness score
        min_readiness = self.request.query_params.get('min_readiness')
        if min_readiness:
            try:
                qs = qs.filter(readiness_score__gte=float(min_readiness))
            except ValueError:
                pass

        # Filter by skills (comma-separated)
        skills = self.request.query_params.get('skills')
        if skills:
            skill_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
            for skill in skill_list:
                qs = qs.filter(skills__icontains=skill)

        # Simple search across name / role
        search = self.request.query_params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(primary_role__icontains=search)
                | Q(primary_track_key__icontains=search)
                | Q(mentee__first_name__icontains=search)
                | Q(mentee__last_name__icontains=search)
                | Q(mentee__email__icontains=search)
            )

        # Order by readiness score then recent updates
        return qs.order_by('-readiness_score', '-last_updated_at')


class MarketplaceProfileMeView(APIView):
    """
    GET /api/v1/marketplace/profile/me
    PATCH /api/v1/marketplace/profile/me

    Returns the current mentee's marketplace profile (or a skeleton)
    so they can see their readiness status and visibility.
    Allows updating profile visibility.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = user.marketplace_profile
            # Sync tier from subscription if it's different
            try:
                current_tier = get_user_tier(user.id)
            except Exception as e:
                logger.warning(f"Error getting user tier for user {user.id}: {e}")
                current_tier = 'free'
            
            tier_mapping = {
                'free': 'free',
                'starter': 'starter',
                'starter_3': 'starter',
                'starter_normal': 'starter',
                'starter_enhanced': 'starter',
                'premium': 'professional',
                'professional_7': 'professional',
                'professional': 'professional',
            }
            expected_tier = tier_mapping.get(current_tier or 'free', 'free')
            
            # Sync employer_share_consent from current consent scope
            current_consent = check_consent(user, 'employer_share')
            needs_save = False
            
            # Update tier if it doesn't match subscription
            if profile.tier != expected_tier:
                profile.tier = expected_tier
                needs_save = True
                logger.info(f"Synced marketplace profile tier to {expected_tier} for user {user.email}")
            
            # Update consent if it doesn't match current consent scope
            if profile.employer_share_consent != current_consent:
                profile.employer_share_consent = current_consent
                needs_save = True
                logger.info(f"Synced marketplace profile consent to {current_consent} for user {user.email}")
            
            if needs_save:
                profile.last_updated_at = timezone.now()
                profile.save()
        except MarketplaceProfile.DoesNotExist:
            # Create a non-visible skeleton profile the first time
            try:
                tier = get_user_tier(user.id)
            except Exception as e:
                logger.warning(f"Error getting user tier for user {user.id}: {e}")
                tier = 'free'
            
            tier_mapping = {
                'free': 'free',
                'starter': 'starter',
                'starter_3': 'starter',
                'starter_normal': 'starter',
                'starter_enhanced': 'starter',
                'premium': 'professional',
                'professional_7': 'professional',
                'professional': 'professional',
            }
            tier_label = tier_mapping.get(tier or 'free', 'free')

            current_consent = check_consent(user, 'employer_share')
            profile = MarketplaceProfile.objects.create(
                mentee=user,
                tier=tier_label,
                is_visible=False,
                employer_share_consent=current_consent,
            )
            logger.info(f"Created marketplace profile for user {user.email} with tier {tier_label} and consent {current_consent}")

        serializer = MarketplaceProfileDetailSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update marketplace profile visibility."""
        user = request.user
        try:
            profile = user.marketplace_profile
        except MarketplaceProfile.DoesNotExist:
            logger.warning(f"Marketplace profile not found for user {user.id}")
            return Response(
                {'detail': 'Marketplace profile not found. Please refresh the page.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Sync employer_share_consent from current consent scope before validation
            current_consent = check_consent(user, 'employer_share')
            if profile.employer_share_consent != current_consent:
                profile.employer_share_consent = current_consent
                profile.save(update_fields=['employer_share_consent', 'last_updated_at'])
                logger.info(f"Synced marketplace profile consent to {current_consent} for user {user.email}")
            
            # Update is_visible if provided
            if 'is_visible' in request.data:
                is_visible = request.data.get('is_visible')
                # Handle string booleans from frontend
                if isinstance(is_visible, str):
                    is_visible = is_visible.lower() in ('true', '1', 'yes')
                elif not isinstance(is_visible, bool):
                    return Response(
                        {'detail': 'is_visible must be a boolean'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate that user can set visibility
                if is_visible:
                    # Check requirements: tier must not be free, and consent must be granted
                    if profile.tier == 'free':
                        return Response(
                            {'detail': 'Upgrade to Starter+ tier to enable visibility'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    # Re-check consent (use current_consent which we just synced)
                    if not current_consent:
                        return Response(
                            {'detail': 'Grant employer consent in settings first. Go to Settings → Consent Management and grant "Employer Share" consent.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                profile.is_visible = is_visible
                profile.last_updated_at = timezone.now()
                profile.save()
                logger.info(f"Updated marketplace profile visibility to {is_visible} for user {user.email}")
            
            serializer = MarketplaceProfileDetailSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating marketplace profile for user {user.id}: {e}", exc_info=True)
            return Response(
                {'detail': f'Failed to update profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmployerInterestLogView(generics.CreateAPIView):
    """
    POST /api/v1/marketplace/interest

    Records employer interactions: view, favorite, shortlist, contact_request.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = EmployerInterestLogSerializer

    def create(self, request, *args, **kwargs):
        employer = get_employer_for_user(request.user)
        if not employer:
            return Response(
                {'detail': 'Employer profile not found. Please create an employer profile first.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile_id = request.data.get('profile_id')
        action = request.data.get('action')
        metadata = request.data.get('metadata', {}) or {}

        if not profile_id or not action:
            return Response(
                {'detail': 'profile_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            profile = MarketplaceProfile.objects.get(id=profile_id)
        except MarketplaceProfile.DoesNotExist:
            return Response(
                {'detail': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        log = EmployerInterestLog.objects.create(
            employer=employer,
            profile=profile,
            action=action,
            metadata=metadata,
        )

        # If this is a contact request, send notification to the student
        if action == 'contact_request':
            try:
                from django.conf import settings
                from services.email_service import EmailService
                email_service = EmailService()
                
                student = profile.mentee
                employer_name = employer.company_name
                
                # Send email notification
                email_service.send_contact_request_notification(
                    to_email=student.email,
                    student_name=student.get_full_name() or student.email,
                    employer_name=employer_name,
                    profile_url=f"{settings.FRONTEND_URL}/dashboard/student/marketplace/contacts"
                )
                logger.info(f"Contact request notification sent to {student.email} from {employer_name}")
            except Exception as e:
                logger.error(f"Failed to send contact request notification: {e}", exc_info=True)
                # Don't fail the request if notification fails

        serializer = EmployerInterestLogSerializer(log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployerInterestListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/interest
    
    List employer's interest logs (favorites, shortlists, contact requests).
    Filter by action: ?action=favorite|shortlist|contact_request
    """
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = EmployerInterestLogSerializer

    def get_queryset(self):
        employer = get_employer_for_user(self.request.user)
        if not employer:
            return EmployerInterestLog.objects.none()
        
        queryset = EmployerInterestLog.objects.filter(
            employer=employer
        ).select_related('profile', 'profile__mentee', 'employer').order_by('-created_at')
        
        # Filter by action if provided
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset


class StudentContactRequestsView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/contacts
    
    List contact requests received by the current student.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmployerInterestLogSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Get student's marketplace profile
        try:
            profile = MarketplaceProfile.objects.get(mentee=user)
        except MarketplaceProfile.DoesNotExist:
            return EmployerInterestLog.objects.none()
        
        # Get all contact requests for this profile
        return EmployerInterestLog.objects.filter(
            profile=profile,
            action='contact_request'
        ).select_related('employer', 'profile').order_by('-created_at')


class JobPostingListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/marketplace/jobs
    POST /api/v1/marketplace/jobs

    Employers can list and create job postings.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = JobPostingSerializer

    def get_queryset(self):
        employer = get_employer_for_user(self.request.user)
        if not employer:
            return JobPosting.objects.none()
        return JobPosting.objects.filter(employer=employer).order_by(
            '-posted_at'
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
    
    def perform_create(self, serializer):
        """Override to ensure employer is set correctly."""
        employer = get_employer_for_user(self.request.user)
        if not employer:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Employer profile not found. Please create an employer profile first.')
        serializer.save()


class JobPostingRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/marketplace/jobs/<id>
    PATCH /api/v1/marketplace/jobs/<id>
    DELETE /api/v1/marketplace/jobs/<id>

    Employers can retrieve, update, and delete their job postings.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = JobPostingSerializer
    lookup_field = 'id'

    def get_queryset(self):
        employer = get_employer_for_user(self.request.user)
        if not employer:
            return JobPosting.objects.none()
        return JobPosting.objects.filter(employer=employer)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


