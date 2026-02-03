"""
Certificate Management API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, FileResponse
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
import os
import json
from io import BytesIO
import base64

from ..models import Program, Cohort, Enrollment, Certificate
from ..serializers import CertificateSerializer
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorCertificateViewSet(viewsets.ViewSet):
    """Director Certificate Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def get_director_programs(self, user):
        """Get programs accessible to director."""
        if user.is_staff:
            return Program.objects.all()
        return Program.objects.filter(tracks__director=user).distinct()
    
    @action(detail=False, methods=['get'])
    def list_certificates(self, request):
        """List all certificates for director's programs."""
        programs = self.get_director_programs(request.user)
        
        certificates = Certificate.objects.filter(
            enrollment__cohort__track__program__in=programs
        ).select_related(
            'enrollment__user',
            'enrollment__cohort',
            'enrollment__cohort__track',
            'enrollment__cohort__track__program'
        ).order_by('-issued_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter == 'issued':
            certificates = certificates.exclude(file_uri='')
        elif status_filter == 'pending':
            certificates = certificates.filter(file_uri='')
        
        # Filter by program if provided
        program_filter = request.query_params.get('program_id')
        if program_filter:
            certificates = certificates.filter(enrollment__cohort__track__program__id=program_filter)
        
        certificate_data = []
        for cert in certificates:
            certificate_data.append({
                'id': str(cert.id),
                'enrollment_id': str(cert.enrollment.id),
                'user': {
                    'id': str(cert.enrollment.user.id),
                    'email': cert.enrollment.user.email,
                    'name': f"{cert.enrollment.user.first_name} {cert.enrollment.user.last_name}".strip()
                },
                'program': cert.enrollment.cohort.track.program.name,
                'track': cert.enrollment.cohort.track.name,
                'cohort': cert.enrollment.cohort.name,
                'issued_at': cert.issued_at.isoformat(),
                'file_uri': cert.file_uri,
                'status': 'issued' if cert.file_uri else 'pending'
            })
        
        return Response({
            'certificates': certificate_data,
            'total_count': len(certificate_data)
        })
    
    @action(detail=False, methods=['get'])
    def certificate_templates(self, request):
        """Get available certificate templates."""
        templates = {
            'technical': {
                'name': 'Technical Program Certificate',
                'description': 'Certificate for technical cybersecurity programs',
                'fields': ['user_name', 'program_name', 'completion_date', 'director_signature'],
                'design': 'modern_tech',
                'color_scheme': 'blue_gradient'
            },
            'leadership': {
                'name': 'Leadership Program Certificate',
                'description': 'Certificate for leadership development programs',
                'fields': ['user_name', 'program_name', 'completion_date', 'leadership_skills', 'director_signature'],
                'design': 'executive',
                'color_scheme': 'gold_accent'
            },
            'mentorship': {
                'name': 'Mentorship Program Certificate',
                'description': 'Certificate for mentorship training programs',
                'fields': ['user_name', 'program_name', 'mentoring_hours', 'completion_date', 'director_signature'],
                'design': 'collaborative',
                'color_scheme': 'green_nature'
            },
            'custom': {
                'name': 'Custom Certificate',
                'description': 'Customizable certificate template',
                'fields': ['user_name', 'program_name', 'completion_date', 'custom_text', 'director_signature'],
                'design': 'minimal',
                'color_scheme': 'brand_colors'
            }
        }
        
        return Response(templates)
    
    @action(detail=False, methods=['post'])
    def generate_certificate(self, request):
        """Generate a certificate for an enrollment."""
        enrollment_id = request.data.get('enrollment_id')
        template_type = request.data.get('template_type', 'technical')
        custom_fields = request.data.get('custom_fields', {})
        
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id)
            
            # Verify director has access
            programs = self.get_director_programs(request.user)
            if enrollment.cohort.track.program not in programs:
                return Response(
                    {'error': 'Access denied to this enrollment'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if certificate already exists
            existing_cert = Certificate.objects.filter(enrollment=enrollment).first()
            if existing_cert and existing_cert.file_uri:
                return Response(
                    {'error': 'Certificate already exists for this enrollment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate certificate data
            cert_data = {
                'user_name': f"{enrollment.user.first_name} {enrollment.user.last_name}".strip(),
                'program_name': enrollment.cohort.track.program.name,
                'track_name': enrollment.cohort.track.name,
                'cohort_name': enrollment.cohort.name,
                'completion_date': enrollment.completed_at.strftime('%B %d, %Y') if enrollment.completed_at else timezone.now().strftime('%B %d, %Y'),
                'director_name': request.user.get_full_name() or request.user.email,
                'template_type': template_type,
                **custom_fields
            }
            
            # Mock certificate generation (would integrate with actual certificate service)
            certificate_url = self._generate_certificate_file(cert_data)
            
            # Create or update certificate record
            if existing_cert:
                existing_cert.file_uri = certificate_url
                existing_cert.save()
                certificate = existing_cert
            else:
                certificate = Certificate.objects.create(
                    enrollment=enrollment,
                    file_uri=certificate_url
                )
            
            return Response({
                'message': 'Certificate generated successfully',
                'certificate': {
                    'id': str(certificate.id),
                    'file_uri': certificate.file_uri,
                    'issued_at': certificate.issued_at.isoformat()
                }
            })
            
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate(self, request):
        """Generate certificates for multiple enrollments."""
        enrollment_ids = request.data.get('enrollment_ids', [])
        template_type = request.data.get('template_type', 'technical')
        
        if not enrollment_ids:
            return Response(
                {'error': 'No enrollment IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        programs = self.get_director_programs(request.user)
        enrollments = Enrollment.objects.filter(
            id__in=enrollment_ids,
            cohort__track__program__in=programs,
            status='completed'
        )
        
        generated_certificates = []
        errors = []
        
        for enrollment in enrollments:
            try:
                # Check if certificate already exists
                existing_cert = Certificate.objects.filter(enrollment=enrollment).first()
                if existing_cert and existing_cert.file_uri:
                    errors.append(f"Certificate already exists for {enrollment.user.email}")
                    continue
                
                # Generate certificate
                cert_data = {
                    'user_name': f"{enrollment.user.first_name} {enrollment.user.last_name}".strip(),
                    'program_name': enrollment.cohort.track.program.name,
                    'track_name': enrollment.cohort.track.name,
                    'cohort_name': enrollment.cohort.name,
                    'completion_date': enrollment.completed_at.strftime('%B %d, %Y') if enrollment.completed_at else timezone.now().strftime('%B %d, %Y'),
                    'director_name': request.user.get_full_name() or request.user.email,
                    'template_type': template_type
                }
                
                certificate_url = self._generate_certificate_file(cert_data)
                
                if existing_cert:
                    existing_cert.file_uri = certificate_url
                    existing_cert.save()
                    certificate = existing_cert
                else:
                    certificate = Certificate.objects.create(
                        enrollment=enrollment,
                        file_uri=certificate_url
                    )
                
                generated_certificates.append({
                    'enrollment_id': str(enrollment.id),
                    'user_email': enrollment.user.email,
                    'certificate_id': str(certificate.id),
                    'file_uri': certificate.file_uri
                })
                
            except Exception as e:
                errors.append(f"Failed to generate certificate for {enrollment.user.email}: {str(e)}")
        
        return Response({
            'message': f'Generated {len(generated_certificates)} certificates',
            'generated_certificates': generated_certificates,
            'errors': errors
        })
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a certificate file."""
        try:
            certificate = Certificate.objects.get(id=pk)
            
            # Verify director has access
            programs = self.get_director_programs(request.user)
            if certificate.enrollment.cohort.track.program not in programs:
                return Response(
                    {'error': 'Access denied to this certificate'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not certificate.file_uri:
                return Response(
                    {'error': 'Certificate file not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Mock file download (would serve actual file in production)
            response = HttpResponse(
                self._generate_mock_pdf_content(certificate),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="certificate_{certificate.id}.pdf"'
            return response
            
        except Certificate.DoesNotExist:
            return Response(
                {'error': 'Certificate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get certificate statistics."""
        programs = self.get_director_programs(request.user)
        
        total_certificates = Certificate.objects.filter(
            enrollment__cohort__track__program__in=programs
        ).count()
        
        issued_certificates = Certificate.objects.filter(
            enrollment__cohort__track__program__in=programs
        ).exclude(file_uri='').count()
        
        pending_certificates = total_certificates - issued_certificates
        
        # Certificates by program
        program_stats = []
        for program in programs:
            program_certs = Certificate.objects.filter(
                enrollment__cohort__track__program=program
            )
            
            program_stats.append({
                'program_id': str(program.id),
                'program_name': program.name,
                'total_certificates': program_certs.count(),
                'issued_certificates': program_certs.exclude(file_uri='').count()
            })
        
        # Recent certificates
        recent_certificates = Certificate.objects.filter(
            enrollment__cohort__track__program__in=programs
        ).select_related(
            'enrollment__user',
            'enrollment__cohort__track__program'
        ).order_by('-issued_at')[:10]
        
        recent_data = []
        for cert in recent_certificates:
            recent_data.append({
                'id': str(cert.id),
                'user_name': f"{cert.enrollment.user.first_name} {cert.enrollment.user.last_name}".strip(),
                'program_name': cert.enrollment.cohort.track.program.name,
                'issued_at': cert.issued_at.isoformat(),
                'status': 'issued' if cert.file_uri else 'pending'
            })
        
        return Response({
            'summary': {
                'total_certificates': total_certificates,
                'issued_certificates': issued_certificates,
                'pending_certificates': pending_certificates,
                'issuance_rate': (issued_certificates / total_certificates * 100) if total_certificates > 0 else 0
            },
            'program_statistics': program_stats,
            'recent_certificates': recent_data
        })
    
    def _generate_certificate_file(self, cert_data):
        """Mock certificate file generation."""
        # In production, this would integrate with a certificate generation service
        # like PDFKit, ReportLab, or a third-party service
        certificate_id = f"cert_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
        return f"/certificates/{certificate_id}.pdf"
    
    def _generate_mock_pdf_content(self, certificate):
        """Generate mock PDF content for download."""
        # In production, this would generate actual PDF content
        mock_content = f"""
        CERTIFICATE OF COMPLETION
        
        This certifies that
        {certificate.enrollment.user.first_name} {certificate.enrollment.user.last_name}
        
        has successfully completed the
        {certificate.enrollment.cohort.track.program.name}
        
        Program on {certificate.issued_at.strftime('%B %d, %Y')}
        
        Certificate ID: {certificate.id}
        """
        return mock_content.encode('utf-8')