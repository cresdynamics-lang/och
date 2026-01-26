"""
Configuration settings for FastAPI application.
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (same as Django does)
# Priority: 1) Project root, 2) backend/django_app (for compatibility), 3) backend/fastapi_app (legacy), 4) backend (legacy)
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/fastapi_app
PROJECT_ROOT = BASE_DIR.parent.parent  # /home/caleb/kiptoo/och/ongozaCyberHub

# Try loading from project root first (primary location - matches Django)
root_env = PROJECT_ROOT / '.env'
if root_env.exists():
    load_dotenv(root_env, override=True)
    print(f"✅ Loaded .env from project root: {root_env}")
else:
    # Fallback: Check Django's .env location for compatibility
    django_env = PROJECT_ROOT / 'backend' / 'django_app' / '.env'
    if django_env.exists():
        load_dotenv(django_env, override=True)
        print(f"⚠️ Loaded .env from Django location: {django_env}")
    else:
        # Fallback to legacy locations for backward compatibility
        env_path = BASE_DIR / '.env'
        if env_path.exists():
            load_dotenv(env_path, override=True)
            print(f"⚠️ Loaded .env from legacy location: {env_path}")
        else:
            parent_env = BASE_DIR.parent / '.env'
            if parent_env.exists():
                load_dotenv(parent_env, override=True)
                print(f"⚠️ Loaded .env from legacy location: {parent_env}")


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Application
    APP_NAME: str = "Ongoza CyberHub AI API"
    DEBUG: bool = False
    
    # Database - Vector Store (PGVector)
    VECTOR_DB_HOST: str = "localhost"
    VECTOR_DB_PORT: int = 5433
    VECTOR_DB_NAME: str = "ongozacyberhub_vector"
    VECTOR_DB_USER: str = "postgres"
    VECTOR_DB_PASSWORD: str = "postgres"
    
    # Alternative: Pinecone
    USE_PINECONE: bool = False
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "ongozacyberhub"
    
    # Django API Communication
    DJANGO_API_URL: str = "http://localhost:8000"
    DJANGO_API_TIMEOUT: int = 30
    
    # Embedding Model
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # JWT (shared with Django)
    # Both Django and FastAPI use JWT_SECRET_KEY from environment
    # If not set, fallback to DJANGO_SECRET_KEY for backward compatibility
    DJANGO_SECRET_KEY: str = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', '')  # Primary JWT secret key
    JWT_ALGORITHM: str = os.getenv('JWT_ALGORITHM', 'HS256')
    
    class Config:
        # Pydantic will use this path as fallback, but we've already loaded via load_dotenv above
        # Point to root .env if it exists, otherwise use default
        env_file = str(root_env) if 'root_env' in globals() and root_env.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Allow reading from environment variables (Pydantic will override with env vars)
        extra = "ignore"


settings = Settings()

# If JWT_SECRET_KEY is not explicitly set, use DJANGO_SECRET_KEY as fallback
# This ensures backward compatibility if JWT_SECRET_KEY is not in .env
if not settings.JWT_SECRET_KEY or settings.JWT_SECRET_KEY == "":
    settings.JWT_SECRET_KEY = settings.DJANGO_SECRET_KEY
    print(f"⚠️ JWT_SECRET_KEY not set, using DJANGO_SECRET_KEY as fallback (length: {len(settings.JWT_SECRET_KEY)})")
else:
    print(f"✅ Using JWT_SECRET_KEY from environment (length: {len(settings.JWT_SECRET_KEY)})")

# Debug: Print first 20 chars of key for verification (not full key for security)
print(f"🔑 FastAPI JWT key starts with: {settings.JWT_SECRET_KEY[:20]}...")
print(f"🔑 FastAPI JWT algorithm: {settings.JWT_ALGORITHM}")


