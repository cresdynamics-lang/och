"""
Management command to manually refresh director dashboard cache.
"""
from django.core.management.base import BaseCommand
from director_dashboard.services import DirectorDashboardService
from django.contrib.auth import get_user_model
from users.models import UserRole, Role


class Command(BaseCommand):
    help = 'Refresh director dashboard cache for all directors or a specific director'

    def add_arguments(self, parser):
        parser.add_argument(
            '--director-id',
            type=int,
            help='Refresh cache for specific director ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Refresh cache for all directors',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        
        if options['director_id']:
            # Refresh specific director
            try:
                director = User.objects.get(id=options['director_id'])
                cache = DirectorDashboardService.refresh_director_cache(director.id)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully refreshed cache for {director.email}: '
                        f'{cache.active_cohorts_count} cohorts, {cache.seats_used} seats'
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Director with ID {options["director_id"]} not found')
                )
        
        elif options['all']:
            # Refresh all directors
            director_role = Role.objects.filter(name='program_director').first()
            if not director_role:
                self.stdout.write(self.style.ERROR('Director role not found'))
                return
            
            directors = User.objects.filter(
                user_roles__role=director_role,
                user_roles__is_active=True
            ).distinct()
            
            success_count = 0
            error_count = 0
            
            for director in directors:
                try:
                    cache = DirectorDashboardService.refresh_director_cache(director.id)
                    success_count += 1
                    self.stdout.write(
                        f'✓ {director.email}: {cache.active_cohorts_count} cohorts'
                    )
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ {director.email}: {str(e)}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nCompleted: {success_count} successful, {error_count} errors'
                )
            )
        
        else:
            self.stdout.write(
                self.style.ERROR('Please specify --director-id or --all')
            )

