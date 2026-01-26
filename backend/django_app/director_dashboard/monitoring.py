"""
Performance monitoring for Director Dashboard.
"""
import time
import logging
from functools import wraps
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)


def track_performance(func):
    """Decorator to track API response times."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            
            # Log performance metrics
            logger.info(
                f"API {func.__name__}: {response_time:.2f}ms",
                extra={
                    'function': func.__name__,
                    'response_time_ms': response_time,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            # Track cache hit rate (if applicable)
            cache_key = f"dashboard_cache_hit_{func.__name__}"
            cache_hits = cache.get(cache_key, 0)
            cache.set(cache_key, cache_hits + 1, timeout=3600)
            
            return result
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(
                f"API {func.__name__} error: {str(e)} ({response_time:.2f}ms)",
                extra={
                    'function': func.__name__,
                    'error': str(e),
                    'response_time_ms': response_time,
                }
            )
            raise
    
    return wrapper


def get_cache_stats():
    """Get cache hit rate statistics."""
    stats = {
        'cache_hits': cache.get('dashboard_cache_hit_get_dashboard_data', 0),
        'total_requests': cache.get('dashboard_total_requests', 0),
    }
    
    if stats['total_requests'] > 0:
        stats['hit_rate'] = (stats['cache_hits'] / stats['total_requests']) * 100
    else:
        stats['hit_rate'] = 0
    
    return stats

