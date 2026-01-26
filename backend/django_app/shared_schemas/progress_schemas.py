"""
Shared progress schemas matching FastAPI Pydantic models.
"""
from rest_framework import serializers


class ProgressBaseSchema(serializers.Serializer):
    """
    Base progress schema matching FastAPI ProgressBase model.
    """
    content_id = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)
    status = serializers.ChoiceField(choices=[
        'not_started',
        'in_progress',
        'completed',
        'paused',
    ])
    completion_percentage = serializers.IntegerField(min_value=0, max_value=100, default=0)
    score = serializers.FloatField(required=False, allow_null=True)
    metadata = serializers.DictField(required=False, default=dict)


class ProgressResponseSchema(serializers.Serializer):
    """
    Progress response schema matching FastAPI ProgressResponse model.
    """
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    content_id = serializers.CharField()
    content_type = serializers.CharField()
    status = serializers.CharField()
    completion_percentage = serializers.IntegerField()
    score = serializers.FloatField(allow_null=True)
    started_at = serializers.DateTimeField(allow_null=True)
    completed_at = serializers.DateTimeField(allow_null=True)
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


