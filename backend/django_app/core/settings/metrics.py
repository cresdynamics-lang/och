"""
Prometheus metrics configuration for Django.
"""
from prometheus_client import Counter, Histogram, Gauge
from django.http import HttpResponse
from django.conf import settings

# Metrics
http_requests_total = Counter(
    'django_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'django_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

active_users = Gauge(
    'django_active_users',
    'Number of active users'
)

database_queries_total = Counter(
    'django_database_queries_total',
    'Total database queries',
    ['operation', 'model']
)


def metrics_view(request):
    """Prometheus metrics endpoint."""
    if not getattr(settings, 'ENABLE_METRICS', False):
        return HttpResponse('Metrics disabled', status=403)
    
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    
    return HttpResponse(
        generate_latest(),
        content_type=CONTENT_TYPE_LATEST
    )






