"""
Management command to refresh student dashboard caches.
Run this periodically (every 5 minutes) via cron or Celery.
"""
from django.core.management.base import BaseCommand
from student_dashboard.tasks import process_dashboard_update_queue, refresh_all_stale_dashboards


class Command(BaseCommand):
    """Command to refresh dashboard caches."""
    help = 'Refresh student dashboard caches from update queue and stale entries'

    def add_arguments(self, parser):
        parser.add_argument(
            '--queue-only',
            action='store_true',
            help='Only process update queue, skip stale refresh',
        )
        parser.add_argument(
            '--stale-only',
            action='store_true',
            help='Only refresh stale dashboards, skip queue',
        )

    def handle(self, *args, **options):
        """Execute the command."""
        if not options['stale_only']:
            self.stdout.write('Processing dashboard update queue...')
            process_dashboard_update_queue()
            self.stdout.write(self.style.SUCCESS('Update queue processed'))
        
        if not options['queue_only']:
            self.stdout.write('Refreshing stale dashboards...')
            refresh_all_stale_dashboards()
            self.stdout.write(self.style.SUCCESS('Stale dashboards refreshed'))
        
        self.stdout.write(self.style.SUCCESS('Dashboard refresh complete'))


