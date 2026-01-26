"""
Progress serializers for DRF.
"""
from rest_framework import serializers
from .models import Progress
from users.serializers import UserSerializer


class ProgressSerializer(serializers.ModelSerializer):
    """
    Serializer for Progress model.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Progress
        fields = [
            'id',
            'user',
            'content_id',
            'content_type',
            'status',
            'completion_percentage',
            'score',
            'started_at',
            'completed_at',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


