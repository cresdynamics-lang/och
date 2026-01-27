"""
Finance Data Service - Aggregates financial data for sponsor dashboards.
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, date
import logging
from ..models import (
    Sponsor,
    SponsorCohort,
    SponsorFinancialTransaction,
    SponsorCohortBilling,
    RevenueShareTracking
)
from .invoice_service import InvoiceService

logger = logging.getLogger(__name__)


class FinanceDataService:
    """Service for managing sponsor financial data and analytics"""

    @staticmethod
    def get_finance_overview(sponsor: Sponsor) -> Dict[str, Any]:
        """
        Get comprehensive financial overview for a sponsor.
        Includes total ROI, value metrics, and cohort financial summaries.
        """
        cache_key = f'sponsor_finance_overview_{sponsor.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        # Get all cohorts for this sponsor
        cohorts = SponsorCohort.objects.filter(sponsor=sponsor, is_active=True)

        # Calculate overall financial metrics
        total_value_created = 0
        total_platform_cost = 0
        total_revenue_share = 0
        total_hires = 0

        cohort_summaries = []
        overdue_amount = 0

        for cohort in cohorts:
            # Get billing data for this cohort
            billing_records = SponsorCohortBilling.objects.filter(
                sponsor_cohort=cohort
            ).order_by('-billing_month')

            if billing_records.exists():
                latest_billing = billing_records.first()
                cohort_value = FinanceDataService._calculate_cohort_value(cohort)

                total_value_created += cohort_value['value_created']
                total_platform_cost += float(latest_billing.total_cost)
                total_revenue_share += float(latest_billing.revenue_share_kes)
                total_hires += latest_billing.hires

                # Check for overdue payments
                if latest_billing.payment_status == 'overdue':
                    overdue_amount += float(latest_billing.net_amount)

                cohort_summaries.append({
                    'cohort_id': str(cohort.id),
                    'name': cohort.name,
                    'billed_amount': float(latest_billing.net_amount),
                    'revenue_share': float(latest_billing.revenue_share_kes),
                    'payment_status': latest_billing.payment_status,
                    'hires': latest_billing.hires,
                    'billing_month': latest_billing.billing_month.isoformat(),
                    'invoices': billing_records.filter(invoice_generated=True).count()
                })

        # Calculate ROI
        total_cost = total_platform_cost
        roi = (total_value_created / total_cost) if total_cost > 0 else 0

        # Revenue forecast (simplified calculation)
        revenue_forecast_q2 = FinanceDataService._calculate_revenue_forecast(cohorts)

        result = {
            'total_roi': round(roi, 2),
            'total_value_created': total_value_created,
            'total_platform_cost': total_platform_cost,
            'cohorts': cohort_summaries,
            'revenue_forecast_q2': revenue_forecast_q2,
            'payment_overdue': overdue_amount,
            'total_revenue_share': total_revenue_share,
            'total_hires': total_hires
        }

        # Cache for 10 minutes
        cache.set(cache_key, result, 600)
        return result

    @staticmethod
    def get_cohort_billing_detail(cohort: SponsorCohort) -> Dict[str, Any]:
        """Get detailed billing information for a specific cohort"""
        cache_key = f'cohort_billing_detail_{cohort.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data

        # Get all billing records for this cohort
        billing_records = SponsorCohortBilling.objects.filter(
            sponsor_cohort=cohort
        ).order_by('-billing_month')

        billing_history = []
        for record in billing_records:
            billing_history.append({
                'billing_month': record.billing_month.isoformat(),
                'students_active': record.students_active,
                'platform_cost': float(record.platform_cost),
                'mentor_cost': float(record.mentor_cost),
                'lab_cost': float(record.lab_cost),
                'scholarship_cost': float(record.scholarship_cost),
                'total_cost': float(record.total_cost),
                'revenue_share_kes': float(record.revenue_share_kes),
                'net_amount': float(record.net_amount),
                'hires': record.hires,
                'payment_status': record.payment_status,
                'payment_date': record.payment_date.isoformat() if record.payment_date else None,
                'invoice_generated': record.invoice_generated
            })

        # Get recent transactions for this cohort
        transactions = SponsorFinancialTransaction.objects.filter(
            cohort=cohort
        ).order_by('-created_at')[:20]

        transaction_history = []
        for transaction in transactions:
            transaction_history.append({
                'id': str(transaction.id),
                'transaction_type': transaction.transaction_type,
                'description': transaction.description,
                'amount': float(transaction.amount),
                'currency': transaction.currency,
                'status': transaction.status,
                'period_start': transaction.period_start.isoformat() if transaction.period_start else None,
                'period_end': transaction.period_end.isoformat() if transaction.period_end else None,
                'created_at': transaction.created_at.isoformat()
            })

        # Get revenue share details for this cohort
        revenue_shares = RevenueShareTracking.objects.filter(
            cohort=cohort
        ).order_by('-created_at')

        revenue_share_details = []
        for share in revenue_shares:
            revenue_share_details.append({
                'id': str(share.id),
                'student_name': share.student.get_full_name(),
                'employer_name': share.employer_name,
                'role_title': share.role_title,
                'first_year_salary_kes': float(share.first_year_salary_kes),
                'revenue_share_3pct': float(share.revenue_share_3pct),
                'payment_status': share.payment_status,
                'paid_date': share.paid_date.isoformat() if share.paid_date else None,
                'created_at': share.created_at.isoformat()
            })

        result = {
            'cohort': {
                'id': str(cohort.id),
                'name': cohort.name,
                'track_slug': cohort.track_slug,
                'target_size': cohort.target_size,
                'budget_allocated': float(cohort.budget_allocated),
                'placement_goal': cohort.placement_goal
            },
            'billing_history': billing_history,
            'transaction_history': transaction_history,
            'revenue_share_details': revenue_share_details,
            'summary': {
                'total_billed': sum(float(r['net_amount']) for r in billing_history),
                'total_paid': sum(float(r['net_amount']) for r in billing_history if r['payment_status'] == 'paid'),
                'total_revenue_share': sum(float(s['revenue_share_3pct']) for s in revenue_share_details),
                'total_hires': len(revenue_share_details)
            }
        }

        # Cache for 15 minutes
        cache.set(cache_key, result, 900)
        return result

    @staticmethod
    def generate_invoice(sponsor: Sponsor, cohort_id: Optional[str] = None,
                        billing_month: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate invoice for sponsor or specific cohort.
        Creates billing records and returns invoice data.
        """
        if cohort_id:
            # Generate invoice for specific cohort
            try:
                cohort = SponsorCohort.objects.get(id=cohort_id, sponsor=sponsor)
                return FinanceDataService._generate_cohort_invoice(cohort, billing_month)
            except SponsorCohort.DoesNotExist:
                raise ValueError("Cohort not found")
        else:
            # Generate consolidated invoice for all cohorts
            cohorts = SponsorCohort.objects.filter(sponsor=sponsor, is_active=True)
            return FinanceDataService._generate_consolidated_invoice(sponsor, cohorts, billing_month)

    @staticmethod
    def mark_payment(sponsor: Sponsor, billing_record_id: str,
                    payment_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Mark a billing record as paid"""
        try:
            billing_record = SponsorCohortBilling.objects.get(
                id=billing_record_id,
                sponsor_cohort__sponsor=sponsor
            )

            billing_record.payment_status = 'paid'
            billing_record.payment_date = payment_date or timezone.now()
            billing_record.save()

            # Create financial transaction record
            SponsorFinancialTransaction.objects.create(
                sponsor=sponsor,
                cohort=billing_record.sponsor_cohort,
                transaction_type='payment',
                description=f'Payment for {billing_record.billing_month.strftime("%B %Y")} billing',
                amount=billing_record.net_amount,
                period_start=billing_record.billing_month.replace(day=1),
                period_end=billing_record.billing_month.replace(day=28),  # Approximate
                status='paid'
            )

            # Clear cache
            cache_key = f'sponsor_finance_overview_{sponsor.id}'
            cache.delete(cache_key)

            return {
                'billing_record_id': str(billing_record.id),
                'status': 'paid',
                'payment_date': billing_record.payment_date.isoformat(),
                'amount_paid': float(billing_record.net_amount)
            }

        except SponsorCohortBilling.DoesNotExist:
            raise ValueError("Billing record not found")

    @staticmethod
    def create_revenue_share_record(cohort: SponsorCohort, student_id: str,
                                   employer_name: str, role_title: str,
                                   first_year_salary: Decimal) -> RevenueShareTracking:
        """Create a revenue share tracking record when a student gets hired"""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            raise ValueError("Student not found")

        revenue_share = RevenueShareTracking.objects.create(
            sponsor=cohort.sponsor,
            cohort=cohort,
            student=student,
            employer_name=employer_name,
            role_title=role_title,
            first_year_salary_kes=first_year_salary
        )

        # Create financial transaction record
        SponsorFinancialTransaction.objects.create(
            sponsor=cohort.sponsor,
            cohort=cohort,
            transaction_type='revenue_share',
            description=f'3% revenue share: {student.get_full_name()} → {employer_name}',
            amount=revenue_share.revenue_share_3pct,
            status='pending'
        )

        return revenue_share

    @staticmethod
    def _calculate_cohort_value(cohort: SponsorCohort) -> Dict[str, float]:
        """Calculate the total value created by a cohort"""
        # Get all revenue share records for this cohort
        revenue_shares = RevenueShareTracking.objects.filter(cohort=cohort)
        total_salary_value = sum(float(rs.first_year_salary_kes) for rs in revenue_shares)

        # Estimate value created (simplified - could be more sophisticated)
        # Assuming 3x multiplier for career advancement value
        value_created = total_salary_value * 3

        return {
            'total_salaries': total_salary_value,
            'value_created': value_created,
            'revenue_shares': len(revenue_shares)
        }

    @staticmethod
    def _calculate_revenue_forecast(cohorts: List[SponsorCohort]) -> float:
        """Calculate Q2 revenue forecast based on current trends"""
        # Simplified forecasting logic
        total_current_revenue = 0
        for cohort in cohorts:
            billing = SponsorCohortBilling.objects.filter(
                sponsor_cohort=cohort
            ).order_by('-billing_month').first()

            if billing:
                total_current_revenue += float(billing.revenue_share_kes)

        # Project 25% growth for Q2
        return total_current_revenue * 1.25

    @staticmethod
    def _generate_cohort_invoice(cohort: SponsorCohort, billing_month: Optional[date] = None) -> Dict[str, Any]:
        """Generate invoice for a specific cohort"""
        if not billing_month:
            billing_month = date.today().replace(day=1)

        # Check if billing record already exists
        existing_billing = SponsorCohortBilling.objects.filter(
            sponsor_cohort=cohort,
            billing_month=billing_month
        ).first()

        if existing_billing:
            return {
                'billing_record_id': str(existing_billing.id),
                'status': 'exists',
                'message': 'Invoice already exists for this billing period'
            }

        # Calculate billing amounts (simplified - would integrate with actual usage data)
        students_active = cohort.students_enrolled  # Simplified
        platform_cost = students_active * 20000  # KES 20K per student
        mentor_cost = 0  # Would calculate from mentor session data
        lab_cost = 0  # Would calculate from lab usage data
        scholarship_cost = 0  # Would calculate from scholarship allocations

        # Get revenue share for this billing period
        revenue_shares = RevenueShareTracking.objects.filter(
            cohort=cohort,
            created_at__year=billing_month.year,
            created_at__month=billing_month.month
        )
        revenue_share_kes = sum(float(rs.revenue_share_3pct) for rs in revenue_shares)
        hires = len(revenue_shares)

        # Create billing record
        billing_record = SponsorCohortBilling.objects.create(
            sponsor_cohort=cohort,
            billing_month=billing_month,
            students_active=students_active,
            platform_cost=platform_cost,
            mentor_cost=mentor_cost,
            lab_cost=lab_cost,
            scholarship_cost=scholarship_cost,
            revenue_share_kes=revenue_share_kes,
            hires=hires
        )

        # Calculate totals
        billing_record.calculate_totals()
        billing_record.save()

        # Generate PDF invoice
        try:
            invoice_url = InvoiceService.generate_invoice_pdf(cohort.sponsor, billing_record)
        except Exception as e:
            logger.warning(f"Failed to generate PDF invoice for {cohort.name}: {str(e)}")
            invoice_url = None

        # Create financial transaction record
        SponsorFinancialTransaction.objects.create(
            sponsor=cohort.sponsor,
            cohort=cohort,
            transaction_type='platform_fee',
            description=f'Monthly platform fee for {billing_month.strftime("%B %Y")}',
            amount=billing_record.total_cost,
            period_start=billing_month,
            period_end=billing_month.replace(day=28),  # Approximate
            status='invoiced',
            invoice_url=invoice_url
        )

        # Create revenue share transaction if applicable
        if revenue_share_kes > 0:
            SponsorFinancialTransaction.objects.create(
                sponsor=cohort.sponsor,
                cohort=cohort,
                transaction_type='revenue_share',
                description=f'Revenue share credits for {billing_month.strftime("%B %Y")}',
                amount=-revenue_share_kes,  # Negative for credit
                period_start=billing_month,
                period_end=billing_month.replace(day=28),
                status='pending'
            )

        return {
            'billing_record_id': str(billing_record.id),
            'status': 'created',
            'invoice_amount': float(billing_record.net_amount),
            'billing_month': billing_month.isoformat(),
            'message': f'Invoice generated for {billing_month.strftime("%B %Y")}'
        }

    @staticmethod
    def _generate_consolidated_invoice(sponsor: Sponsor, cohorts: List[SponsorCohort],
                                     billing_month: Optional[date] = None) -> Dict[str, Any]:
        """Generate consolidated invoice for all sponsor cohorts"""
        if not billing_month:
            billing_month = date.today().replace(day=1)

        total_amount = 0
        cohort_invoices = []

        for cohort in cohorts:
            try:
                invoice_result = FinanceDataService._generate_cohort_invoice(cohort, billing_month)
                if invoice_result['status'] == 'created':
                    total_amount += invoice_result['invoice_amount']
                    cohort_invoices.append({
                        'cohort_name': cohort.name,
                        'amount': invoice_result['invoice_amount']
                    })
            except Exception as e:
                # Log error but continue with other cohorts
                print(f"Error generating invoice for cohort {cohort.name}: {e}")

        return {
            'status': 'created',
            'total_amount': total_amount,
            'billing_month': billing_month.isoformat(),
            'cohort_invoices': cohort_invoices,
            'message': f'Consolidated invoice generated for {len(cohort_invoices)} cohorts'
        }
