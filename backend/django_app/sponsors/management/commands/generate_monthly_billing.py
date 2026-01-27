"""
Django management command to generate monthly billing for sponsor cohorts.
Runs on the 1st of each month to create billing records and invoices.
"""
import logging
from datetime import datetime, date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from sponsors.models import (
    Sponsor,
    SponsorCohort,
    SponsorCohortBilling,
    SponsorFinancialTransaction
)
from sponsors.services.finance_service import FinanceDataService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate monthly billing records for all active sponsor cohorts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--billing-month',
            type=str,
            help='Billing month in YYYY-MM format (default: previous month)',
        )
        parser.add_argument(
            '--sponsor-slug',
            type=str,
            help='Generate billing for specific sponsor only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be generated without actually creating records',
        )

    def handle(self, *args, **options):
        billing_month_str = options.get('billing_month')
        sponsor_slug = options.get('sponsor_slug')
        dry_run = options.get('dry_run', False)

        # Determine billing month
        if billing_month_str:
            try:
                billing_month = datetime.strptime(billing_month_str, '%Y-%m').date()
            except ValueError:
                raise CommandError(f'Invalid billing month format: {billing_month_str}. Use YYYY-MM format.')
        else:
            # Default to previous month
            today = date.today()
            if today.month == 1:
                billing_month = date(today.year - 1, 12, 1)
            else:
                billing_month = date(today.year, today.month - 1, 1)

        self.stdout.write(
            self.style.SUCCESS(f'Generating billing for {billing_month.strftime("%B %Y")}...')
        )

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No records will be created'))

        try:
            with transaction.atomic():
                # Get active sponsors
                sponsors = Sponsor.objects.filter(is_active=True)
                if sponsor_slug:
                    sponsors = sponsors.filter(slug=sponsor_slug)

                total_cohorts = 0
                total_invoices = 0
                total_amount = 0

                for sponsor in sponsors:
                    sponsor_cohorts = SponsorCohort.objects.filter(
                        sponsor=sponsor,
                        is_active=True
                    )

                    self.stdout.write(f'Processing {len(sponsor_cohorts)} cohorts for {sponsor.name}...')

                    for cohort in sponsor_cohorts:
                        try:
                            # Check if billing already exists
                            existing_billing = SponsorCohortBilling.objects.filter(
                                sponsor_cohort=cohort,
                                billing_month=billing_month
                            ).first()

                            if existing_billing:
                                self.stdout.write(
                                    self.style.WARNING(f'  Billing already exists for {cohort.name} ({billing_month.strftime("%B %Y")})')
                                )
                                continue

                            # Generate invoice for this cohort
                            invoice_result = FinanceDataService.generate_invoice(
                                sponsor, str(cohort.id), billing_month
                            )

                            if invoice_result.get('status') == 'created':
                                total_cohorts += 1
                                total_invoices += 1
                                total_amount += invoice_result.get('invoice_amount', 0)

                                if not dry_run:
                                    self.stdout.write(
                                        self.style.SUCCESS(
                                            f'  ✓ Generated invoice for {cohort.name}: KES {invoice_result["invoice_amount"]:,.0f}'
                                        )
                                    )
                                else:
                                    self.stdout.write(
                                        f'  [DRY RUN] Would generate invoice for {cohort.name}: KES {invoice_result["invoice_amount"]:,.0f}'
                                    )
                            else:
                                self.stdout.write(
                                    self.style.WARNING(f'  Skipped {cohort.name}: {invoice_result.get("message", "Unknown reason")}')
                                )

                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f'  Error processing {cohort.name}: {str(e)}')
                            )
                            logger.exception(f'Error generating invoice for cohort {cohort.id}')

                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'DRY RUN COMPLETE: Would generate {total_invoices} invoices for {total_cohorts} cohorts totaling KES {total_amount:,.0f}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'BILLING COMPLETE: Generated {total_invoices} invoices for {total_cohorts} cohorts totaling KES {total_amount:,.0f}')
                    )

                    # Log summary
                    logger.info(f'Monthly billing generated: {total_invoices} invoices, {total_cohorts} cohorts, KES {total_amount:,.0f} total')

        except Exception as e:
            logger.exception('Error in monthly billing generation')
            raise CommandError(f'Billing generation failed: {str(e)}')
