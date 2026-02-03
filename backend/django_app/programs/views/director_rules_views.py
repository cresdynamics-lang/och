"""
Program Rules Definition API for Directors.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from ..models import Program, ProgramRule, Enrollment
from ..serializers import ProgramRuleSerializer
from ..permissions import IsProgramDirector

import logging

logger = logging.getLogger(__name__)


class DirectorProgramRulesViewSet(viewsets.ModelViewSet):
    """Director Program Rules Management API."""
    permission_classes = [IsAuthenticated, IsProgramDirector]
    serializer_class = ProgramRuleSerializer
    
    def get_queryset(self):
        """Directors can only see rules for their programs."""
        user = self.request.user
        if user.is_staff:
            return ProgramRule.objects.all()
        return ProgramRule.objects.filter(program__tracks__director=user).distinct()
    
    def create(self, request):
        """Create new program rule."""
        program_id = request.data.get('program_id')
        
        try:
            program = Program.objects.get(id=program_id)
            if not request.user.is_staff and not program.tracks.filter(director=request.user).exists():
                return Response(
                    {'error': 'Access denied to this program'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Deactivate existing active rules
            ProgramRule.objects.filter(program=program, active=True).update(active=False)
            
            # Create new rule
            rule_data = request.data.copy()
            rule_data['program'] = program.id
            rule_data['active'] = True
            rule_data['version'] = ProgramRule.objects.filter(program=program).count() + 1
            
            serializer = self.get_serializer(data=rule_data)
            if serializer.is_valid():
                rule = serializer.save()
                return Response(ProgramRuleSerializer(rule).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Program.DoesNotExist:
            return Response(
                {'error': 'Program not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get rule templates for different program types."""
        templates = {
            'technical': {
                'name': 'Technical Program Rules',
                'criteria': {
                    'attendance_percent': 80,
                    'portfolio_approved': True,
                    'feedback_score': 4.0,
                    'payment_complete': True,
                    'missions_completed': 8,
                    'peer_reviews': 3
                },
                'thresholds': {
                    'min_portfolio_score': 70,
                    'max_absences': 3,
                    'min_peer_rating': 3.5
                },
                'dependencies': [
                    'profiling_complete',
                    'foundations_complete'
                ]
            },
            'leadership': {
                'name': 'Leadership Program Rules',
                'criteria': {
                    'attendance_percent': 85,
                    'portfolio_approved': True,
                    'feedback_score': 4.2,
                    'payment_complete': True,
                    'leadership_project': True,
                    'team_evaluations': 2
                },
                'thresholds': {
                    'min_portfolio_score': 75,
                    'max_absences': 2,
                    'min_team_rating': 4.0
                },
                'dependencies': [
                    'profiling_complete',
                    'foundations_complete',
                    'leadership_assessment'
                ]
            },
            'mentorship': {
                'name': 'Mentorship Program Rules',
                'criteria': {
                    'attendance_percent': 90,
                    'portfolio_approved': True,
                    'feedback_score': 4.5,
                    'payment_complete': True,
                    'mentoring_hours': 20,
                    'mentee_feedback': True
                },
                'thresholds': {
                    'min_portfolio_score': 80,
                    'max_absences': 1,
                    'min_mentee_rating': 4.0
                },
                'dependencies': [
                    'profiling_complete',
                    'foundations_complete',
                    'mentor_certification'
                ]
            }
        }
        
        return Response(templates)
    
    @action(detail=True, methods=['post'])
    def test_rule(self, request, pk=None):
        """Test rule against current enrollments."""
        rule = self.get_object()
        program = rule.program
        
        # Get all enrollments for this program
        enrollments = Enrollment.objects.filter(
            cohort__track__program=program,
            status__in=['active', 'completed']
        )
        
        results = []
        for enrollment in enrollments:
            result = self._evaluate_enrollment(enrollment, rule.rule)
            results.append({
                'enrollment_id': str(enrollment.id),
                'user_email': enrollment.user.email,
                'cohort_name': enrollment.cohort.name,
                'eligible': result['eligible'],
                'score': result['score'],
                'missing_criteria': result['missing_criteria']
            })
        
        return Response({
            'rule_version': rule.version,
            'total_enrollments': len(results),
            'eligible_count': sum(1 for r in results if r['eligible']),
            'results': results
        })
    
    @action(detail=True, methods=['post'])
    def apply_rule(self, request, pk=None):
        """Apply rule to generate certificates for eligible enrollments."""
        rule = self.get_object()
        program = rule.program
        
        # Get completed enrollments without certificates
        enrollments = Enrollment.objects.filter(
            cohort__track__program=program,
            status='completed',
            certificate__isnull=True
        )
        
        eligible_enrollments = []
        for enrollment in enrollments:
            result = self._evaluate_enrollment(enrollment, rule.rule)
            if result['eligible']:
                eligible_enrollments.append(enrollment)
        
        # Generate certificates (placeholder - would integrate with certificate service)
        certificates_generated = []
        for enrollment in eligible_enrollments:
            # TODO: Integrate with actual certificate generation service
            certificates_generated.append({
                'enrollment_id': str(enrollment.id),
                'user_email': enrollment.user.email,
                'certificate_url': f'/certificates/{enrollment.id}.pdf'
            })
        
        return Response({
            'message': f'Generated {len(certificates_generated)} certificates',
            'certificates': certificates_generated
        })
    
    def _evaluate_enrollment(self, enrollment, rule_criteria):
        """Evaluate if enrollment meets rule criteria."""
        criteria = rule_criteria.get('criteria', {})
        thresholds = rule_criteria.get('thresholds', {})
        dependencies = rule_criteria.get('dependencies', [])
        
        score = 0
        max_score = len(criteria) + len(dependencies)
        missing_criteria = []
        
        # Check basic criteria
        if criteria.get('attendance_percent'):
            # TODO: Calculate actual attendance
            attendance = 85  # Mock value
            if attendance >= criteria['attendance_percent']:
                score += 1
            else:
                missing_criteria.append(f'Attendance: {attendance}% < {criteria["attendance_percent"]}%')
        
        if criteria.get('portfolio_approved'):
            # TODO: Check actual portfolio status
            portfolio_approved = True  # Mock value
            if portfolio_approved:
                score += 1
            else:
                missing_criteria.append('Portfolio not approved')
        
        if criteria.get('feedback_score'):
            # TODO: Calculate actual feedback score
            feedback_score = 4.2  # Mock value
            if feedback_score >= criteria['feedback_score']:
                score += 1
            else:
                missing_criteria.append(f'Feedback score: {feedback_score} < {criteria["feedback_score"]}')
        
        if criteria.get('payment_complete'):
            payment_complete = enrollment.payment_status == 'paid'
            if payment_complete:
                score += 1
            else:
                missing_criteria.append('Payment not complete')
        
        # Check dependencies
        for dependency in dependencies:
            # TODO: Check actual dependency status
            dependency_met = True  # Mock value
            if dependency_met:
                score += 1
            else:
                missing_criteria.append(f'Dependency not met: {dependency}')
        
        return {
            'eligible': len(missing_criteria) == 0,
            'score': score,
            'max_score': max_score,
            'missing_criteria': missing_criteria
        }