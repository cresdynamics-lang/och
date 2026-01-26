"""
Redis session management for profiling autosave functionality.
Autosaves responses every 10 seconds to allow students to resume sessions.
"""
import json
import hashlib
import secrets
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
import redis
from typing import Optional, Dict, Any


class ProfilerSessionManager:
    """Manages profiling sessions in Redis for autosave functionality."""
    
    def __init__(self):
        """Initialize Redis connection."""
        try:
            redis_url = getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0')
            # Parse Redis URL
            if redis_url.startswith('redis://'):
                redis_url = redis_url.replace('redis://', '')
                if '@' in redis_url:
                    # Has password
                    auth, host_port = redis_url.split('@')
                    password = auth.split(':')[-1] if ':' in auth else None
                    host, port_db = host_port.split(':')
                    port, db = port_db.split('/')
                    self.redis_client = redis.Redis(
                        host=host,
                        port=int(port),
                        db=int(db),
                        password=password,
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5,
                    )
                else:
                    host, port_db = redis_url.split(':')
                    port, db = port_db.split('/')
                    self.redis_client = redis.Redis(
                        host=host,
                        port=int(port),
                        db=int(db),
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5,
                    )
            else:
                # Fallback to default
                self.redis_client = redis.Redis(
                    host=getattr(settings, 'REDIS_HOST', 'localhost'),
                    port=int(getattr(settings, 'REDIS_PORT', 6379)),
                    db=1,  # Use db 1 for profiling sessions (0 is for Celery)
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
            
            # Test connection
            self.redis_client.ping()
        except Exception as e:
            print(f"Warning: Redis connection failed: {e}. Autosave functionality will be limited.")
            self.redis_client = None
    
    def generate_session_token(self) -> str:
        """Generate a unique session token."""
        return secrets.token_urlsafe(32)
    
    def get_session_key(self, session_token: str) -> str:
        """Get Redis key for session."""
        return f"profiler:session:{session_token}"
    
    def save_session(self, session_token: str, data: Dict[str, Any], ttl: int = 3600) -> bool:
        """
        Save session data to Redis.
        TTL defaults to 1 hour (3600 seconds).
        """
        if not self.redis_client:
            return False
        try:
            key = self.get_session_key(session_token)
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(data)
            )
            return True
        except Exception as e:
            print(f"Error saving session to Redis: {e}")
            return False
    
    def get_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data from Redis."""
        if not self.redis_client:
            return None
        try:
            key = self.get_session_key(session_token)
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Error retrieving session from Redis: {e}")
            return None
    
    def update_session(self, session_token: str, updates: Dict[str, Any], ttl: int = 3600) -> bool:
        """Update session data in Redis."""
        try:
            existing = self.get_session(session_token) or {}
            existing.update(updates)
            return self.save_session(session_token, existing, ttl)
        except Exception as e:
            print(f"Error updating session in Redis: {e}")
            return False
    
    def delete_session(self, session_token: str) -> bool:
        """Delete session from Redis."""
        if not self.redis_client:
            return False
        try:
            key = self.get_session_key(session_token)
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting session from Redis: {e}")
            return False
    
    def autosave_response(self, session_token: str, question_id: str, answer: Any) -> bool:
        """
        Autosave a single response (called every 10 seconds).
        """
        try:
            session_data = self.get_session(session_token) or {}
            responses = session_data.get('responses', {})
            responses[question_id] = {
                'answer': answer,
                'saved_at': timezone.now().isoformat()
            }
            session_data['responses'] = responses
            session_data['last_autosave'] = timezone.now().isoformat()
            return self.save_session(session_token, session_data, ttl=3600)
        except Exception as e:
            print(f"Error autosaving response: {e}")
            return False
    
    def get_all_responses(self, session_token: str) -> Dict[str, Any]:
        """Get all autosaved responses."""
        session_data = self.get_session(session_token) or {}
        return session_data.get('responses', {})


# Singleton instance
session_manager = ProfilerSessionManager()

