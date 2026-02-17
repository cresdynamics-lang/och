"""
Organization serializers for DRF.
"""
from rest_framework import serializers
from .models import Organization, OrganizationMember
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for Organization model.
    Auto-generates slug from name if not provided.
    """
    owner = UserSerializer(read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    
    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'logo_url',
            'website',
            'owner',
            'member_count',
            'org_type',
            'status',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner']
    
    def validate(self, attrs):
        """Auto-generate slug from name if not provided."""
        from django.utils.text import slugify
        
        # If slug is not provided or empty, generate it from name
        if not attrs.get('slug'):
            name = attrs.get('name', '')
            if name:
                base_slug = slugify(name)[:50]  # Limit to 50 chars
                slug = base_slug
                
                # Ensure uniqueness by appending number if needed
                model = self.Meta.model
                counter = 1
                while model.objects.filter(slug=slug).exists():
                    # If updating, exclude current instance
                    if self.instance:
                        if model.objects.filter(slug=slug).exclude(pk=self.instance.pk).exists():
                            slug = f"{base_slug}-{counter}"[:50]
                            counter += 1
                        else:
                            break
                    else:
                        slug = f"{base_slug}-{counter}"[:50]
                        counter += 1
                
                attrs['slug'] = slug
        
        return attrs


class OrganizationMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for OrganizationMember model.
    """
    user = UserSerializer(read_only=True)
    organization = OrganizationSerializer(read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = [
            'id',
            'organization',
            'user',
            'role',
            'joined_at',
        ]
        read_only_fields = ['id', 'joined_at']


