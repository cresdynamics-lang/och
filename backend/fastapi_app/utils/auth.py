"""
Authentication utilities for FastAPI.
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from config import settings

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token (shared secret with Django).
    
    Django's rest_framework_simplejwt uses SECRET_KEY (DJANGO_SECRET_KEY env var) 
    for signing. FastAPI must use the same key to verify tokens.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )
    
    try:
        # Use the secret key (should match Django's SECRET_KEY)
        secret_key = settings.JWT_SECRET_KEY
        if not secret_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret key not configured",
            )
        
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        # rest_framework_simplejwt uses 'user_id' as the claim name
        user_id = payload.get("user_id")
        if user_id is None:
            # Try alternative claim names
            user_id = payload.get("sub") or payload.get("user")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials: missing user_id",
            )
        
        # Ensure user_id is an integer
        try:
            return int(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials: invalid user_id format",
            )
            
    except JWTError as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"JWT verification failed: {str(e)}, "
            f"token preview: {token[:20]}..., "
            f"secret_key length: {len(settings.JWT_SECRET_KEY) if settings.JWT_SECRET_KEY else 0}, "
            f"secret_key starts with: {settings.JWT_SECRET_KEY[:10] if settings.JWT_SECRET_KEY else 'None'}..."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


