"""
Missions Engine services for difficulty mapping and mission assignment.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def map_profiler_difficulty_to_mission_difficulty(profiler_difficulty: str) -> int:
    """
    Map profiler difficulty_selection to mission difficulty (1-5).
    
    Mission difficulty scale:
    1 = Beginner
    2 = Intermediate
    3 = Advanced
    4 = Expert
    5 = Master
    
    Profiler difficulty options:
    - novice: No experience
    - beginner: Some awareness
    - intermediate: Some training
    - advanced: Professional experience
    - elite: Expert level
    
    Args:
        profiler_difficulty: Profiler difficulty_selection value
        
    Returns:
        Mission difficulty level (1-5), defaults to 1 (Beginner)
    """
    if not profiler_difficulty:
        return 1  # Default to beginner
    
    mapping = {
        'novice': 1,      # Beginner missions
        'beginner': 1,    # Beginner missions
        'intermediate': 2,  # Intermediate missions
        'advanced': 3,    # Advanced missions
        'elite': 4,       # Expert missions (can access up to Expert level)
    }
    
    difficulty = mapping.get(profiler_difficulty.lower(), 1)
    logger.debug(f"Mapped profiler difficulty '{profiler_difficulty}' to mission difficulty {difficulty}")
    return difficulty


def get_user_profiler_difficulty(user) -> Optional[str]:
    """
    Get user's profiler difficulty selection.
    
    Args:
        user: User instance
        
    Returns:
        Profiler difficulty_selection string or None if not available
    """
    try:
        from profiler.models import ProfilerSession
        
        profiler_session = ProfilerSession.objects.filter(
            user=user,
            status__in=['finished', 'locked']
        ).order_by('-completed_at').first()
        
        if profiler_session and profiler_session.difficulty_selection:
            return profiler_session.difficulty_selection
        
        return None
    except Exception as e:
        logger.warning(f"Failed to get profiler difficulty for user {user.id}: {e}", exc_info=True)
        return None


def get_max_mission_difficulty_for_user(user) -> int:
    """
    Get maximum mission difficulty level user can access based on profiler.
    
    Args:
        user: User instance
        
    Returns:
        Maximum mission difficulty (1-5)
    """
    profiler_difficulty = get_user_profiler_difficulty(user)
    if profiler_difficulty:
        return map_profiler_difficulty_to_mission_difficulty(profiler_difficulty)
    
    # Default to beginner if no profiler data
    return 1


def upload_file_to_storage(file, file_name: str, content_type: str = None) -> str:
    """
    Upload file to storage (S3 or local storage).
    
    Args:
        file: File object to upload
        file_name: Name for the file
        content_type: MIME type of the file
        
    Returns:
        URL to the uploaded file
    """
    # TODO: Implement actual file upload to S3 or storage backend
    # For now, return a placeholder URL
    logger.warning("upload_file_to_storage not fully implemented, returning placeholder URL")
    return f"https://storage.example.com/uploads/{file_name}"


def generate_presigned_upload_url(file_name: str, content_type: str = None) -> dict:
    """
    Generate a presigned URL for direct file upload.
    
    Args:
        file_name: Name for the file
        content_type: MIME type of the file
        
    Returns:
        Dictionary with upload URL and fields
    """
    # TODO: Implement actual presigned URL generation for S3
    # For now, return a placeholder
    logger.warning("generate_presigned_upload_url not fully implemented, returning placeholder")
    return {
        "url": "https://storage.example.com/upload",
        "fields": {
            "key": file_name,
            "Content-Type": content_type or "application/octet-stream"
        }
    }
