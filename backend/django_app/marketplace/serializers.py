from rest_framework import serializers

from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting, JobApplication


class EmployerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employer
        fields = [
            'id',
            'company_name',
            'website',
            'sector',
            'country',
            'logo_url',
            'description',
        ]


class MarketplaceProfileListSerializer(serializers.ModelSerializer):
    mentee_id = serializers.SerializerMethodField()
    mentee_name = serializers.SerializerMethodField()
    mentee_country = serializers.SerializerMethodField()
    portfolio_depth = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceProfile
        fields = [
            'id',
            'mentee_id',
            'mentee_name',
            'mentee_country',
            'tier',
            'readiness_score',
            'job_fit_score',
            'hiring_timeline_days',
            'profile_status',
            'primary_role',
            'primary_track_key',
            'skills',
            'portfolio_depth',
        ]

    def get_mentee_id(self, obj):
        return str(obj.mentee.id)

    def get_mentee_name(self, obj):
        try:
            return obj.mentee.get_full_name() or obj.mentee.email
        except Exception:
            return obj.mentee.email

    def get_mentee_country(self, obj):
        # Optional country field on user profile
        return getattr(obj.mentee, 'country', None)

    def get_portfolio_depth(self, obj):
        """
        Calculate portfolio_depth dynamically based on actual portfolio items count.
        Returns: 'basic', 'moderate', 'deep', or empty string if no items.
        """
        try:
            from dashboard.models import PortfolioItem
            # Count portfolio items for this user
            item_count = PortfolioItem.objects.filter(user=obj.mentee).count()
            
            # Determine depth based on count
            if item_count == 0:
                return ''
            elif item_count <= 2:
                return 'basic'
            elif item_count <= 5:
                return 'moderate'
            else:
                return 'deep'
        except Exception as e:
            # Fallback to stored value if calculation fails
            return obj.portfolio_depth or ''


class MarketplaceProfileDetailSerializer(MarketplaceProfileListSerializer):
    class Meta(MarketplaceProfileListSerializer.Meta):
        fields = MarketplaceProfileListSerializer.Meta.fields + [
            'is_visible',
            'employer_share_consent',
            'last_updated_at',
        ]
        read_only_fields = [
            'id',
            'mentee_id',
            'mentee_name',
            'mentee_country',
            'portfolio_depth',
            'last_updated_at',
        ]


class JobPostingSerializer(serializers.ModelSerializer):
    employer = EmployerSerializer(read_only=True)
    employer_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = JobPosting
        fields = [
            'id',
            'employer',
            'employer_id',
            'title',
            'location',
            'job_type',
            'description',
            'required_skills',
            'salary_min',
            'salary_max',
            'salary_currency',
            'is_active',
            'posted_at',
            'application_deadline',
        ]
        read_only_fields = ['id', 'employer', 'posted_at']

    def create(self, validated_data):
        employer_id = validated_data.pop('employer_id', None)
        request = self.context.get('request')

        if employer_id:
            try:
                employer = Employer.objects.get(id=employer_id)
            except Employer.DoesNotExist:
                raise serializers.ValidationError({'employer_id': 'Employer not found'})
        else:
            # Default to employer profile for current user
            # Use the same helper function as views
            from .utils import get_employer_for_user
            employer = get_employer_for_user(request.user)
            if not employer:
                raise serializers.ValidationError(
                    {'detail': 'Employer profile not found. Please create an employer profile first.'}
                )

        return JobPosting.objects.create(employer=employer, **validated_data)


class EmployerInterestLogSerializer(serializers.ModelSerializer):
    employer = EmployerSerializer(read_only=True)
    profile = MarketplaceProfileListSerializer(read_only=True)
    message = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    class Meta:
        model = EmployerInterestLog
        fields = [
            'id',
            'employer',
            'profile',
            'action',
            'metadata',
            'message',
            'subject',
            'created_at',
        ]

    def get_message(self, obj):
        """Extract message from metadata if it exists."""
        return obj.metadata.get('message', '') if obj.metadata else ''

    def get_subject(self, obj):
        """Extract subject from metadata if it exists."""
        return obj.metadata.get('subject', 'Contact Request') if obj.metadata else 'Contact Request'


class JobPostingListSerializer(serializers.ModelSerializer):
    """Serializer for listing jobs to students with match score."""
    employer = EmployerSerializer(read_only=True)
    match_score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        help_text='Calculated match score (0-100)',
    )
    has_applied = serializers.BooleanField(
        read_only=True,
        help_text='Whether current user has applied to this job',
    )

    class Meta:
        model = JobPosting
        fields = [
            'id',
            'employer',
            'title',
            'location',
            'job_type',
            'description',
            'required_skills',
            'salary_min',
            'salary_max',
            'salary_currency',
            'posted_at',
            'application_deadline',
            'match_score',
            'has_applied',
        ]


class JobApplicationSerializer(serializers.ModelSerializer):
    """Serializer for job applications."""
    job_posting = JobPostingSerializer(read_only=True)
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'job_posting',
            'applicant',
            'applicant_name',
            'applicant_email',
            'status',
            'cover_letter',
            'match_score',
            'notes',
            'applied_at',
            'updated_at',
            'status_changed_at',
        ]
        read_only_fields = ['id', 'applicant', 'applied_at', 'updated_at', 'status_changed_at', 'match_score']

    def get_applicant_name(self, obj):
        try:
            return obj.applicant.get_full_name() or obj.applicant.email
        except Exception:
            return obj.applicant.email

    def get_applicant_email(self, obj):
        return obj.applicant.email


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating job applications."""
    class Meta:
        model = JobApplication
        fields = [
            'job_posting',
            'cover_letter',
        ]

