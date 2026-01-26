"""
Subscription utilities - Entitlement enforcement.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import UserSubscription, SubscriptionPlan


def get_user_tier(user_id):
    """Get user's subscription tier."""
    try:
        subscription = UserSubscription.objects.get(user_id=user_id, status='active')
        return subscription.plan.name
    except UserSubscription.DoesNotExist:
        return 'free'


def has_access(user_tier: str, required_tier: str) -> bool:
    """Check if user tier has access to required tier."""
    tier_hierarchy = {
        'free': 0,
        'starter_normal': 1,
        'starter_enhanced': 2,
        'premium': 3,
    }
    
    user_level = tier_hierarchy.get(user_tier, 0)
    required_level = tier_hierarchy.get(required_tier, 0)
    
    return user_level >= required_level


def require_tier(required_tier: str):
    """Decorator to require specific subscription tier."""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user_tier = get_user_tier(request.user.id)
            if not has_access(user_tier, required_tier):
                return Response(
                    {
                        'error': f'Upgrade to {required_tier} required',
                        'current_tier': user_tier,
                        'required_tier': required_tier
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

