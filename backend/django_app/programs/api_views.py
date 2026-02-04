"""
API Views for Cohorts, Modules, Milestones, and Specializations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Cohort, Module, Milestone, Specialization
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