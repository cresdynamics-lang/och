"""
Employer-facing job application management views.
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
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

User = get_user_model()
logger = logging.getLogger(__name__)


def _prefetch_applicants(applications):
    """
    Prefetch applicant User objects and attach to each application.
    Avoids JOIN when marketplace_job_applications.applicant_id is varchar and users.id is bigint.
    """
    if not applications:
        return
    applicant_ids = []
    for app in applications:
        try:
            applicant_ids.append(int(app.applicant_id))
        except (ValueError, TypeError):
            pass
    if not applicant_ids:
        return
    user_map = {u.pk: u for u in User.objects.filter(pk__in=applicant_ids)}
    for app in applications:
        try:
            pk = int(app.applicant_id)
            app.applicant = user_map.get(pk)  # None if not found, so serializer does not lazy-load
        except (ValueError, TypeError):
            app.applicant = None


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
        
        # Return all applications for this job (no select_related('applicant') to avoid varchar vs bigint join)
        return JobApplication.objects.filter(
            job_posting=job
        ).select_related('job_posting').order_by('-applied_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        applications = list(queryset)
        _prefetch_applicants(applications)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)


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
        
        # Get all applications for jobs posted by this employer (no select_related('applicant') to avoid varchar vs bigint join)
        return JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('job_posting', 'job_posting__employer').order_by('-applied_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        applications = list(queryset)
        _prefetch_applicants(applications)
        serializer = self.get_serializer(applications, many=True)
        status_counts = {}
        for status_choice in JobApplication.STATUS_CHOICES:
            status_counts[status_choice[0]] = sum(1 for a in applications if a.status == status_choice[0])
        return Response({
            'results': serializer.data,
            'stats': status_counts,
        })


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
        
        # Match by employer.user (no select_related('applicant') to avoid varchar vs bigint join)
        return JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('job_posting', 'job_posting__employer')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        _prefetch_applicants([instance])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        _prefetch_applicants([instance])
        
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
        
        # Match by employer.user (no select_related('applicant') to avoid varchar vs bigint join)
        return JobApplication.objects.filter(
            job_posting__employer__user=user
        ).select_related('job_posting')

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        _prefetch_applicants([instance])
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
