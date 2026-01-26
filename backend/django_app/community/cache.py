"""
Community Feed Caching Layer

Implements aggressive caching for feed queries to achieve <500ms response times.
Uses Django's cache framework with Redis as the backend for production.
"""

from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json
import logging
from typing import Any, Callable, Optional, List

logger = logging.getLogger(__name__)

# Cache key prefixes
FEED_CACHE_PREFIX = 'community:feed:'
POST_CACHE_PREFIX = 'community:post:'
LEADERBOARD_CACHE_PREFIX = 'community:leaderboard:'
USER_STATS_CACHE_PREFIX = 'community:user_stats:'
UNIVERSITY_CACHE_PREFIX = 'community:university:'

# Default TTLs (in seconds)
FEED_CACHE_TTL = 60  # 1 minute for feeds (balance freshness vs performance)
POST_CACHE_TTL = 300  # 5 minutes for individual posts
LEADERBOARD_CACHE_TTL = 3600  # 1 hour for leaderboards
USER_STATS_CACHE_TTL = 600  # 10 minutes for user stats
UNIVERSITY_CACHE_TTL = 3600  # 1 hour for university data


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a unique cache key based on prefix and arguments."""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()[:16]
    return f"{prefix}{key_hash}"


def cached_feed(ttl: int = FEED_CACHE_TTL):
    """
    Decorator for caching feed queries.
    
    Usage:
        @cached_feed()
        def get_university_feed(university_id, page, ...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip cache if explicitly requested
            skip_cache = kwargs.pop('skip_cache', False)
            
            if skip_cache:
                return func(*args, **kwargs)
            
            cache_key = generate_cache_key(FEED_CACHE_PREFIX, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for feed: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for feed: {cache_key}, cached for {ttl}s")
            
            return result
        return wrapper
    return decorator


def cached_post(ttl: int = POST_CACHE_TTL):
    """Decorator for caching individual post lookups."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            skip_cache = kwargs.pop('skip_cache', False)
            
            if skip_cache:
                return func(*args, **kwargs)
            
            cache_key = generate_cache_key(POST_CACHE_PREFIX, func.__name__, *args, **kwargs)
            
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def cached_leaderboard(ttl: int = LEADERBOARD_CACHE_TTL):
    """Decorator for caching leaderboard queries."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(LEADERBOARD_CACHE_PREFIX, func.__name__, *args, **kwargs)
            
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


class FeedCacheManager:
    """
    Manager class for community feed caching operations.
    Provides methods for cache invalidation and warming.
    """
    
    @staticmethod
    def invalidate_university_feed(university_id: str) -> None:
        """Invalidate all cached feeds for a university."""
        pattern = f"{FEED_CACHE_PREFIX}*university*{university_id}*"
        _invalidate_by_pattern(pattern)
        logger.info(f"Invalidated university feed cache: {university_id}")
    
    @staticmethod
    def invalidate_global_feed() -> None:
        """Invalidate the global feed cache."""
        pattern = f"{FEED_CACHE_PREFIX}*global*"
        _invalidate_by_pattern(pattern)
        logger.info("Invalidated global feed cache")
    
    @staticmethod
    def invalidate_user_feed(user_id: str) -> None:
        """Invalidate feeds related to a specific user."""
        pattern = f"{FEED_CACHE_PREFIX}*user*{user_id}*"
        _invalidate_by_pattern(pattern)
        logger.info(f"Invalidated user feed cache: {user_id}")
    
    @staticmethod
    def invalidate_post(post_id: str) -> None:
        """Invalidate cache for a specific post."""
        cache_key = f"{POST_CACHE_PREFIX}{post_id}"
        cache.delete(cache_key)
        logger.debug(f"Invalidated post cache: {post_id}")
    
    @staticmethod
    def invalidate_leaderboard(scope: str, university_id: Optional[str] = None) -> None:
        """Invalidate leaderboard cache."""
        if university_id:
            pattern = f"{LEADERBOARD_CACHE_PREFIX}*{scope}*{university_id}*"
        else:
            pattern = f"{LEADERBOARD_CACHE_PREFIX}*{scope}*"
        _invalidate_by_pattern(pattern)
        logger.info(f"Invalidated leaderboard cache: {scope}")
    
    @staticmethod
    def warm_university_feed(university_id: str, feed_func: Callable) -> None:
        """
        Pre-warm the cache for a university's feed.
        Called after invalidation or during low-traffic periods.
        """
        try:
            # Warm first page
            result = feed_func(university_id=university_id, page=1, skip_cache=True)
            cache_key = generate_cache_key(
                FEED_CACHE_PREFIX, 
                feed_func.__name__, 
                university_id=university_id, 
                page=1
            )
            cache.set(cache_key, result, FEED_CACHE_TTL)
            logger.info(f"Warmed university feed cache: {university_id}")
        except Exception as e:
            logger.error(f"Failed to warm university feed cache: {e}")
    
    @staticmethod
    def get_cache_stats() -> dict:
        """Get cache statistics (if supported by backend)."""
        try:
            if hasattr(cache, 'get_stats'):
                return cache.get_stats()
            return {'status': 'stats_not_available'}
        except Exception:
            return {'status': 'error'}


class QueryOptimizer:
    """
    Optimizes database queries for feed retrieval.
    Uses select_related, prefetch_related, and query optimization techniques.
    """
    
    @staticmethod
    def optimize_post_queryset(queryset):
        """
        Optimize a Post queryset for feed display.
        Reduces N+1 queries by prefetching related data.
        """
        return queryset.select_related(
            'author',
            'university',
        ).prefetch_related(
            'reactions',
            'comments__author',
        ).only(
            # Post fields
            'id', 'post_type', 'title', 'content', 'media_urls', 'tags',
            'status', 'is_pinned', 'view_count', 'reaction_count', 'comment_count',
            'event_details', 'achievement_data', 'poll_options',
            'created_at', 'updated_at',
            # Author fields
            'author__id', 'author__username', 'author__first_name', 'author__last_name',
            'author__email',
            # University fields
            'university__id', 'university__name', 'university__code', 'university__logo_url',
        )
    
    @staticmethod
    def optimize_comment_queryset(queryset):
        """Optimize a Comment queryset."""
        return queryset.select_related(
            'author',
            'post',
        ).prefetch_related(
            'reactions',
        ).only(
            'id', 'content', 'reaction_count', 'created_at',
            'author__id', 'author__username', 'author__first_name', 'author__last_name',
            'post__id',
        )
    
    @staticmethod
    def batch_fetch_user_profiles(user_ids: List[str]) -> dict:
        """
        Batch fetch user profile data for multiple users.
        Returns a dict mapping user_id to profile data.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.filter(id__in=user_ids).only(
            'id', 'username', 'first_name', 'last_name', 'email'
        )
        
        return {str(u.id): {
            'id': str(u.id),
            'username': u.username,
            'name': f"{u.first_name} {u.last_name}".strip() or u.username,
            'email': u.email,
        } for u in users}


def _invalidate_by_pattern(pattern: str) -> None:
    """
    Invalidate cache keys matching a pattern.
    Implementation depends on cache backend.
    """
    try:
        # For Redis backend
        if hasattr(cache, '_client'):
            keys = cache._client.keys(pattern)
            if keys:
                cache._client.delete(*keys)
        else:
            # For other backends, we can't do pattern matching
            # Just log that full invalidation is needed
            logger.warning(f"Pattern-based cache invalidation not supported: {pattern}")
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")


# Post-save signal handlers for cache invalidation
def invalidate_on_post_save(sender, instance, **kwargs):
    """Signal handler to invalidate cache when a post is saved."""
    FeedCacheManager.invalidate_post(str(instance.id))
    if instance.university_id:
        FeedCacheManager.invalidate_university_feed(str(instance.university_id))
    FeedCacheManager.invalidate_global_feed()


def invalidate_on_comment_save(sender, instance, **kwargs):
    """Signal handler to invalidate cache when a comment is saved."""
    if instance.post_id:
        FeedCacheManager.invalidate_post(str(instance.post_id))


def invalidate_on_reaction_save(sender, instance, **kwargs):
    """Signal handler to invalidate cache when a reaction is saved."""
    if hasattr(instance, 'post_id') and instance.post_id:
        FeedCacheManager.invalidate_post(str(instance.post_id))

