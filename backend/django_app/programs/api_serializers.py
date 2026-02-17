"""
Serializers for Cohorts, Modules, Milestones, and Specializations API endpoints.
"""
from rest_framework import serializers
from .models import Cohort, Module, Milestone, Specialization, Track, Program
from users.models import User


class ProgramNestedSerializer(serializers.ModelSerializer):
    """Nested program serializer for related objects."""
    class Meta:
        model = Program
        fields = ['id', 'name']


class TrackNestedSerializer(serializers.ModelSerializer):
    """Nested track serializer for related objects."""
    program = ProgramNestedSerializer(read_only=True)
    
    class Meta:
        model = Track
        fields = ['id', 'name', 'program']


class UserNestedSerializer(serializers.ModelSerializer):
    """Nested user serializer for coordinators."""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class CohortSerializer(serializers.ModelSerializer):
    """Cohort serializer with nested track information."""
    track = TrackNestedSerializer(read_only=True)
    coordinator = UserNestedSerializer(read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    seat_utilization = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Cohort
        fields = [
            'id', 'track', 'curriculum_tracks', 'name', 'start_date', 'end_date', 'mode',
            'seat_cap', 'mentor_ratio', 'calendar_template_id', 'coordinator',
            'seat_pool', 'status', 'enrollment_count', 'seat_utilization',
            'completion_rate', 'published_to_homepage', 'profile_image', 'profile_image_url',
            'registration_form_fields', 'created_at', 'updated_at'
        ]
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url if obj.profile_image else None
        return None
    
    def get_enrollment_count(self, obj):
        return obj.enrollments.filter(status='active').count()


class CreateCohortSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating cohorts."""
    track = serializers.UUIDField(required=False)
    coordinator = serializers.UUIDField(required=False, allow_null=True)
    assigned_staff = serializers.DictField(required=False, allow_empty=True)
    curriculum_tracks = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        help_text='List of curriculum track slugs'
    )
    
    class Meta:
        model = Cohort
        fields = [
            'track', 'curriculum_tracks', 'name', 'start_date', 'end_date', 'mode',
            'seat_cap', 'mentor_ratio', 'calendar_template_id',
            'coordinator', 'seat_pool', 'assigned_staff', 'status',
            'published_to_homepage', 'profile_image', 'registration_form_fields'
        ]
    
    def validate_track(self, value):
        try:
            return Track.objects.get(id=value)
        except Track.DoesNotExist:
            raise serializers.ValidationError("Track not found")
    
    def validate_coordinator(self, value):
        if value:
            try:
                return User.objects.get(uuid_id=value)
            except User.DoesNotExist:
                raise serializers.ValidationError("Coordinator not found")
        return None
    
    def create(self, validated_data):
        track = validated_data.pop('track', None)
        coordinator = validated_data.pop('coordinator', None)
        assigned_staff = validated_data.pop('assigned_staff', {})
        curriculum_tracks = validated_data.pop('curriculum_tracks', [])
        
        cohort = Cohort.objects.create(
            track=track,
            coordinator=coordinator,
            curriculum_tracks=curriculum_tracks,
            **validated_data
        )
        
        # Handle mentor assignments if provided
        if assigned_staff.get('mentors'):
            from .models import MentorAssignment
            for mentor_id in assigned_staff['mentors']:
                try:
                    mentor = User.objects.get(uuid_id=mentor_id)
                    MentorAssignment.objects.create(
                        cohort=cohort,
                        mentor=mentor,
                        role='support'
                    )
                except User.DoesNotExist:
                    pass  # Skip invalid mentor IDs
        
        return cohort


class MilestoneNestedSerializer(serializers.ModelSerializer):
    """Nested milestone serializer for modules."""
    track = TrackNestedSerializer(read_only=True)
    
    class Meta:
        model = Milestone
        fields = ['id', 'name', 'track']


class ModuleSerializer(serializers.ModelSerializer):
    """Module serializer with nested milestone information."""
    milestone = MilestoneNestedSerializer(read_only=True)
    applicable_tracks = TrackNestedSerializer(many=True, read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'milestone', 'name', 'description', 'content_type',
            'content_url', 'order', 'estimated_hours', 'skills',
            'applicable_tracks', 'created_at', 'updated_at'
        ]


class CreateModuleSerializer(serializers.ModelSerializer):
    """Serializer for creating modules."""
    milestone = serializers.UUIDField()
    applicable_tracks = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Module
        fields = [
            'milestone', 'name', 'description', 'content_type',
            'content_url', 'order', 'estimated_hours', 'skills',
            'applicable_tracks'
        ]
    
    def validate_milestone(self, value):
        try:
            return Milestone.objects.get(id=value)
        except Milestone.DoesNotExist:
            raise serializers.ValidationError("Milestone not found")
    
    def validate_applicable_tracks(self, value):
        if value:
            tracks = Track.objects.filter(id__in=value)
            if len(tracks) != len(value):
                raise serializers.ValidationError("One or more tracks not found")
            return tracks
        return []
    
    def create(self, validated_data):
        milestone = validated_data.pop('milestone')
        applicable_tracks = validated_data.pop('applicable_tracks', [])
        
        module = Module.objects.create(
            milestone=milestone,
            **validated_data
        )
        
        if applicable_tracks:
            module.applicable_tracks.set(applicable_tracks)
        
        return module


class MilestoneSerializer(serializers.ModelSerializer):
    """Milestone serializer with nested track information."""
    track = TrackNestedSerializer(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'track', 'name', 'description', 'order',
            'duration_weeks', 'modules', 'created_at', 'updated_at'
        ]


class CreateMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for creating milestones."""
    track = serializers.UUIDField()
    
    class Meta:
        model = Milestone
        fields = ['track', 'name', 'description', 'order', 'duration_weeks']
    
    def validate_track(self, value):
        try:
            return Track.objects.get(id=value)
        except Track.DoesNotExist:
            raise serializers.ValidationError("Track not found")
    
    def create(self, validated_data):
        track = validated_data.pop('track')
        return Milestone.objects.create(track=track, **validated_data)


class SpecializationSerializer(serializers.ModelSerializer):
    """Specialization serializer with nested track information."""
    track = TrackNestedSerializer(read_only=True)
    
    class Meta:
        model = Specialization
        fields = [
            'id', 'track', 'name', 'description', 'missions',
            'duration_weeks', 'created_at', 'updated_at'
        ]


class CreateSpecializationSerializer(serializers.ModelSerializer):
    """Serializer for creating specializations."""
    track = serializers.UUIDField()
    
    class Meta:
        model = Specialization
        fields = ['track', 'name', 'description', 'missions', 'duration_weeks']
    
    def validate_track(self, value):
        try:
            return Track.objects.get(id=value)
        except Track.DoesNotExist:
            raise serializers.ValidationError("Track not found")
    
    def create(self, validated_data):
        track = validated_data.pop('track')
        return Specialization.objects.create(track=track, **validated_data)