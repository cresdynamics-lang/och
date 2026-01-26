"""
Consent checking middleware for API requests.
"""
from django.http import JsonResponse
from rest_framework import status
from users.utils.consent_utils import check_consent


class ConsentMiddleware:
    """
    Middleware to check consent scopes for protected resources.
    
    Usage: Add to MIDDLEWARE in settings.py
    """
    
    # Map of resource types to required consent scopes
    RESOURCE_CONSENT_MAP = {
        'profiling': 'share_with_mentor',  # Example
        'portfolio': 'public_portfolio',
        'sponsor_data': 'share_with_sponsor',
    }
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip for non-API requests or unauthenticated users
        if not request.path.startswith('/api/') or not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)
        
        # Extract resource type from path or view
        resource_type = self._extract_resource_type(request)
        
        if resource_type and resource_type in self.RESOURCE_CONSENT_MAP:
            required_scope = self.RESOURCE_CONSENT_MAP[resource_type]
            
            if not check_consent(request.user, required_scope):
                return JsonResponse(
                    {
                        'detail': f'Consent required: {required_scope}',
                        'required_scope': required_scope,
                        'resource': resource_type,
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return self.get_response(request)
    
    def _extract_resource_type(self, request):
        """Extract resource type from request path."""
        path_parts = request.path.strip('/').split('/')
        
        # Look for known resource types in path
        resource_types = ['profiling', 'portfolio', 'mentorship', 'analytics']
        for part in path_parts:
            if part in resource_types:
                return part
        
        return None


