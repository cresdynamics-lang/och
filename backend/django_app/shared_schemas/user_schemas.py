"""
Shared user schemas matching FastAPI Pydantic models.
"""
from rest_framework import serializers


class UserBaseSchema(serializers.Serializer):
    """
    Base user schema matching FastAPI UserBase model.
    """
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)


class UserResponseSchema(serializers.Serializer):
    """
    User response schema matching FastAPI UserResponse model.
    """
    id = serializers.IntegerField()
    email = serializers.EmailField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    bio = serializers.CharField(allow_null=True)
    avatar_url = serializers.URLField(allow_null=True)
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


