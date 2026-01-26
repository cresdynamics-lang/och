"""
Celery tasks for Director Dashboard cache refresh.
Runs every 5 minutes per director for scale.
"""
import logging
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from programs.director_dashboard_services import DirectorDashboardAggregationService
from programs.models import Cohort

User = get_user_model()
logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='director_dashboard.refresh_cache')
def refresh_director_dashboard_cache_task(director_id):
    """
    Refresh director dashboard cache.
    Runs every 5 minutes per director.
    """
    try:
        director = User.objects.get(id=director_id)
        
        with transaction.atomic():
            cache = DirectorDashboardAggregationService.refresh_director_cache(director)
            
            # Also refresh all cohort dashboards for this director
            cohorts = DirectorDashboardAggregationService.get_director_cohorts(director)
            for cohort in cohorts:
                try:
                    DirectorDashboardAggregationService.refresh_cohort_dashboard(
                        director, cohort
                    )
                except Exception as e:
                    logger.error(
                        f"Error refreshing cohort {cohort.id} dashboard: {e}",
                        exc_info=True
                    )
        
        logger.info(f"Successfully refreshed dashboard cache for director {director_id}")
        return {'status': 'success', 'director_id': director_id}
        
    except User.DoesNotExist:
        logger.error(f"Director {director_id} not found")
        return {'status': 'error', 'message': 'Director not found'}
    except Exception as e:
        logger.error(f"Error refreshing director cache: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}


@shared_task(name='director_dashboard.refresh_all_directors')
def refresh_all_directors_cache_task():
    """
    Refresh cache for all directors.
    Called by periodic task every 5 minutes.
    """
    # Get all users who are directors (have tracks they direct)
    directors = User.objects.filter(
        directed_tracks__isnull=False
    ).distinct()
    
    results = []
    for director in directors:
        try:
            result = refresh_director_dashboard_cache_task.delay(director.id)
            results.append({'director_id': director.id, 'task_id': result.id})
        except Exception as e:
            logger.error(f"Error queuing refresh for director {director.id}: {e}")
            results.append({'director_id': director.id, 'error': str(e)})
    
    logger.info(f"Queued refresh tasks for {len(results)} directors")
    return {'status': 'queued', 'count': len(results), 'results': results}


@shared_task(name='director_dashboard.refresh_cohort')
def refresh_cohort_dashboard_task(director_id, cohort_id):
    """
    Refresh a specific cohort dashboard.
    Called on-demand or when cohort data changes.
    """
    try:
        director = User.objects.get(id=director_id)
        cohort = Cohort.objects.get(id=cohort_id)
        
        with transaction.atomic():
            dashboard = DirectorDashboardAggregationService.refresh_cohort_dashboard(
                director, cohort
            )
        
        logger.info(f"Successfully refreshed cohort {cohort_id} dashboard")
        return {'status': 'success', 'cohort_id': str(cohort_id)}
        
    except (User.DoesNotExist, Cohort.DoesNotExist) as e:
        logger.error(f"Director or cohort not found: {e}")
        return {'status': 'error', 'message': 'Director or cohort not found'}
    except Exception as e:
        logger.error(f"Error refreshing cohort dashboard: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

