"""
Serializers for Subscription Engine.
"""
from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'tier', 'price_monthly', 'features',
            'ai_coach_daily_limit', 'portfolio_item_limit',
            'missions_access_type', 'mentorship_access',
            'talentscope_access', 'marketplace_contact',
            'enhanced_access_days', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions."""
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True, required=False)
    days_enhanced_left = serializers.IntegerField(read_only=True)
    user = serializers.SerializerMethodField()
    stripe_subscription_id = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'plan_id', 'status', 'current_period_start',
            'current_period_end', 'enhanced_access_expires_at',
            'days_enhanced_left', 'stripe_subscription_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user(self, obj):
        """Include user details in the response."""
        return {
            'id': str(obj.user.id),
            'email': obj.user.email,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }


class SubscriptionStatusSerializer(serializers.Serializer):
    """Serializer for subscription status response."""
    tier = serializers.CharField()
    days_enhanced_left = serializers.IntegerField(required=False, allow_null=True)
    can_upgrade = serializers.BooleanField()
    features = serializers.ListField(child=serializers.CharField())
    next_payment = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.CharField()


class UpgradeSubscriptionSerializer(serializers.Serializer):
    """Serializer for upgrading subscription."""
    plan = serializers.CharField(required=True)
    stripe_session_id = serializers.CharField(required=False, allow_null=True)

