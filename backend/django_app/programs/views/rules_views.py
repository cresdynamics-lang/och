"""
Program Rules API Views - Completion rules management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from programs.models import Program, ProgramRule
from programs.serializers import ProgramRuleSerializer
from programs.services.director_service import DirectorService


class DirectorProgramRuleViewSet(viewsets.ModelViewSet):
    """Program Director's completion rules management."""
    serializer_class = ProgramRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get rules for programs where user is a director."""
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        
        queryset = ProgramRule.objects.filter(active=True)
        
        if program_id:
            program = Program.objects.get(id=program_id)
            if not DirectorService.can_manage_program(user, program):
                return ProgramRule.objects.none()
            queryset = queryset.filter(program_id=program_id)
        else:
            # Get all programs user can manage
            programs = DirectorService.get_director_programs(user)
            queryset = queryset.filter(program__in=programs)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create completion rule."""
        user = self.request.user
        program = serializer.validated_data['program']
        
        if not DirectorService.can_manage_program(user, program):
            return Response(
                {'error': 'You do not have permission to create rules for this program'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate rule structure
        rule_data = serializer.validated_data.get('rule', {})
        criteria = rule_data.get('criteria', {})
        
        # Ensure required criteria fields are present
        if not criteria:
            return Response(
                {'error': 'Rule must include criteria'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return serializer.save()
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a rule version (deactivate others)."""
        rule = self.get_object()
        
        # Deactivate other versions
        ProgramRule.objects.filter(
            program=rule.program,
            active=True
        ).exclude(id=rule.id).update(active=False)
        
        # Activate this version
        rule.active = True
        rule.save()
        
        serializer = self.get_serializer(rule)
        return Response(serializer.data)

