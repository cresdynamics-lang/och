"""
Shared organization schemas matching FastAPI Pydantic models.
"""
from rest_framework import serializers


class OrganizationBaseSchema(serializers.Serializer):
    """
    Base organization schema matching FastAPI OrganizationBase model.
    """
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)


class OrganizationResponseSchema(serializers.Serializer):
    """
    Organization response schema matching FastAPI OrganizationResponse model.
    """
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField(allow_null=True)
    logo_url = serializers.URLField(allow_null=True)
    website = serializers.URLField(allow_null=True)
    owner_id = serializers.IntegerField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


