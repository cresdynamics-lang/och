"""
Reports & Export API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import json

from ..models import Program, Track, Cohort, Enrollment, MentorAssignment
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorReportsViewSet(viewsets.ViewSet):
    """Director Reports & Analytics API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def get_director_programs(self, user):
        """Get programs accessible to director."""
        if user.is_staff:
            return Program.objects.all()
        return Program.objects.filter(tracks__director=user).distinct()
    
    @action(detail=False, methods=['get'])
    def dashboard_analytics(self, request):
        """Get comprehensive dashboard analytics."""
        programs = self.get_director_programs(request.user)
        
        # Time range filter
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Basic metrics
        total_programs = programs.count()
        total_tracks = Track.objects.filter(program__in=programs).count()
        total_cohorts = Cohort.objects.filter(track__program__in=programs).count()
        active_cohorts = Cohort.objects.filter(
            track__program__in=programs,
            status__in=['active', 'running']
        ).count()
        
        # Enrollment metrics
        total_enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs
        ).count()
        active_enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs,
            status='active'
        ).count()
        completed_enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs,
            status='completed'
        ).count()
        
        # Mentor metrics
        total_mentors = MentorAssignment.objects.filter(
            cohort__track__program__in=programs,
            active=True
        ).values('mentor').distinct().count()
        
        # Seat utilization
        cohorts_with_seats = Cohort.objects.filter(
            track__program__in=programs,
            seat_cap__gt=0
        )
        total_seats = sum(c.seat_cap for c in cohorts_with_seats)
        used_seats = sum(c.enrollments.filter(status='active').count() for c in cohorts_with_seats)
        seat_utilization = (used_seats / total_seats * 100) if total_seats > 0 else 0
        
        # Completion rate
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Track distribution
        track_distribution = Track.objects.filter(
            program__in=programs
        ).annotate(
            enrollment_count=Count('cohorts__enrollments', filter=Q(cohorts__enrollments__status='active'))
        ).values('name', 'enrollment_count')
        
        # Monthly enrollment trends
        monthly_trends = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            enrollments = Enrollment.objects.filter(
                cohort__track__program__in=programs,
                joined_at__gte=month_start,
                joined_at__lt=month_end
            ).count()
            
            monthly_trends.append({
                'month': month_start.strftime('%Y-%m'),
                'enrollments': enrollments
            })
        
        return Response({
            'summary': {
                'total_programs': total_programs,
                'total_tracks': total_tracks,
                'total_cohorts': total_cohorts,
                'active_cohorts': active_cohorts,
                'total_enrollments': total_enrollments,
                'active_enrollments': active_enrollments,
                'completed_enrollments': completed_enrollments,
                'total_mentors': total_mentors,
                'seat_utilization': round(seat_utilization, 1),
                'completion_rate': round(completion_rate, 1)
            },
            'track_distribution': list(track_distribution),
            'monthly_trends': monthly_trends[::-1],  # Reverse to show oldest first
            'generated_at': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def cohort_performance(self, request):
        """Get detailed cohort performance metrics."""
        programs = self.get_director_programs(request.user)
        cohorts = Cohort.objects.filter(track__program__in=programs)
        
        cohort_data = []
        for cohort in cohorts:
            enrollments = cohort.enrollments.all()
            active_count = enrollments.filter(status='active').count()
            completed_count = enrollments.filter(status='completed').count()
            total_count = enrollments.count()
            
            # Calculate metrics
            completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
            seat_utilization = (active_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
            
            # Mentor coverage
            mentor_count = cohort.mentor_assignments.filter(active=True).count()
            mentor_ratio = (mentor_count / active_count) if active_count > 0 else 0
            
            cohort_data.append({
                'id': str(cohort.id),
                'name': cohort.name,
                'program': cohort.track.program.name,
                'track': cohort.track.name,
                'status': cohort.status,
                'start_date': cohort.start_date.isoformat() if cohort.start_date else None,
                'end_date': cohort.end_date.isoformat() if cohort.end_date else None,
                'seat_cap': cohort.seat_cap,
                'total_enrollments': total_count,
                'active_enrollments': active_count,
                'completed_enrollments': completed_count,
                'completion_rate': round(completion_rate, 1),
                'seat_utilization': round(seat_utilization, 1),
                'mentor_count': mentor_count,
                'mentor_ratio': round(mentor_ratio, 3)
            })
        
        return Response({
            'cohorts': cohort_data,
            'total_cohorts': len(cohort_data),
            'generated_at': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def export_enrollments(self, request):
        """Export enrollment data as CSV."""
        programs = self.get_director_programs(request.user)
        enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs
        ).select_related('user', 'cohort', 'cohort__track', 'cohort__track__program')
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            enrollments = enrollments.filter(joined_at__gte=start_date)
        if end_date:
            enrollments = enrollments.filter(joined_at__lte=end_date)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="enrollments_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Enrollment ID', 'User Email', 'User Name', 'Program', 'Track', 'Cohort',
            'Status', 'Seat Type', 'Payment Status', 'Joined Date', 'Completed Date'
        ])
        
        for enrollment in enrollments:
            writer.writerow([
                str(enrollment.id),
                enrollment.user.email,
                f"{enrollment.user.first_name} {enrollment.user.last_name}",
                enrollment.cohort.track.program.name,
                enrollment.cohort.track.name,
                enrollment.cohort.name,
                enrollment.status,
                enrollment.seat_type,
                enrollment.payment_status,
                enrollment.joined_at.strftime('%Y-%m-%d %H:%M:%S'),
                enrollment.completed_at.strftime('%Y-%m-%d %H:%M:%S') if enrollment.completed_at else ''
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_cohorts(self, request):
        """Export cohort data as CSV."""
        programs = self.get_director_programs(request.user)
        cohorts = Cohort.objects.filter(track__program__in=programs).select_related(
            'track', 'track__program'
        )
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="cohorts_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Cohort ID', 'Name', 'Program', 'Track', 'Status', 'Mode',
            'Start Date', 'End Date', 'Seat Cap', 'Active Enrollments',
            'Completed Enrollments', 'Mentor Count', 'Created Date'
        ])
        
        for cohort in cohorts:
            active_enrollments = cohort.enrollments.filter(status='active').count()
            completed_enrollments = cohort.enrollments.filter(status='completed').count()
            mentor_count = cohort.mentor_assignments.filter(active=True).count()
            
            writer.writerow([
                str(cohort.id),
                cohort.name,
                cohort.track.program.name,
                cohort.track.name,
                cohort.status,
                cohort.mode,
                cohort.start_date.strftime('%Y-%m-%d') if cohort.start_date else '',
                cohort.end_date.strftime('%Y-%m-%d') if cohort.end_date else '',
                cohort.seat_cap,
                active_enrollments,
                completed_enrollments,
                mentor_count,
                cohort.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_analytics(self, request):
        """Export analytics data as JSON."""
        analytics_data = self.dashboard_analytics(request).data
        
        response = HttpResponse(
            json.dumps(analytics_data, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="analytics_{timezone.now().strftime("%Y%m%d")}.json"'
        
        return response