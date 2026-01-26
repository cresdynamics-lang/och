"""
User Settings API Views
Handles user preferences and settings like portfolio visibility
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json
import logging

logger = logging.getLogger(__name__)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    GET /api/v1/settings
    PATCH /api/v1/settings
    
    Get or update user settings (portfolio visibility, etc.)
    """
    user = request.user
    
    if request.method == 'GET':
        # Get user settings from user.metadata JSONField
        settings = {}
        
        # Get from user.metadata (now that we've added the field)
        if user.metadata and isinstance(user.metadata, dict):
            settings = user.metadata.get('settings', {})
        
        # Return defaults if not set
        default_settings = {
            'portfolioVisibility': 'private',  # Default to private
        }
        
        # Merge with defaults
        result = {**default_settings, **settings}
        
        return Response(result, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Update user settings
        updates = request.data
        
        # Get current settings from metadata
        current_settings = {}
        if user.metadata and isinstance(user.metadata, dict) and 'settings' in user.metadata:
            current_settings = user.metadata['settings']
        
        # Merge updates
        updated_settings = {**current_settings, **updates}
        
        # Validate portfolioVisibility
        if 'portfolioVisibility' in updates:
            valid_values = ['private', 'public', 'unlisted']
            if updates['portfolioVisibility'] not in valid_values:
                return Response(
                    {'detail': f'portfolioVisibility must be one of: {", ".join(valid_values)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Save to user.metadata
        try:
            # Ensure metadata is a dict
            if not user.metadata or not isinstance(user.metadata, dict):
                user.metadata = {}
            
            user.metadata['settings'] = updated_settings
            user.save(update_fields=['metadata'])
            logger.info(f"Updated user settings for user {user.id}")
        except Exception as e:
            logger.error(f"Error saving user settings: {e}", exc_info=True)
            return Response(
                {'detail': f'Failed to save settings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(updated_settings, status=status.HTTP_200_OK)

