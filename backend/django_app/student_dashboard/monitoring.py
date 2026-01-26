"""
Monitoring and metrics for student dashboard.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.core.cache import cache
from .models import StudentDashboardCache, DashboardUpdateQueue

logger = logging.getLogger(__name__)


def get_dashboard_metrics():
    """
    Get dashboard performance metrics.
    Returns metrics for monitoring:
    - cache_hit_rate: Percentage of requests served from cache
    - p95_latency: 95th percentile response time (ms)
    - queue_depth: Number of pending updates
    - refresh_worker_lag: Time since last refresh (minutes)
    - readiness_score_staleness: Average staleness of readiness scores (minutes)
    """
    metrics = {}
    
    # Cache hit rate (mock - should track in Redis/Memcached)
    cache_hit_rate = cache.get('dashboard_cache_hit_rate', 95.0)
    metrics['cache_hit_rate'] = cache_hit_rate
    
    # Queue depth
    queue_depth = DashboardUpdateQueue.objects.filter(
        processed_at__isnull=True
    ).count()
    metrics['queue_depth'] = queue_depth
    
    # Refresh worker lag (time since oldest unprocessed item)
    oldest_unprocessed = DashboardUpdateQueue.objects.filter(
        processed_at__isnull=True
    ).order_by('queued_at').first()
    
    if oldest_unprocessed:
        lag_minutes = (timezone.now() - oldest_unprocessed.queued_at).total_seconds() / 60
        metrics['refresh_worker_lag_minutes'] = lag_minutes
    else:
        metrics['refresh_worker_lag_minutes'] = 0
    
    # Readiness score staleness (average time since last update)
    stale_threshold = timezone.now() - timedelta(minutes=15)
    stale_count = StudentDashboardCache.objects.filter(
        updated_at__lt=stale_threshold
    ).count()
    total_count = StudentDashboardCache.objects.count()
    
    if total_count > 0:
        staleness_pct = (stale_count / total_count) * 100
        metrics['readiness_score_staleness_pct'] = staleness_pct
    else:
        metrics['readiness_score_staleness_pct'] = 0
    
    # Average readiness score
    avg_readiness = StudentDashboardCache.objects.aggregate(
        avg=Avg('readiness_score')
    )['avg'] or 0
    metrics['avg_readiness_score'] = float(avg_readiness)
    
    # Dashboard usage stats
    active_dashboards = StudentDashboardCache.objects.filter(
        last_active_at__gte=timezone.now() - timedelta(days=1)
    ).count()
    metrics['active_dashboards_24h'] = active_dashboards
    
    return metrics


def record_cache_hit(is_hit: bool):
    """Record a cache hit or miss for metrics."""
    cache_key = 'dashboard_cache_stats'
    stats = cache.get(cache_key, {'hits': 0, 'misses': 0})
    
    if is_hit:
        stats['hits'] += 1
    else:
        stats['misses'] += 1
    
    # Update cache (expires in 1 hour)
    cache.set(cache_key, stats, 3600)
    
    # Calculate hit rate
    total = stats['hits'] + stats['misses']
    if total > 0:
        hit_rate = (stats['hits'] / total) * 100
        cache.set('dashboard_cache_hit_rate', hit_rate, 3600)


def get_dashboard_health():
    """
    Get overall dashboard health status.
    Returns health indicators for alerting.
    """
    metrics = get_dashboard_metrics()
    
    health = {
        'status': 'healthy',
        'issues': [],
        'metrics': metrics,
    }
    
    # Check queue depth
    if metrics['queue_depth'] > 1000:
        health['status'] = 'degraded'
        health['issues'].append(f"High queue depth: {metrics['queue_depth']}")
    
    # Check worker lag
    if metrics['refresh_worker_lag_minutes'] > 5:
        health['status'] = 'degraded'
        health['issues'].append(f"Worker lag: {metrics['refresh_worker_lag_minutes']:.1f} minutes")
    
    # Check cache hit rate
    if metrics['cache_hit_rate'] < 95:
        health['status'] = 'degraded'
        health['issues'].append(f"Low cache hit rate: {metrics['cache_hit_rate']:.1f}%")
    
    # Check staleness
    if metrics['readiness_score_staleness_pct'] > 10:
        health['status'] = 'degraded'
        health['issues'].append(f"High staleness: {metrics['readiness_score_staleness_pct']:.1f}%")
    
    return health

