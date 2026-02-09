"""
Missions API views for director dashboard
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Mission, MissionAssignment, MissionSubmission
from .serializers import MissionSerializer, MissionAssignmentSerializer, MissionSubmissionSerializer


class MissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing missions"""
    queryset = Mission.objects.filter(is_active=True)
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assignments(self, request, pk=None):
        """Assign mission to cohort or student"""
        mission = self.get_object()
        
        assignment_type = request.data.get('assignment_type')
        cohort_id = request.data.get('cohort_id')
        student_ids = request.data.get('student_ids', [])
        due_date = request.data.get('due_date')
        
        if not assignment_type:
            return Response({'error': 'assignment_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        assignments = []
        
        if assignment_type == 'cohort' and cohort_id:
            assignment = MissionAssignment.objects.create(
                mission=mission,
                assignment_type='cohort',
                cohort_id=cohort_id,
                assigned_by=request.user,
                due_date=due_date
            )
            assignments.append(assignment)
        
        elif assignment_type == 'individual' and student_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            for student_id in student_ids:
                try:
                    student = User.objects.get(id=student_id)
                    assignment = MissionAssignment.objects.create(
                        mission=mission,
                        assignment_type='individual',
                        student=student,
                        assigned_by=request.user,
                        due_date=due_date
                    )
                    assignments.append(assignment)
                except User.DoesNotExist:
                    continue
        
        serializer = MissionAssignmentSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def submissions(self, request, pk=None):
        """Submit work for a mission"""
        mission = self.get_object()
        
        assignment_id = request.data.get('assignment_id')
        content = request.data.get('content', '')
        attachments = request.data.get('attachments', [])
        
        if not assignment_id:
            return Response({'error': 'assignment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = MissionAssignment.objects.get(id=assignment_id, mission=mission)
        except MissionAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        submission = MissionSubmission.objects.create(
            assignment=assignment,
            student=request.user,
            content=content,
            attachments=attachments,
            status='submitted',
            submitted_at=timezone.now()
        )
        
        # Update assignment status
        assignment.status = 'submitted'
        assignment.save()
        
        serializer = MissionSubmissionSerializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sample_mission(request):
    """
    GET /api/v1/missions/sample
    Get a sample mission for Foundations preview.
    Returns a beginner-friendly mission without starting it.
    """
    try:
        # Get a beginner-friendly sample mission
        sample_mission = Mission.objects.filter(
            difficulty=1,  # Beginner difficulty
            mission_type='beginner',
            is_active=True
        ).order_by('?').first()
        
        # If no beginner mission, try any active mission
        if not sample_mission:
            sample_mission = Mission.objects.filter(
                is_active=True
            ).order_by('?').first()
        
        if not sample_mission:
            return Response(
                {'error': 'No sample mission available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return mission data (preview only, don't start it)
        serializer = MissionSerializer(sample_mission)
        return Response({
            **serializer.data,
            'preview_only': True,
            'message': 'This is a preview. You will start missions after completing Foundations.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch sample mission: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """View mission completion progress"""
        mission = self.get_object()
        
        assignments = MissionAssignment.objects.filter(mission=mission)
        submissions = MissionSubmission.objects.filter(assignment__mission=mission)
        
        total_assignments = assignments.count()
        completed_assignments = assignments.filter(status='completed').count()
        in_progress = assignments.filter(status='in_progress').count()
        submitted = assignments.filter(status='submitted').count()
        
        progress_data = {
            'mission_id': str(mission.id),
            'mission_title': mission.title,
            'total_assignments': total_assignments,
            'completed': completed_assignments,
            'in_progress': in_progress,
            'submitted': submitted,
            'completion_rate': (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0,
            'assignments': MissionAssignmentSerializer(assignments, many=True).data,
            'recent_submissions': MissionSubmissionSerializer(
                submissions.order_by('-submitted_at')[:10], many=True
            ).data
        }
        
        return Response(progress_data)