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
        """Get enrollment funnel analysis from real enrollment data."""
        programs = self.get_director_programs(request.user)
        
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
        
        # Funnel from applications (100%) — no mock inquiry data
        base = total_applications if total_applications > 0 else 1
        funnel_data = [
            {'stage': 'Applications', 'count': total_applications, 'percentage': 100.0},
            {'stage': 'Pending Approval', 'count': pending_approvals, 'percentage': round(pending_approvals / base * 100, 1)},
            {'stage': 'Active', 'count': active_enrollments, 'percentage': round(active_enrollments / base * 100, 1)},
            {'stage': 'Completed', 'count': completed_enrollments, 'percentage': round(completed_enrollments / base * 100, 1)}
        ]
        
        return Response({
            'funnel': funnel_data,
            'conversion_rates': {
                'application_to_active': round((active_enrollments / total_applications * 100), 1) if total_applications > 0 else 0,
                'active_to_completion': round((completed_enrollments / active_enrollments * 100), 1) if active_enrollments > 0 else 0
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
            
            # Calculate metrics from real data only
            completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
            seat_utilization = (active_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
            
            comparison_data.append({
                'cohort_id': str(cohort.id),
                'name': cohort.name,
                'program': cohort.track.program.name,
                'track': cohort.track.name,
                'status': cohort.status,
                'total_enrollments': total_count,
                'completion_rate': round(completion_rate, 1),
                'seat_utilization': round(seat_utilization, 1),
                'avg_attendance': None,  # Requires attendance system
                'avg_satisfaction': None,  # Requires feedback system
                'start_date': cohort.start_date.isoformat() if cohort.start_date else None
            })
        
        completion_rates = [c['completion_rate'] for c in comparison_data]
        seat_utilizations = [c['seat_utilization'] for c in comparison_data]
        return Response({
            'cohorts': comparison_data,
            'benchmarks': {
                'avg_completion_rate': sum(completion_rates) / len(completion_rates) if comparison_data else 0,
                'avg_seat_utilization': sum(seat_utilizations) / len(seat_utilizations) if comparison_data else 0,
                'avg_attendance': None,
                'avg_satisfaction': None
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
                    'avg_satisfaction': None,  # Requires feedback system
                    'sessions_completed': 0   # Requires session tracking when available
                }
            
            # Count active mentees in this cohort
            mentees_count = assignment.cohort.enrollments.filter(status='active').count()
            mentor_data[mentor_id]['assignments'].append({
                'cohort_name': assignment.cohort.name,
                'role': assignment.role,
                'mentees_count': mentees_count
            })
            mentor_data[mentor_id]['total_mentees'] += mentees_count
        
        # Calculate utilization from real data
        for mentor in mentor_data.values():
            mentor['utilization'] = (mentor['total_mentees'] / mentor['capacity_weekly'] * 100) if mentor['capacity_weekly'] > 0 else 0
        
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
            # Use program default_price only when set; otherwise revenue is 0 (no dummy pricing)
            program_price = float(program.default_price) if program.default_price else 0.0
            program_total = enrollments.count() * program_price
            total_revenue += program_total
            
            program_revenue.append({
                'program_id': str(program.id),
                'program_name': program.name,
                'enrollments': enrollments.count(),
                'price_per_seat': program_price,
                'total_revenue': program_total,
                'currency': program.currency or ''
            })
        
        # Monthly revenue from real enrollments and program prices only
        monthly_revenue = []
        for i in range(6):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_enrollments_qs = Enrollment.objects.filter(
                cohort__track__program__in=programs,
                status__in=['active', 'completed'],
                payment_status='paid',
                joined_at__gte=month_start,
                joined_at__lt=month_end
            ).select_related('cohort__track__program')
            # Sum actual revenue from program.default_price per enrollment when set
            month_revenue_sum = 0
            month_count = 0
            for enr in month_enrollments_qs:
                prog = enr.cohort.track.program
                price = float(prog.default_price) if prog.default_price else 0.0
                month_revenue_sum += price
                month_count += 1
            monthly_revenue.append({
                'month': month_start.strftime('%Y-%m'),
                'enrollments': month_count,
                'revenue': month_revenue_sum
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