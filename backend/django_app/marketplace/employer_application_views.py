"""
Employer-facing job application management views.
"""
from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action
import logging

from .models import JobPosting, JobApplication, Employer
from .serializers import (
    JobApplicationSerializer,
)
from .utils import get_employer_for_user

logger = logging.getLogger(__name__)


class EmployerJobApplicationsView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/jobs/<job_id>/applications
    
    Employers can view all applications for a specific job posting.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer
    pagination_class = None  # Disable pagination for this view

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        user = self.request.user
        
        # Get employer - either direct profile or via role
        employer = get_employer_for_user(user)
        
        if not employer:
            logger.warning(f'User {user.id} ({user.email}) has no employer profile')
            return JobApplication.objects.none()
        
        # Find job by ID and verify ownership via employer.user match
        # This handles cases where employer profiles might have been created at different times
        try:
            job = JobPosting.objects.get(id=job_id)
            # Verify ownership: check if job's employer user matches current user
            if job.employer.user != user:
                logger.warning(
                    f'User {user.id} attempted to access job {job_id} owned by employer {job.employer.id} '
                    f'(user: {job.employer.user.id})'
                )
                raise NotFound('Job posting not found or you do not have permission to view it')
        except JobPosting.DoesNotExist:
            logger.warning(f'Job posting {job_id} not found')
            raise NotFound('Job posting not found or you do not have permission to view it')
        
        # Return all applications for this job
        applications = JobApplication.objects.filter(
            job_posting=job
        ).select_related('applicant', 'job_posting').order_by('-applied_at')
        
        logger.info(f'Found {applications.count()} applications for job {job_id} (user: {user.id})')
        return applications


class EmployerAllApplicationsView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/applications/employer
    
    Employers can view all applications across all their job postings.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        employer = get_employer_for_user(user)
        
        if not employer:
            logger.warning(f'User {user.id} ({user.email}) has no employer profile')
            return JobApplication.objects.none()
        
        # Get all applications for jobs posted by this employer
        # Match by employer.user to handle auto-created employer profiles
        applications = JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('applicant', 'job_posting', 'job_posting__employer').order_by('-applied_at')
        
        logger.info(f'Found {applications.count()} total applications for user {user.id}')
        return applications
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Group applications by status for stats
        queryset = self.get_queryset()
        status_counts = {}
        for status_choice in JobApplication.STATUS_CHOICES:
            status_counts[status_choice[0]] = queryset.filter(status=status_choice[0]).count()
        
        # Add stats to response
        if isinstance(response.data, list):
            response.data = {
                'results': response.data,
                'stats': status_counts,
            }
        elif isinstance(response.data, dict) and 'results' in response.data:
            response.data['stats'] = status_counts
        
        return response


class EmployerApplicationDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/marketplace/applications/<id>
    PATCH /api/v1/marketplace/applications/<id>
    
    Employers can view and update application details (status, notes).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        employer = get_employer_for_user(user)
        
        if not employer:
            logger.warning(f'User {user.id} ({user.email}) has no employer profile')
            return JobApplication.objects.none()
        
        # Match by employer.user to handle auto-created employer profiles
        return JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('applicant', 'job_posting', 'job_posting__employer')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Only allow updating status and notes
        allowed_fields = ['status', 'notes']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update status_changed_at when status changes
        if 'status' in data and data['status'] != instance.status:
            serializer.save(status_changed_at=timezone.now())
        else:
            serializer.save()
        
        # Send notification to student if status changed
        if 'status' in data and data['status'] != instance.status:
            try:
                from services.email_service import EmailService
                EmailService.send_application_status_update_notification(
                    student=instance.applicant,
                    job=instance.job_posting,
                    application=instance,
                    old_status=instance.status,
                    new_status=data['status'],
                )
            except Exception as e:
                logger.warning(f'Failed to send status update notification: {e}')
        
        return Response(serializer.data)


class EmployerApplicationStatusUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/v1/marketplace/applications/<id>/status
    
    Quick endpoint to update only the application status.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        employer = get_employer_for_user(user)
        
        if not employer:
            logger.warning(f'User {user.id} ({user.email}) has no employer profile')
            return JobApplication.objects.none()
        
        # Match by employer.user to handle auto-created employer profiles
        return JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('applicant', 'job_posting')

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            raise ValidationError({'status': 'Status is required'})
        
        # Validate status
        valid_statuses = [choice[0] for choice in JobApplication.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValidationError({'status': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'})
        
        old_status = instance.status
        instance.status = new_status
        instance.status_changed_at = timezone.now()
        instance.save(update_fields=['status', 'status_changed_at'])
        
        # Send notification
        try:
            from services.email_service import EmailService
            EmailService.send_application_status_update_notification(
                student=instance.applicant,
                job=instance.job_posting,
                application=instance,
                old_status=old_status,
                new_status=new_status,
            )
        except Exception as e:
            logger.warning(f'Failed to send status update notification: {e}')
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
