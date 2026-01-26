"""
Management command to refresh director dashboard caches.
Can be run via cron every 5 minutes or manually.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from programs.director_dashboard_tasks import refresh_director_dashboard_cache_task, refresh_all_directors_cache_task

User = get_user_model()


class Command(BaseCommand):
    help = 'Refresh director dashboard caches'

    def add_arguments(self, parser):
        parser.add_argument(
            '--director-id',
            type=int,
            help='Refresh cache for specific director ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Refresh all directors (queues Celery tasks)',
        )
        parser.add_argument(
            '--sync',
            action='store_true',
            help='Run synchronously instead of queuing Celery tasks',
        )

    def handle(self, *args, **options):
        director_id = options.get('director_id')
        refresh_all = options.get('all', False)
        sync = options.get('sync', False)

        if director_id:
            # Refresh specific director
            try:
                director = User.objects.get(id=director_id)
                self.stdout.write(f'Refreshing dashboard cache for director {director.email}...')
                
                if sync:
                    from programs.director_dashboard_services import DirectorDashboardAggregationService
                    cache = DirectorDashboardAggregationService.refresh_director_cache(director)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully refreshed cache: {cache.active_programs_count} programs, '
                            f'{cache.active_cohorts_count} cohorts'
                        )
                    )
                else:
                    result = refresh_director_dashboard_cache_task.delay(director_id)
                    self.stdout.write(
                        self.style.SUCCESS(f'Queued refresh task: {result.id}')
                    )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Director {director_id} not found')
                )
        
        elif refresh_all:
            # Refresh all directors
            self.stdout.write('Refreshing dashboard caches for all directors...')
            
            if sync:
                from programs.director_dashboard_services import DirectorDashboardAggregationService
                directors = User.objects.filter(directed_tracks__isnull=False).distinct()
                count = 0
                for director in directors:
                    try:
                        DirectorDashboardAggregationService.refresh_director_cache(director)
                        count += 1
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error refreshing {director.email}: {e}')
                        )
                self.stdout.write(
                    self.style.SUCCESS(f'Refreshed {count} director caches')
                )
            else:
                result = refresh_all_directors_cache_task.delay()
                self.stdout.write(
                    self.style.SUCCESS(f'Queued refresh tasks for all directors')
                )
        
        else:
            self.stdout.write(
                self.style.ERROR('Please specify --director-id or --all')
            )










