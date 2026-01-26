"""
Serializers for Programs app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Program, Track, Milestone, Module, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist, MentorshipCycle
)

User = get_user_model()


# Define serializers in dependency order: Module -> Milestone -> Track -> Program

class ModuleSerializer(serializers.ModelSerializer):
    milestone_name = serializers.CharField(source='milestone.name', read_only=True)
    applicable_track_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_applicable_track_names(self, obj):
        return [track.name for track in obj.applicable_tracks.all()]


class MilestoneSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Milestone
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate milestone data."""
        # Validate name field - check for empty strings
        name = data.get('name')
        if not name or (isinstance(name, str) and name.strip() == ''):
            raise serializers.ValidationError({'name': 'This field may not be blank.'})
        
        # Validate track field
        track = data.get('track')
        if not track:
            raise serializers.ValidationError({'track': 'This field is required.'})
        
        # Validate duration_weeks if provided
        duration_weeks = data.get('duration_weeks')
        if duration_weeks is not None and duration_weeks < 1:
            raise serializers.ValidationError({
                'duration_weeks': 'Duration must be at least 1 week if provided.'
            })
        
        # Validate order if provided
        order = data.get('order')
        if order is not None and order < 0:
            raise serializers.ValidationError({
                'order': 'Order must be a non-negative integer.'
            })
        
        return data


class TrackSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    specializations = serializers.SerializerMethodField()
    
    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate track data."""
        # For updates (PATCH), only validate fields that are being updated
        is_update = self.instance is not None
        
        # Validate name field - check for empty strings (only if being updated)
        if not is_update or 'name' in data:
            name = data.get('name')
            if name is not None:  # Only validate if name is provided
                if not name or (isinstance(name, str) and name.strip() == ''):
                    raise serializers.ValidationError({'name': 'This field may not be blank.'})
        
        # Validate key field - check for empty strings (only if being updated)
        if not is_update or 'key' in data:
            key = data.get('key')
            if key is not None:  # Only validate if key is provided
                if not key or (isinstance(key, str) and key.strip() == ''):
                    raise serializers.ValidationError({'key': 'This field may not be blank.'})
        
        # Validate program field (only required on create)
        if not is_update:
            program = data.get('program')
            if not program:
                raise serializers.ValidationError({'program': 'This field is required.'})
        
        # Check for unique constraint (program + key)
        # Get program from instance if not in data (for updates)
        program = data.get('program')
        if not program and self.instance:
            program = self.instance.program_id
        
        key = data.get('key')
        if not key and self.instance:
            key = self.instance.key
        
        # Only check unique constraint if both program and key are available
        if program and key:
            existing_track = Track.objects.filter(program=program, key=key.strip()).first()
            if existing_track and (not self.instance or existing_track.id != self.instance.id):
                raise serializers.ValidationError({
                    'key': f'A track with key "{key.strip()}" already exists in this program. Please choose a different key.'
                })
        
        return data
    
    def get_specializations(self, obj):
        """Get specializations for this track."""
        if hasattr(obj, 'specializations'):
            return SpecializationSerializer(obj.specializations.all(), many=True).data
        return []


class ProgramSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    tracks_count = serializers.SerializerMethodField()
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=Program.PROGRAM_CATEGORY_CHOICES),
        required=False,
        allow_empty=True,
        help_text='List of categories'
    )
    category = serializers.ChoiceField(
        choices=Program.PROGRAM_CATEGORY_CHOICES,
        required=False,
        help_text='Primary category (auto-set from categories if not provided)'
    )
    
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure either category or categories is provided."""
        # Validate name field - check for empty strings
        name = data.get('name')
        if not name or (isinstance(name, str) and name.strip() == ''):
            raise serializers.ValidationError({'name': 'This field may not be blank.'})
        
        categories = data.get('categories', [])
        category = data.get('category')
        
        # If categories provided but no category, set category from first
        if categories and not category:
            data['category'] = categories[0]
        # If category provided but no categories, set categories from category
        elif category and not categories:
            data['categories'] = [category]
        # If neither provided, use default
        elif not category and not categories:
            data['category'] = 'technical'
            data['categories'] = ['technical']
        
        return data
    
    def get_tracks_count(self, obj):
        return obj.tracks.count()
    
    def create(self, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category')
        
        # If categories provided, use first as primary category for backward compatibility
        if categories:
            validated_data['category'] = categories[0]
            program = super().create(validated_data)
            program.categories = categories
            program.save()
        # If only category provided (backward compatibility), populate categories array
        elif category:
            program = super().create(validated_data)
            program.categories = [category]
            program.save()
        else:
            # Default to empty categories if neither provided
            program = super().create(validated_data)
            program.categories = []
            program.save()
        return program
    
    def update(self, instance, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category', None)
        
        # If categories provided, use first as primary category for backward compatibility
        if categories is not None:
            if categories:
                validated_data['category'] = categories[0]
                instance.categories = categories
            else:
                # If empty array, keep existing category but clear categories
                instance.categories = []
        # If only category provided (backward compatibility), update categories array
        elif category and category != instance.category:
            instance.categories = [category]
        
        program = super().update(instance, validated_data)
        return program


class ProgramDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested tracks, milestones, and modules."""
    tracks = TrackSerializer(many=True, read_only=True)
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=Program.PROGRAM_CATEGORY_CHOICES),
        required=False,
        allow_empty=True,
        help_text='List of categories'
    )
    category = serializers.ChoiceField(
        choices=Program.PROGRAM_CATEGORY_CHOICES,
        required=False,
        help_text='Primary category (auto-set from categories if not provided)'
    )
    
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure either category or categories is provided."""
        # Validate name field - check for empty strings
        name = data.get('name')
        if not name or (isinstance(name, str) and name.strip() == ''):
            raise serializers.ValidationError({'name': 'This field may not be blank.'})
        
        # Convert empty string to None for URLField to avoid validation errors
        missions_registry_link = data.get('missions_registry_link')
        if missions_registry_link == '':
            data['missions_registry_link'] = None
        
        # Ensure outcomes is a list
        outcomes = data.get('outcomes')
        if outcomes is None:
            data['outcomes'] = []
        elif not isinstance(outcomes, list):
            # Convert to list if it's not already
            data['outcomes'] = [outcomes] if outcomes else []
        
        # Ensure structure is a dict
        structure = data.get('structure')
        if structure is None:
            data['structure'] = {}
        
        categories = data.get('categories', [])
        category = data.get('category')
        
        # If categories provided but no category, set category from first
        if categories and not category:
            data['category'] = categories[0]
        # If category provided but no categories, set categories from category
        elif category and not categories:
            data['categories'] = [category]
        # If neither provided, use default
        elif not category and not categories:
            data['category'] = 'technical'
            data['categories'] = ['technical']
        
        return data
    
    def create(self, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category')
        
        # If categories provided, use first as primary category for backward compatibility
        if categories:
            validated_data['category'] = categories[0]
            program = super().create(validated_data)
            program.categories = categories
            program.save()
        # If only category provided (backward compatibility), populate categories array
        elif category:
            program = super().create(validated_data)
            program.categories = [category]
            program.save()
        else:
            # Default to empty categories if neither provided
            program = super().create(validated_data)
            program.categories = []
            program.save()
        return program
    
    def update(self, instance, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category', None)
        
        # If categories provided, use first as primary category for backward compatibility
        if categories is not None:
            if categories:
                validated_data['category'] = categories[0]
                instance.categories = categories
            else:
                # If empty array, keep existing category but clear categories
                instance.categories = []
        # If only category provided (backward compatibility), update categories array
        elif category and category != instance.category:
            instance.categories = [category]
        
        program = super().update(instance, validated_data)
        return program


class SpecializationSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    
    class Meta:
        model = Specialization
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CohortSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    seat_utilization = serializers.FloatField(read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cohort
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate cohort data."""
        # NOTE: This serializer is used for both create and partial updates (PATCH).
        # Only enforce required fields on create, or when the field is explicitly provided.
        is_create = self.instance is None

        # Validate name field - check for empty strings
        if is_create or 'name' in data:
            name = data.get('name')
            if not name or (isinstance(name, str) and name.strip() == ''):
                raise serializers.ValidationError({'name': 'This field may not be blank.'})
        
        # Validate track field
        if is_create or 'track' in data:
            track = data.get('track')
            if not track:
                raise serializers.ValidationError({'track': 'This field is required.'})
        
        # Convert empty string to None for UUIDField to avoid validation errors
        calendar_template_id = data.get('calendar_template_id')
        if calendar_template_id == '':
            data['calendar_template_id'] = None
        
        # Validate dates
        start_date = data.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = data.get('end_date', getattr(self.instance, 'end_date', None))
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })
        
        # Validate seat_pool if provided
        seat_pool = data.get('seat_pool', {})
        if isinstance(seat_pool, dict):
            seat_cap = data.get('seat_cap', getattr(self.instance, 'seat_cap', 0) or 0)
            total_allocated = (
                seat_pool.get('paid', 0) +
                seat_pool.get('scholarship', 0) +
                seat_pool.get('sponsored', 0)
            )
            if total_allocated > seat_cap:
                raise serializers.ValidationError({
                    'seat_pool': f'Total allocated seats ({total_allocated}) cannot exceed seat capacity ({seat_cap}).'
                })
        
        return data
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='active').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'joined_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CalendarEventSerializer(serializers.ModelSerializer):
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorAssignmentSerializer(serializers.ModelSerializer):
    mentor_email = serializers.CharField(source='mentor.email', read_only=True)
    mentor_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    mentor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True
    )
    
    class Meta:
        model = MentorAssignment
        fields = '__all__'
        read_only_fields = ['id', 'assigned_at']
    
    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.email
    
    def validate(self, data):
        """Validate mentor assignment data."""
        # Validate mentor field
        mentor = data.get('mentor')
        if not mentor:
            raise serializers.ValidationError({'mentor': 'This field is required.'})
        
        # Validate cohort field
        cohort = data.get('cohort')
        if not cohort:
            raise serializers.ValidationError({'cohort': 'This field is required.'})
        
        # Check for duplicate assignment (same mentor + cohort, active)
        if self.instance is None:  # Only check on create, not update
            existing = MentorAssignment.objects.filter(
                cohort=cohort,
                mentor=mentor,
                active=True
            ).exists()
            if existing:
                raise serializers.ValidationError({
                    'non_field_errors': ['This mentor is already assigned to this cohort.']
                })
        
        return data


class ProgramRuleSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = ProgramRule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='enrollment.user.email', read_only=True)
    cohort_name = serializers.CharField(source='enrollment.cohort.name', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ['id', 'issued_at']


class WaitlistSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Waitlist
        fields = '__all__'
        read_only_fields = ['id', 'added_at', 'position']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CohortDashboardSerializer(serializers.Serializer):
    """Serializer for cohort dashboard data."""
    cohort_id = serializers.UUIDField()
    cohort_name = serializers.CharField()
    track_name = serializers.CharField()
    enrollments_count = serializers.IntegerField()
    seat_utilization = serializers.FloatField()
    mentor_assignments_count = serializers.IntegerField()
    readiness_delta = serializers.FloatField()
    completion_percentage = serializers.FloatField()
    payments_complete = serializers.IntegerField()
    payments_pending = serializers.IntegerField()


class MentorshipCycleSerializer(serializers.ModelSerializer):
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    track_name = serializers.CharField(source='cohort.track.name', read_only=True)
    program_name = serializers.CharField(source='cohort.track.program.name', read_only=True)

    class Meta:
        model = MentorshipCycle
        fields = [
            'id', 'cohort', 'cohort_name', 'track_name', 'program_name',
            'duration_weeks', 'frequency', 'milestones', 'goals', 'program_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_cohort(self, value):
        """Ensure cohort doesn't already have a mentorship cycle (except for updates to the same cycle)."""
        if self.instance:
            # For updates, allow updating the existing cycle
            return value
        else:
            # For creates, check if cohort already has a cycle
            if MentorshipCycle.objects.filter(cohort=value).exists():
                raise serializers.ValidationError("This cohort already has a mentorship cycle.")
        return value

    def validate(self, data):
        """Additional validation."""
        milestones = data.get('milestones', [])
        goals = data.get('goals', [])

        if not isinstance(milestones, list):
            raise serializers.ValidationError({"milestones": "Must be a list of milestone descriptions."})

        if not isinstance(goals, list):
            raise serializers.ValidationError({"goals": "Must be a list of goal descriptions."})

        return data

