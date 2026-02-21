from rest_framework import serializers
from .models import ProblemCode, SupportTicket
from django.contrib.auth import get_user_model

User = get_user_model()


class ProblemCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemCode
        fields = [
            'id', 'code', 'name', 'description', 'category',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupportTicketListSerializer(serializers.ModelSerializer):
    problem_code_display = serializers.SerializerMethodField()
    assigned_to_email = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'subject', 'status', 'priority', 'problem_code', 'problem_code_display',
            'reporter_email', 'reporter_name', 'assigned_to', 'assigned_to_email',
            'created_at', 'updated_at', 'resolved_at',
        ]

    def get_problem_code_display(self, obj):
        if obj.problem_code:
            return f"{obj.problem_code.code} – {obj.problem_code.name}"
        return None

    def get_assigned_to_email(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.email
        return None


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    problem_code_detail = ProblemCodeSerializer(source='problem_code', read_only=True)
    assigned_to_email = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'subject', 'description', 'status', 'priority',
            'problem_code', 'problem_code_detail', 'internal_notes',
            'reporter_id', 'reporter_email', 'reporter_name',
            'assigned_to', 'assigned_to_email', 'resolution_notes',
            'resolved_at', 'created_at', 'updated_at', 'created_by',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_assigned_to_email(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.email
        return None


class SupportTicketCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = [
            'subject', 'description', 'status', 'priority', 'problem_code',
            'internal_notes', 'reporter_id', 'reporter_email', 'reporter_name',
            'assigned_to', 'resolution_notes',
        ]

    def validate_problem_code(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("Problem code is inactive.")
        return value
