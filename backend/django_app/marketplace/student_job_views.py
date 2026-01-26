"""
Student-facing job browsing and application views.
"""
from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
import logging

from .models import JobPosting, JobApplication, MarketplaceProfile
from .serializers import (
    JobPostingListSerializer,
    JobApplicationSerializer,
    JobApplicationCreateSerializer,
)
from .job_matching import calculate_match_score

logger = logging.getLogger(__name__)


class StudentJobBrowseView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/jobs/browse
    
    Students can browse active job postings with match scores.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobPostingListSerializer

    def get_queryset(self):
        # Get active jobs
        jobs = JobPosting.objects.filter(
            is_active=True
        ).select_related('employer')
        
        # Filter out expired jobs
        jobs = jobs.filter(
            models.Q(application_deadline__isnull=True) |
            models.Q(application_deadline__gte=timezone.now())
        )
        
        # Optional filters
        job_type = self.request.query_params.get('job_type')
        if job_type:
            jobs = jobs.filter(job_type=job_type)
        
        return jobs.order_by('-posted_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Get profile for match score calculation
            try:
                profile = request.user.marketplace_profile
            except MarketplaceProfile.DoesNotExist:
                profile = None
            
            # Serialize jobs
            serializer = self.get_serializer(queryset, many=True, context=self.get_serializer_context())
            jobs_data = list(serializer.data)  # Convert to list to make it mutable
            
            # Add match scores and application status
            for job_data in jobs_data:
                if not isinstance(job_data, dict):
                    continue
                    
                job_id = job_data.get('id')
                if not job_id:
                    job_data['match_score'] = 0.0
                    job_data['has_applied'] = False
                    continue
                
                try:
                    job = JobPosting.objects.get(id=job_id)
                    
                    # Calculate match score
                    if profile:
                        match_score = calculate_match_score(job, profile)
                        job_data['match_score'] = float(match_score)
                    else:
                        job_data['match_score'] = 0.0
                    
                    # Check if user has applied
                    has_applied = JobApplication.objects.filter(
                        job_posting=job,
                        applicant=request.user
                    ).exists()
                    job_data['has_applied'] = has_applied
                except (JobPosting.DoesNotExist, Exception) as e:
                    logger.warning(f'Error processing job {job_id}: {e}')
                    job_data['match_score'] = 0.0
                    job_data['has_applied'] = False
            
            return Response(jobs_data)
        except Exception as e:
            logger.error(f'Error in StudentJobBrowseView.list: {e}', exc_info=True)
            raise


class StudentJobDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/marketplace/jobs/<id>/detail
    
    Students can view job details with match score.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobPostingListSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return JobPosting.objects.filter(is_active=True).select_related('employer')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        
        try:
            profile = request.user.marketplace_profile
            job = self.get_object()
            match_score = calculate_match_score(job, profile)
            response.data['match_score'] = float(match_score)
            
            has_applied = JobApplication.objects.filter(
                job_posting=job,
                applicant=request.user
            ).exists()
            response.data['has_applied'] = has_applied
        except MarketplaceProfile.DoesNotExist:
            response.data['match_score'] = 0.0
            response.data['has_applied'] = False
        
        return response


class StudentJobApplicationView(generics.CreateAPIView):
    """
    POST /api/v1/marketplace/jobs/<id>/apply
    
    Students can apply to a job posting.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationCreateSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        context['job_id'] = self.kwargs.get('id')
        return context

    def perform_create(self, serializer):
        job_id = self.kwargs.get('id')
        try:
            job = JobPosting.objects.get(id=job_id, is_active=True)
        except JobPosting.DoesNotExist:
            raise NotFound('Job posting not found or inactive')
        
        # Check if already applied
        if JobApplication.objects.filter(
            job_posting=job,
            applicant=self.request.user
        ).exists():
            raise ValidationError({'detail': 'You have already applied to this job'})
        
        # Check deadline
        if job.application_deadline and job.application_deadline < timezone.now():
            raise ValidationError({'detail': 'Application deadline has passed'})
        
        # Get or create marketplace profile
        try:
            profile = self.request.user.marketplace_profile
        except MarketplaceProfile.DoesNotExist:
            raise ValidationError({
                'detail': 'Please complete your marketplace profile before applying'
            })
        
        # Calculate match score
        match_score = calculate_match_score(job, profile)
        
        # Create application
        application = serializer.save(
            job_posting=job,
            applicant=self.request.user,
            match_score=match_score,
            status='pending',
        )
        
        # Send notification (optional)
        try:
            from services.email_service import EmailService
            EmailService.send_job_application_notification(
                student=self.request.user,
                job=job,
                application=application,
            )
        except Exception as e:
            logger.warning(f'Failed to send application notification: {e}')


class StudentJobApplicationsView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/applications
    
    Students can view their job applications.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        return JobApplication.objects.filter(
            applicant=self.request.user
        ).select_related('job_posting', 'job_posting__employer').order_by('-applied_at')


class StudentJobApplicationDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/marketplace/applications/<id>
    
    Students can view details of a specific application.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return JobApplication.objects.filter(
            applicant=self.request.user
        ).select_related('job_posting', 'job_posting__employer')
