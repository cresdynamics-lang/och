"""
Missions Engine services for difficulty mapping, mission assignment, and
secure artifact upload handling.
"""
import logging
from typing import Optional

from django.core.files.storage import default_storage
from django.utils.crypto import get_random_string

logger = logging.getLogger(__name__)

# 10MB max file size (mirrors global upload settings and mentorship modules)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

# Disallowed file extensions / content types for security
DISALLOWED_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".ps1",
    ".msi",
    ".js",
}

DISALLOWED_CONTENT_TYPES = {
    "application/x-msdownload",
    "application/x-msdos-program",
    "application/x-dosexec",
    "application/x-executable",
}


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


def validate_file_type(file) -> None:
    """
    Validate that the uploaded file type is allowed.

    Raises:
        ValueError: if the file type is not permitted.
    """
    name = (getattr(file, "name", "") or "").lower()
    content_type = (getattr(file, "content_type", "") or "").lower()

    # Block known dangerous extensions
    for ext in DISALLOWED_EXTENSIONS:
        if name.endswith(ext):
            raise ValueError(f"File type not allowed: {ext}")

    # Block known dangerous content types
    if content_type in DISALLOWED_CONTENT_TYPES:
        raise ValueError(f"File content type not allowed: {content_type}")


def upload_file_to_storage(file, submission_id: str, content_type: str = None) -> str:
    """
    Upload a mission artifact to the configured storage backend.

    This function enforces:
      - 10MB max file size
      - basic file-type restrictions (no executables, scripts, etc.)

    Args:
        file: Django UploadedFile (or file-like) object.
        submission_id: ID of the MissionSubmission, used to namespace uploads.
        content_type: Optional MIME type override.

    Returns:
        Public or storage-relative URL to the uploaded file.

    Raises:
        ValueError: if size or type validation fails.
    """
    # Size validation
    file_size = getattr(file, "size", None)
    if file_size is not None and file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds 10MB limit")

    # Type validation
    validate_file_type(file)

    # Build a safe storage path: missions/<submission_id>/<random>-<original_name>
    original_name = getattr(file, "name", "upload.bin")
    random_suffix = get_random_string(8)
    path = f"missions/{submission_id}/{random_suffix}-{original_name}"

    # Use Django's default storage (can be local, S3, etc.)
    saved_path = default_storage.save(path, file)
    try:
        url = default_storage.url(saved_path)
    except Exception:
        # Some storage backends may not support .url; fall back to path
        url = saved_path

    logger.info(f"Uploaded mission artifact for submission {submission_id} to {saved_path}")
    return url


def generate_presigned_upload_url(identifier: str, filename: str, content_type: str = None) -> dict:
    """
    Generate a presigned URL for direct file upload.

    This is a placeholder that can be wired to S3 or another
    object store in production. For now it returns a simple
    structure suitable for frontend integration without
    breaking the API.
    
    Args:
        identifier: Unique identifier for the upload
        filename: Name of the file to upload
        content_type: Optional MIME type
        
    Returns:
        Dictionary with url and fields for presigned upload
    """
    logger.warning(
        "generate_presigned_upload_url is using a placeholder implementation; "
        "wire this to your object store for production use."
    )
    return {
        "url": "https://storage.example.com/upload",
        "fields": {
            "key": filename,
            "Content-Type": content_type or "application/octet-stream",
        },
    }
