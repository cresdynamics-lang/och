"""
Signals for sponsor financial automation.
Handles automatic revenue share tracking when students get hired.
"""
import logging
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist

from sponsors.models import SponsorCohort, RevenueShareTracking, SponsorFinancialTransaction
from sponsors.services.finance_service import FinanceDataService

logger = logging.getLogger(__name__)


# TODO: Implement hire event signal once employer_events app is available
# @receiver(post_save, sender='employer_events.EmployerEvent')
# def handle_hire_event(sender, instance, created, **kwargs):
#     """
#     Automatically create revenue share tracking when a student gets hired.
#     """
#     if not created:
#         return

#     # Only process hire events
#     if instance.status != 'hired':
#         return

#     try:
#         # Find the sponsor cohort for this student
#         cohort = SponsorCohort.objects.filter(
#             sponsor_student_cohorts__user=instance.candidate
#         ).first()

#         if not cohort:
#             logger.warning(f'No sponsor cohort found for hired student {instance.candidate.username}')
#             return

#         # Check if revenue share already exists for this hire
#         existing_revenue_share = RevenueShareTracking.objects.filter(
#             sponsor=cohort.sponsor,
#             student=instance.candidate,
#             employer_name=instance.employer_name
#         ).exists()

#         if existing_revenue_share:
#             logger.info(f'Revenue share already exists for {instance.candidate.username} at {instance.employer_name}')
#             return

#         # Create revenue share tracking record
#         from .services.finance_service import FinanceDataService
#         revenue_share = FinanceDataService.create_revenue_share_record(
#             cohort=cohort,
#             student_id=str(instance.candidate.id),
#             employer_name=instance.employer_name,
#             role_title=getattr(instance, 'role_title', 'Unknown Role'),
#             first_year_salary=Decimal(str(instance.salary_annual or 0))
#         )

#         logger.info(
#             f'Created revenue share tracking: {instance.candidate.username} '
#             f'→ {instance.employer_name} (KES {revenue_share.revenue_share_3pct:,.0f})'
#         )

#     except Exception as e:
#         logger.exception(f'Error processing hire event for {instance.candidate.username}: {str(e)}')
#         # Don't raise exception - we don't want to break the hiring workflow
