"""
Celery tasks for Director Dashboard background workers.
"""
try:
    from celery import shared_task
    from .services import DirectorDashboardService
    import logging
    
    logger = logging.getLogger(__name__)
    
    
    @shared_task(name='director_dashboard.refresh_cache')
    def refresh_director_dashboard_cache(director_id: int):
        """Refresh director dashboard cache (5-minute cadence)."""
        try:
            cache = DirectorDashboardService.refresh_director_cache(director_id)
            logger.info(f"Refreshed dashboard cache for director {director_id}")
            return {'status': 'success', 'director_id': director_id}
        except Exception as e:
            logger.error(f"Error refreshing director cache {director_id}: {e}")
            return {'status': 'error', 'error': str(e)}
    
    
    @shared_task(name='director_dashboard.refresh_all_caches')
    def refresh_all_director_caches():
        """Refresh all director dashboard caches."""
        from django.contrib.auth import get_user_model
        from users.models import UserRole, Role
        
        User = get_user_model()
        director_role = Role.objects.filter(name='program_director').first()
        
        if not director_role:
            return {'status': 'error', 'error': 'Director role not found'}
        
        directors = User.objects.filter(
            user_roles__role=director_role,
            user_roles__is_active=True
        ).distinct()
        
        results = []
        for director in directors:
            try:
                cache = DirectorDashboardService.refresh_director_cache(director.id)
                results.append({'director_id': director.id, 'status': 'success'})
            except Exception as e:
                results.append({'director_id': director.id, 'status': 'error', 'error': str(e)})
        
        logger.info(f"Refreshed {len([r for r in results if r['status'] == 'success'])} director caches")
        return {'status': 'completed', 'results': results}

except ImportError:
    # Celery not available
    pass

