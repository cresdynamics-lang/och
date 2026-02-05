"""
API Views for Cohorts, Modules, Milestones, and Specializations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Cohort, Module, Milestone, Specialization, CalendarTemplate
from .api_serializers import (
    CohortSerializer, CreateCohortSerializer,
    ModuleSerializer, CreateModuleSerializer,
    MilestoneSerializer, CreateMilestoneSerializer,
    SpecializationSerializer, CreateSpecializationSerializer
)
from .permissions import IsDirectorOrAdmin


class CohortViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cohorts."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Cohort.objects.select_related(
            'track__program', 'coordinator'
        ).prefetch_related('enrollments')
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        # Filter by program if provided
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-start_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateCohortSerializer
        return CohortSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cohort = serializer.save()
        
        # Return the created cohort with full details
        response_serializer = CohortSerializer(cohort)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a cohort."""
        cohort = self.get_object()
        cohort.status = 'active'
        cohort.save()
        
        serializer = self.get_serializer(cohort)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Cohort activated successfully'
        })
    
    @action(detail=True, methods=['get', 'post'])
    def sponsors(self, request, pk=None):
        """Get or assign sponsors for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            # Get sponsors assigned to this cohort
            return Response({
                'success': True,
                'data': [],
                'message': 'Sponsors retrieved successfully'
            })
        
        elif request.method == 'POST':
            # Assign sponsor to cohort
            sponsor_id = request.data.get('sponsor_id')
            seat_allocation = request.data.get('seat_allocation', 0)
            role = request.data.get('role', 'funding')
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            funding_agreement_id = request.data.get('funding_agreement_id')
            
            if not sponsor_id:
                return Response({
                    'success': False,
                    'error': 'sponsor_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not seat_allocation or seat_allocation <= 0:
                return Response({
                    'success': False,
                    'error': 'seat_allocation must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Save to database
            try:
                from sponsors.models import SponsorCohortAssignment
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # Try to find user by ID first, then by uuid_id if that fails
                try:
                    sponsor_user = User.objects.get(id=sponsor_id)
                except (User.DoesNotExist, ValueError):
                    # If ID lookup fails, try uuid_id
                    sponsor_user = User.objects.get(uuid_id=sponsor_id)
                
                assignment, created = SponsorCohortAssignment.objects.get_or_create(
                    sponsor_uuid_id=sponsor_user,
                    cohort_id=cohort,
                    defaults={
                        'role': role,
                        'seat_allocation': seat_allocation,
                        'start_date': start_date,
                        'end_date': end_date,
                        'funding_agreement_id': funding_agreement_id
                    }
                )
                
                return Response({
                    'success': True,
                    'data': {
                        'assignment_id': str(assignment.id),
                        'cohort_id': str(cohort.id),
                        'sponsor_id': str(sponsor_user.id),
                        'sponsor_uuid_id': str(sponsor_user.uuid_id),
                        'seat_allocation': assignment.seat_allocation,
                        'role': assignment.role,
                        'start_date': assignment.start_date,
                        'end_date': assignment.end_date,
                        'funding_agreement_id': assignment.funding_agreement_id
                    },
                    'message': 'Sponsor assigned successfully'
                }, status=status.HTTP_201_CREATED)
                
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sponsor user not found'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'success': False,
                    'error': f'Failed to assign sponsor: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing modules."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Module.objects.select_related(
            'milestone__track__program'
        ).prefetch_related('applicable_tracks')
        
        # Filter by milestone if provided
        milestone_id = self.request.query_params.get('milestone')
        if milestone_id:
            queryset = queryset.filter(milestone_id=milestone_id)
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(milestone__track_id=track_id)
        
        # Filter by content type if provided
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        return queryset.order_by('milestone__order', 'order')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateModuleSerializer
        return ModuleSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()
        
        # Return the created module with full details
        response_serializer = ModuleSerializer(module)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing milestones."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Milestone.objects.select_related(
            'track__program'
        ).prefetch_related('modules')
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        # Filter by program if provided
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        
        return queryset.order_by('track__name', 'order')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateMilestoneSerializer
        return MilestoneSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save()
        
        # Return the created milestone with full details
        response_serializer = MilestoneSerializer(milestone)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })
    
    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        """Get all modules for a milestone."""
        milestone = self.get_object()
        modules = milestone.modules.all().order_by('order')
        serializer = ModuleSerializer(modules, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class SpecializationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing specializations."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    
    def get_queryset(self):
        queryset = Specialization.objects.select_related('track__program')
        
        # Filter by track if provided
        track_id = self.request.query_params.get('track')
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        # Filter by program if provided
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(track__program_id=program_id)
        
        return queryset.order_by('track__name', 'name')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateSpecializationSerializer
        return SpecializationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        specialization = serializer.save()
        
        # Return the created specialization with full details
        response_serializer = SpecializationSerializer(specialization)
        return Response(
            {'success': True, 'data': response_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })


class CalendarTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing calendar templates."""
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]
    queryset = CalendarTemplate.objects.select_related('program', 'track')
    
    def create(self, request, *args, **kwargs):
        data = request.data
        template = CalendarTemplate.objects.create(
            program_id=data['program_id'],
            track_id=data['track_id'],
            name=data['name'],
            timezone=data.get('timezone', 'Africa/Nairobi'),
            events=data.get('events', [])
        )
        return Response({
            'success': True,
            'data': {
                'template_id': str(template.id),
                'program_id': str(template.program_id),
                'track_id': str(template.track_id),
                'name': template.name,
                'timezone': template.timezone,
                'events': template.events
            }
        }, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [{
            'template_id': str(t.id),
            'program_id': str(t.program_id),
            'track_id': str(t.track_id),
            'name': t.name,
            'timezone': t.timezone,
            'events': t.events
        } for t in queryset]
        return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsor_assignments(request):
    """Get all sponsor assignments across cohorts."""
    try:
        from sponsors.models import SponsorCohortAssignment
        
        assignments = SponsorCohortAssignment.objects.all().select_related('sponsor_uuid_id', 'cohort_id__track')
        
        data = []
        for assignment in assignments:
            data.append({
                'id': str(assignment.id),
                'sponsor_uuid_id': str(assignment.sponsor_uuid_id.uuid_id),
                'sponsor': {
                    'name': f"{assignment.sponsor_uuid_id.first_name} {assignment.sponsor_uuid_id.last_name}".strip(),
                    'email': assignment.sponsor_uuid_id.email,
                    'organization': None  # Add if needed
                },
                'cohort': {
                    'id': str(assignment.cohort_id.id),
                    'name': assignment.cohort_id.name,
                    'track': {
                        'name': assignment.cohort_id.track.name if assignment.cohort_id.track else 'Unknown Track'
                    }
                },
                'role': assignment.role,
                'seat_allocation': assignment.seat_allocation,
                'start_date': assignment.start_date.isoformat() if assignment.start_date else None,
                'end_date': assignment.end_date.isoformat() if assignment.end_date else None,
                'funding_agreement_id': assignment.funding_agreement_id,
                'created_at': assignment.created_at.isoformat(),
                'updated_at': assignment.updated_at.isoformat()
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data),
            'message': 'Sponsor assignments retrieved successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to retrieve sponsor assignments: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)