"""
Comprehensive Program Management Views for Directors.
Supports full CRUD operations with nested tracks, milestones, and modules.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from django.db import transaction
from django.conf import settings
from programs.models import Program, Track, Milestone, Module, Specialization, ProgramRule
from programs.serializers import (
    ProgramSerializer, ProgramDetailSerializer,
    TrackSerializer, MilestoneSerializer, ModuleSerializer, SpecializationSerializer
)
from users.utils.audit_utils import log_audit_event


class ProgramManagementViewSet(viewsets.ModelViewSet):
    """
    Comprehensive program management with nested structure support.
    Supports create, read, update, delete, filter operations.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProgramSerializer
    
    def get_queryset(self):
        """Filter programs based on user permissions and query params."""
        user = self.request.user
        queryset = Program.objects.all()
        
        # Filter by category (check both category field and categories array)
        category = self.request.query_params.get('category')
        if category:
            # Check if category matches the primary category field OR is in the categories array
            queryset = queryset.filter(
                Q(category=category) | Q(categories__contains=[category])
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Permission filtering
        if not user.is_staff:
            # Check if user has program_director or admin role
            from users.models import UserRole, Role
            director_roles = Role.objects.filter(name__in=['program_director', 'admin'])
            has_program_director_role = UserRole.objects.filter(
                user=user,
                role__in=director_roles,
                is_active=True
            ).exists()
            
            if has_program_director_role:
                # Program directors can see all programs (they may create programs without assigning themselves as track directors)
                pass  # No filtering needed
            else:
                # Regular users can only see programs where they are directors of tracks
                director_has_tracks = user.directed_tracks.exists()
                if director_has_tracks:
                    queryset = queryset.filter(
                        Q(tracks__director=user) | Q(tracks__isnull=True)
                    ).distinct()
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """Use detail serializer for retrieve action."""
        if self.action == 'retrieve':
            return ProgramDetailSerializer
        return ProgramSerializer
    
    @extend_schema(
        summary='Create Program with Full Structure',
        description='Create a program with optional tracks, milestones, and modules in a single transaction.',
    )
    def create(self, request, *args, **kwargs):
        """Create program with nested structure (tracks, specializations, rules)."""
        data = request.data.copy()
        tracks_data = data.pop('tracks', [])
        rules_data = data.pop('rules', [])
        
        # Log the incoming data for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating program with data keys: {list(data.keys())}")
        # Log actual values (excluding tracks which might be large)
        data_preview = {k: v for k, v in data.items() if k not in ['tracks', 'rules']}
        logger.info(f"Creating program with data values: {data_preview}")
        logger.info(f"Tracks count: {len(tracks_data)}, Rules count: {len(rules_data)}")
        
        try:
            with transaction.atomic():
                # Create program
                program_serializer = self.get_serializer(data=data)
                if not program_serializer.is_valid():
                    logger.error(f"Program validation failed: {program_serializer.errors}")
                    logger.error(f"Received data: {data_preview}")
                    return Response(
                        {
                            'error': 'Validation failed',
                            'details': program_serializer.errors,
                            'received_data': data_preview
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                program = program_serializer.save()
                
                # Ensure program is saved with all fields and categories
                program.refresh_from_db()
                log_audit_event(
                    request=request,
                    user=request.user,
                    action='create',
                    resource_type='program',
                    resource_id=str(program.id),
                    metadata={
                        'name': program.name,
                        'operation': 'programs-management.create',
                        'tracks_count': len(tracks_data),
                        'rules_count': len(rules_data),
                    },
                )
                logger.info(f"Program base created: {program.id} - {program.name}")
                logger.info(f"Program category: {program.category}, categories: {program.categories}")
                
                # Verify the program was saved correctly
                if not program.id:
                    raise ValueError("Program was not saved correctly - no ID assigned")
                
                # Create program rules (completion criteria)
                for rule_data in rules_data:
                    rule_obj = ProgramRule.objects.create(
                        program=program,
                        rule=rule_data.get('rule', {}),
                        active=rule_data.get('active', True),
                        version=rule_data.get('version', 1)
                    )
                    logger.info(f"Created program rule: {rule_obj.id} for program {program.id}")
                
                # Create tracks with specializations, milestones, and modules
                for track_data in tracks_data:
                    # Extract nested data
                    specializations_data = track_data.pop('specializations', [])
                    milestones_data = track_data.pop('milestones', [])
                    track_data['program'] = program.id
                    
                    # Convert director ID if it's a string/number
                    if 'director' in track_data and track_data['director']:
                        try:
                            track_data['director'] = int(track_data['director'])
                        except (ValueError, TypeError):
                            logger.warning(f"Invalid director ID: {track_data['director']}")
                            track_data['director'] = None
                    
                    track_serializer = TrackSerializer(data=track_data)
                    if not track_serializer.is_valid():
                        logger.error(f"Track validation failed: {track_serializer.errors}")
                        return Response(
                            {'error': 'Track validation failed', 'details': track_serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    track = track_serializer.save()
                    logger.info(f"Created track: {track.id} - {track.name}")
                    
                    # Create specializations for this track
                    for spec_data in specializations_data:
                        spec_data['track'] = track.id
                        spec_serializer = SpecializationSerializer(data=spec_data)
                        if not spec_serializer.is_valid():
                            logger.warning(f"Specialization validation failed: {spec_serializer.errors}")
                            continue  # Skip invalid specializations but continue
                        spec_serializer.save()
                        logger.info(f"Created specialization: {spec_data.get('name')} for track {track.name}")
                    
                    # Create milestones with modules
                    for milestone_data in milestones_data:
                        modules_data = milestone_data.pop('modules', [])
                        milestone_data['track'] = track.id
                        
                        milestone_serializer = MilestoneSerializer(data=milestone_data)
                        if not milestone_serializer.is_valid():
                            logger.warning(f"Milestone validation failed: {milestone_serializer.errors}")
                            continue  # Skip invalid milestones but continue
                        milestone = milestone_serializer.save()
                        
                        # Create modules
                        for module_data in modules_data:
                            applicable_tracks = module_data.pop('applicable_tracks', [])
                            module_data['milestone'] = milestone.id
                            
                            module_serializer = ModuleSerializer(data=module_data)
                            if not module_serializer.is_valid():
                                logger.warning(f"Module validation failed: {module_serializer.errors}")
                                continue  # Skip invalid modules but continue
                            module = module_serializer.save()
                            
                            # Set Many-to-Many relationships for cross-track content
                            if applicable_tracks:
                                track_ids = []
                                for t in applicable_tracks:
                                    if isinstance(t, dict):
                                        track_ids.append(t.get('id'))
                                    else:
                                        track_ids.append(t)
                                if track_ids:
                                    module.applicable_tracks.set(track_ids)
                
                # Refresh program from database to ensure all relationships are loaded
                program.refresh_from_db()
                
                # Reload program with all relationships prefetched for complete response
                from django.db.models import Prefetch
                program = Program.objects.prefetch_related(
                    Prefetch('tracks', queryset=Track.objects.prefetch_related(
                        Prefetch('specializations'),
                        Prefetch('milestones', queryset=Milestone.objects.prefetch_related('modules'))
                    )),
                    'rules'
                ).get(id=program.id)
                
                # Return full program structure with all nested data
                response_data = ProgramDetailSerializer(program).data
                logger.info(f"Program created successfully: {program.id} - {program.name}")
                logger.info(f"Program has {program.tracks.count()} tracks, {program.rules.count()} rules")
                
                return Response(
                    response_data,
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            logger.error(f"Error creating program: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary='Update Program',
        description='Update program and optionally its nested structure.',
    )
    def update(self, request, *args, **kwargs):
        """Update program with nested structure."""
        program = self.get_object()
        data = request.data.copy()
        tracks_data = data.pop('tracks', None)
        
        try:
            with transaction.atomic():
                # Update program
                program_serializer = self.get_serializer(program, data=data, partial=True)
                program_serializer.is_valid(raise_exception=True)
                program_serializer.save()
                
                # Update tracks if provided
                if tracks_data is not None:
                    # Delete tracks not in request
                    existing_track_ids = {str(t.id) for t in program.tracks.all()}
                    provided_track_ids = {str(t.get('id', '')) for t in tracks_data if t.get('id')}
                    tracks_to_delete = existing_track_ids - provided_track_ids
                    
                    if tracks_to_delete:
                        Track.objects.filter(id__in=tracks_to_delete).delete()
                    
                    # Create or update tracks
                    for track_data in tracks_data:
                        track_id = track_data.get('id')
                        milestones_data = track_data.pop('milestones', [])
                        
                        if track_id:
                            # Update existing track
                            track = Track.objects.get(id=track_id, program=program)
                            track_serializer = TrackSerializer(track, data=track_data, partial=True)
                            track_serializer.is_valid(raise_exception=True)
                            track = track_serializer.save()
                        else:
                            # Create new track
                            track_data['program'] = program.id
                            track_serializer = TrackSerializer(data=track_data)
                            track_serializer.is_valid(raise_exception=True)
                            track = track_serializer.save()
                        
                        # Update milestones
                        if milestones_data:
                            existing_milestone_ids = {str(m.id) for m in track.milestones.all()}
                            provided_milestone_ids = {str(m.get('id', '')) for m in milestones_data if m.get('id')}
                            milestones_to_delete = existing_milestone_ids - provided_milestone_ids
                            
                            if milestones_to_delete:
                                Milestone.objects.filter(id__in=milestones_to_delete).delete()
                            
                            for milestone_data in milestones_data:
                                milestone_id = milestone_data.get('id')
                                modules_data = milestone_data.pop('modules', [])
                                
                                if milestone_id:
                                    milestone = Milestone.objects.get(id=milestone_id, track=track)
                                    milestone_serializer = MilestoneSerializer(milestone, data=milestone_data, partial=True)
                                    milestone_serializer.is_valid(raise_exception=True)
                                    milestone = milestone_serializer.save()
                                else:
                                    milestone_data['track'] = track.id
                                    milestone_serializer = MilestoneSerializer(data=milestone_data)
                                    milestone_serializer.is_valid(raise_exception=True)
                                    milestone = milestone_serializer.save()
                                
                                # Update modules
                                if modules_data:
                                    existing_module_ids = {str(m.id) for m in milestone.modules.all()}
                                    provided_module_ids = {str(m.get('id', '')) for m in modules_data if m.get('id')}
                                    modules_to_delete = existing_module_ids - provided_module_ids
                                    
                                    if modules_to_delete:
                                        Module.objects.filter(id__in=modules_to_delete).delete()
                                    
                                    for module_data in modules_data:
                                        module_id = module_data.get('id')
                                        applicable_tracks = module_data.pop('applicable_tracks', [])
                                        
                                        if module_id:
                                            module = Module.objects.get(id=module_id, milestone=milestone)
                                            module_serializer = ModuleSerializer(module, data=module_data, partial=True)
                                            module_serializer.is_valid(raise_exception=True)
                                            module = module_serializer.save()
                                        else:
                                            module_data['milestone'] = milestone.id
                                            module_serializer = ModuleSerializer(data=module_data)
                                            module_serializer.is_valid(raise_exception=True)
                                            module = module_serializer.save()
                                        
                                        # Update Many-to-Many relationships
                                        if applicable_tracks:
                                            track_ids = [t['id'] if isinstance(t, dict) else t for t in applicable_tracks]
                                            module.applicable_tracks.set(track_ids)
                
                return Response(ProgramDetailSerializer(program).data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def add_track(self, request, pk=None):
        """Add a track to a program."""
        program = self.get_object()
        data = request.data.copy()
        data['program'] = program.id
        
        serializer = TrackSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def filter(self, request):
        """Filter programs with advanced filters."""
        queryset = self.get_queryset()
        
        # Additional filters
        min_duration = request.query_params.get('min_duration')
        if min_duration:
            queryset = queryset.filter(duration_months__gte=int(min_duration))
        
        max_duration = request.query_params.get('max_duration')
        if max_duration:
            queryset = queryset.filter(duration_months__lte=int(max_duration))
        
        min_price = request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(default_price__gte=float(min_price))
        
        max_price = request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(default_price__lte=float(max_price))
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

