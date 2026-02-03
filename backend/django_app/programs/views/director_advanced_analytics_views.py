"""
Advanced Analytics API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from datetime import datetime, timedelta, date
import json

from ..models import Program, Track, Cohort, Enrollment, MentorAssignment, CalendarEvent
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorAdvancedAnalyticsViewSet(viewsets.ViewSet):
    """Director Advanced Analytics API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    
    def get_director_programs(self, user):
        """Get programs accessible to director."""
        if user.is_staff:
            return Program.objects.all()
        return Program.objects.filter(tracks__director=user).distinct()
    
    @action(detail=False, methods=['get'])
    def enrollment_funnel(self, request):
        """Get enrollment funnel analysis."""
        programs = self.get_director_programs(request.user)
        
        # Calculate funnel stages
        total_inquiries = 1000  # Mock data - would come from marketing system
        total_applications = Enrollment.objects.filter(
            cohort__track__program__in=programs
        ).count()
        
        pending_approvals = Enrollment.objects.filter(
            cohort__track__program__in=programs,
            status='pending_payment'
        ).count()
        
        active_enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs,
            status='active'
        ).count()
        
        completed_enrollments = Enrollment.objects.filter(
            cohort__track__program__in=programs,
            status='completed'
        ).count()
        
        funnel_data = [
            {'stage': 'Inquiries', 'count': total_inquiries, 'percentage': 100},
            {'stage': 'Applications', 'count': total_applications, 'percentage': (total_applications/total_inquiries*100) if total_inquiries > 0 else 0},
            {'stage': 'Pending Approval', 'count': pending_approvals, 'percentage': (pending_approvals/total_inquiries*100) if total_inquiries > 0 else 0},
            {'stage': 'Active', 'count': active_enrollments, 'percentage': (active_enrollments/total_inquiries*100) if total_inquiries > 0 else 0},
            {'stage': 'Completed', 'count': completed_enrollments, 'percentage': (completed_enrollments/total_inquiries*100) if total_inquiries > 0 else 0}
        ]
        
        return Response({
            'funnel': funnel_data,
            'conversion_rates': {
                'inquiry_to_application': (total_applications/total_inquiries*100) if total_inquiries > 0 else 0,
                'application_to_active': (active_enrollments/total_applications*100) if total_applications > 0 else 0,
                'active_to_completion': (completed_enrollments/active_enrollments*100) if active_enrollments > 0 else 0
            }
        })
    
    @action(detail=False, methods=['get'])
    def cohort_comparison(self, request):
        """Compare cohort performance metrics."""
        programs = self.get_director_programs(request.user)
        cohorts = Cohort.objects.filter(track__program__in=programs)
        
        comparison_data = []
        for cohort in cohorts:
            enrollments = cohort.enrollments.all()
            total_count = enrollments.count()
            active_count = enrollments.filter(status='active').count()
            completed_count = enrollments.filter(status='completed').count()
            
            # Calculate metrics
            completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
            seat_utilization = (active_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
            
            # Mock additional metrics
            avg_attendance = 85.5  # Would come from attendance system
            avg_satisfaction = 4.2  # Would come from feedback system
            
            comparison_data.append({
                'cohort_id': str(cohort.id),
                'name': cohort.name,
                'program': cohort.track.program.name,
                'track': cohort.track.name,
                'status': cohort.status,
                'total_enrollments': total_count,
                'completion_rate': round(completion_rate, 1),
                'seat_utilization': round(seat_utilization, 1),
                'avg_attendance': avg_attendance,
                'avg_satisfaction': avg_satisfaction,
                'start_date': cohort.start_date.isoformat() if cohort.start_date else None
            })
        
        return Response({
            'cohorts': comparison_data,
            'benchmarks': {
                'avg_completion_rate': sum(c['completion_rate'] for c in comparison_data) / len(comparison_data) if comparison_data else 0,
                'avg_seat_utilization': sum(c['seat_utilization'] for c in comparison_data) / len(comparison_data) if comparison_data else 0,
                'avg_attendance': sum(c['avg_attendance'] for c in comparison_data) / len(comparison_data) if comparison_data else 0,
                'avg_satisfaction': sum(c['avg_satisfaction'] for c in comparison_data) / len(comparison_data) if comparison_data else 0
            }
        })
    
    @action(detail=False, methods=['get'])
    def mentor_analytics(self, request):
        """Analyze mentor performance and utilization."""
        programs = self.get_director_programs(request.user)
        
        # Get mentor assignments
        assignments = MentorAssignment.objects.filter(
            cohort__track__program__in=programs,
            active=True
        ).select_related('mentor', 'cohort')
        
        mentor_data = {}
        for assignment in assignments:
            mentor_id = str(assignment.mentor.id)
            if mentor_id not in mentor_data:
                mentor_data[mentor_id] = {
                    'mentor_id': mentor_id,
                    'name': assignment.mentor.get_full_name() or assignment.mentor.email,
                    'email': assignment.mentor.email,
                    'specialties': assignment.mentor.mentor_specialties,
                    'capacity_weekly': assignment.mentor.mentor_capacity_weekly,
                    'assignments': [],
                    'total_mentees': 0,
                    'avg_satisfaction': 4.1,  # Mock data
                    'sessions_completed': 0   # Mock data
                }
            
            # Count active mentees in this cohort
            mentees_count = assignment.cohort.enrollments.filter(status='active').count()
            mentor_data[mentor_id]['assignments'].append({
                'cohort_name': assignment.cohort.name,
                'role': assignment.role,
                'mentees_count': mentees_count
            })
            mentor_data[mentor_id]['total_mentees'] += mentees_count
        
        # Calculate utilization
        for mentor in mentor_data.values():
            mentor['utilization'] = (mentor['total_mentees'] / mentor['capacity_weekly'] * 100) if mentor['capacity_weekly'] > 0 else 0
            mentor['sessions_completed'] = mentor['total_mentees'] * 8  # Mock: 8 sessions per mentee
        
        return Response({
            'mentors': list(mentor_data.values()),
            'summary': {
                'total_mentors': len(mentor_data),
                'avg_utilization': sum(m['utilization'] for m in mentor_data.values()) / len(mentor_data) if mentor_data else 0,
                'over_capacity': len([m for m in mentor_data.values() if m['utilization'] > 100]),
                'under_utilized': len([m for m in mentor_data.values() if m['utilization'] < 50])
            }
        })
    
    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        """Analyze revenue and financial metrics."""
        programs = self.get_director_programs(request.user)
        
        # Calculate revenue by program
        program_revenue = []
        total_revenue = 0
        
        for program in programs:
            enrollments = Enrollment.objects.filter(
                cohort__track__program=program,
                status__in=['active', 'completed'],
                payment_status='paid'
            )
            
            # Mock pricing - would come from actual pricing system
            program_price = float(program.default_price) if program.default_price else 1000.0
            program_total = enrollments.count() * program_price
            total_revenue += program_total
            
            program_revenue.append({
                'program_id': str(program.id),
                'program_name': program.name,
                'enrollments': enrollments.count(),
                'price_per_seat': program_price,
                'total_revenue': program_total,
                'currency': program.currency
            })
        
        # Monthly revenue trends
        monthly_revenue = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_enrollments = Enrollment.objects.filter(
                cohort__track__program__in=programs,
                status__in=['active', 'completed'],
                payment_status='paid',
                joined_at__gte=month_start,
                joined_at__lt=month_end
            ).count()
            
            # Mock average price
            avg_price = 1000.0
            month_revenue = month_enrollments * avg_price
            
            monthly_revenue.append({
                'month': month_start.strftime('%Y-%m'),
                'enrollments': month_enrollments,
                'revenue': month_revenue
            })
        
        return Response({
            'program_revenue': program_revenue,
            'monthly_trends': monthly_revenue[::-1],
            'summary': {
                'total_revenue': total_revenue,
                'avg_revenue_per_program': total_revenue / len(programs) if programs else 0,
                'total_paid_enrollments': sum(p['enrollments'] for p in program_revenue)
            }
        })
    
    @action(detail=False, methods=['get'])
    def predictive_analytics(self, request):
        """Provide predictive insights and forecasting."""
        programs = self.get_director_programs(request.user)
        
        # Historical enrollment data for prediction
        historical_data = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            enrollments = Enrollment.objects.filter(
                cohort__track__program__in=programs,
                joined_at__gte=month_start,
                joined_at__lt=month_end
            ).count()
            
            historical_data.append({
                'month': month_start.strftime('%Y-%m'),
                'enrollments': enrollments
            })
        
        # Simple trend calculation (would use ML in production)
        recent_avg = sum(d['enrollments'] for d in historical_data[:3]) / 3
        older_avg = sum(d['enrollments'] for d in historical_data[6:9]) / 3
        trend = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
        
        # Predictions for next 3 months
        predictions = []
        base_prediction = recent_avg
        for i in range(3):
            predicted_enrollments = int(base_prediction * (1 + trend/100))
            future_month = timezone.now().replace(day=1) + timedelta(days=30*(i+1))
            
            predictions.append({
                'month': future_month.strftime('%Y-%m'),
                'predicted_enrollments': predicted_enrollments,
                'confidence': max(60, 90 - i*10)  # Decreasing confidence
            })
        
        # Risk factors
        risk_factors = []
        if trend < -10:
            risk_factors.append({'factor': 'Declining enrollment trend', 'severity': 'high'})
        
        # Get cohorts ending soon
        ending_soon = Cohort.objects.filter(
            track__program__in=programs,
            end_date__lte=timezone.now().date() + timedelta(days=30),
            status__in=['active', 'running']
        ).count()
        
        if ending_soon > 0:
            risk_factors.append({'factor': f'{ending_soon} cohorts ending soon', 'severity': 'medium'})
        
        return Response({
            'historical_data': historical_data[::-1],
            'predictions': predictions,
            'trend_analysis': {
                'trend_percentage': round(trend, 1),
                'trend_direction': 'increasing' if trend > 0 else 'decreasing' if trend < 0 else 'stable'
            },
            'risk_factors': risk_factors,
            'recommendations': [
                'Consider launching new cohorts to meet predicted demand' if trend > 10 else 'Focus on retention and completion rates',
                'Review mentor capacity for upcoming enrollments',
                'Plan marketing campaigns for low-enrollment periods'
            ]
        })