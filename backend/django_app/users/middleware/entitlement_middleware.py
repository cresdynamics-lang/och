"""
Entitlement checking middleware for feature access control.
"""
from django.http import JsonResponse
from rest_framework import status
from users.models import Entitlement


class EntitlementMiddleware:
    """
    Middleware to check entitlements for feature access.
    
    Usage: Add to MIDDLEWARE in settings.py
    """
    
    # Map of features to path patterns
    FEATURE_PATH_MAP = {
        'cohort_seat': ['/api/v1/cohorts/'],
        'module_access:profiling': ['/api/v1/profiling/'],
        'module_access:portfolio': ['/api/v1/portfolio/'],
    }
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip for non-API requests or unauthenticated users
        if not request.path.startswith('/api/') or not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)
        
        # Check entitlements
        for feature, path_patterns in self.FEATURE_PATH_MAP.items():
            if any(request.path.startswith(pattern) for pattern in path_patterns):
                if not self._check_entitlement(request.user, feature):
                    return JsonResponse(
                        {
                            'detail': f'Feature not available: {feature}',
                            'feature': feature,
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        return self.get_response(request)
    
    def _check_entitlement(self, user, feature):
        """Check if user has entitlement for feature."""
        return Entitlement.objects.filter(
            user=user,
            feature=feature,
            granted=True,
            expires_at__isnull=True
        ).exists()


