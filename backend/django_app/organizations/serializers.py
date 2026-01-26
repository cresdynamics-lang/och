"""
Organization serializers for DRF.
"""
from rest_framework import serializers
from .models import Organization, OrganizationMember
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for Organization model.
    """
    owner = UserSerializer(read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    
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
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner']


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


