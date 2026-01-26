"""
Management command to delete all Career Modules/Marketplace data.

This command deletes all marketplace-related data including:
- Job Applications
- Employer Interest Logs
- Job Postings
- Marketplace Profiles
- Employers

Usage:
    python manage.py clear_marketplace_data
    python manage.py clear_marketplace_data --confirm
"""
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from marketplace.models import (
    JobApplication,
    EmployerInterestLog,
    JobPosting,
    MarketplaceProfile,
    Employer,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Delete all Career Modules/Marketplace data (applications, interest logs, jobs, profiles, employers)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required to actually delete data)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        dry_run = options['dry_run']

        if not confirm and not dry_run:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL marketplace data. Use --confirm to proceed or --dry-run to see what would be deleted.'
                )
            )
            return

        # Get counts before deletion
        job_app_count = JobApplication.objects.count()
        interest_log_count = EmployerInterestLog.objects.count()
        job_posting_count = JobPosting.objects.count()
        profile_count = MarketplaceProfile.objects.count()
        employer_count = Employer.objects.count()

        total_count = (
            job_app_count +
            interest_log_count +
            job_posting_count +
            profile_count +
            employer_count
        )

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('Marketplace Data Deletion Summary')
        self.stdout.write('=' * 60)
        self.stdout.write(f'Job Applications:        {job_app_count:,}')
        self.stdout.write(f'Employer Interest Logs:  {interest_log_count:,}')
        self.stdout.write(f'Job Postings:            {job_posting_count:,}')
        self.stdout.write(f'Marketplace Profiles:    {profile_count:,}')
        self.stdout.write(f'Employers:               {employer_count:,}')
        self.stdout.write('-' * 60)
        self.stdout.write(f'Total Records:           {total_count:,}')
        self.stdout.write('=' * 60 + '\n')

        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No data was actually deleted.')
            )
            return

        if not confirm:
            self.stdout.write(
                self.style.ERROR('Deletion cancelled. Use --confirm to proceed.')
            )
            return

        # Confirm one more time
        self.stdout.write(
            self.style.WARNING(
                '⚠️  WARNING: This will permanently delete all marketplace data!'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                'This action cannot be undone. Proceeding with deletion...\n'
            )
        )

        try:
            with transaction.atomic():
                # Delete in order to respect foreign key constraints
                # 1. Delete Job Applications (references JobPosting and User)
                self.stdout.write('Deleting Job Applications...')
                deleted_apps = JobApplication.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Deleted {deleted_apps[0]:,} job application(s)'
                    )
                )

                # 2. Delete Employer Interest Logs (references Employer and MarketplaceProfile)
                self.stdout.write('Deleting Employer Interest Logs...')
                deleted_logs = EmployerInterestLog.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Deleted {deleted_logs[0]:,} interest log(s)'
                    )
                )

                # 3. Delete Job Postings (references Employer)
                self.stdout.write('Deleting Job Postings...')
                deleted_jobs = JobPosting.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Deleted {deleted_jobs[0]:,} job posting(s)'
                    )
                )

                # 4. Delete Marketplace Profiles (references User)
                self.stdout.write('Deleting Marketplace Profiles...')
                deleted_profiles = MarketplaceProfile.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Deleted {deleted_profiles[0]:,} marketplace profile(s)'
                    )
                )

                # 5. Delete Employers (references User)
                self.stdout.write('Deleting Employers...')
                deleted_employers = Employer.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Deleted {deleted_employers[0]:,} employer(s)'
                    )
                )

            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(
                self.style.SUCCESS('✓ All marketplace data has been deleted successfully!')
            )
            self.stdout.write('=' * 60 + '\n')

            # Log the action
            logger.info(
                f'Marketplace data cleared: '
                f'{deleted_apps[0]} applications, '
                f'{deleted_logs[0]} interest logs, '
                f'{deleted_jobs[0]} job postings, '
                f'{deleted_profiles[0]} profiles, '
                f'{deleted_employers[0]} employers'
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error deleting marketplace data: {str(e)}')
            )
            logger.error(f'Error clearing marketplace data: {str(e)}', exc_info=True)
            raise
