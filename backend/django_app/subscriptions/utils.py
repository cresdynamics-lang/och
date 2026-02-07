"""
Subscription utilities - Entitlement enforcement.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import UserSubscription, SubscriptionPlan


def get_user_tier(user_or_uuid):
    """Get user's subscription tier.
    Args:
        user_or_uuid: User object or user UUID
    """
    try:
        from users.models import User

        # If it's a User object, use it directly
        if isinstance(user_or_uuid, User):
            user = user_or_uuid
        else:
            # Otherwise try to get the user by uuid_id
            user = User.objects.get(uuid_id=user_or_uuid)

        subscription = UserSubscription.objects.filter(user=user, status='active').first()
        if subscription and subscription.plan:
            return subscription.plan.name
        return 'free'
    except (UserSubscription.DoesNotExist, User.DoesNotExist, ValueError, AttributeError):
        return 'free'


def has_access(user_tier: str, required_tier: str) -> bool:
    """Check if user tier has access to required tier."""
    tier_hierarchy = {
        'free': 0,
        'starter_3': 1,
        'starter_normal': 1,
        'starter_enhanced': 2,
        'premium': 3,
        'professional_7': 4,
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

