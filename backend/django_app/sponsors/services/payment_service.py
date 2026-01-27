"""
Payment Service - Handles payment processing, overdue alerts, and payment workflows.
"""
import logging
from datetime import datetime, date, timedelta
from decimal import Decimal
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from ..models import (
    Sponsor,
    SponsorCohortBilling,
    SponsorFinancialTransaction,
    RevenueShareTracking
)

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for managing sponsor payment workflows"""

    @staticmethod
    def process_payment(sponsor: Sponsor, billing_record: SponsorCohortBilling,
                       payment_amount: Decimal, payment_date: datetime = None,
                       payment_method: str = 'bank_transfer') -> dict:
        """
        Process a payment for a billing record.
        """
        if payment_date is None:
            payment_date = timezone.now()

        # Validate payment amount
        if payment_amount <= 0:
            raise ValueError("Payment amount must be positive")

        if payment_amount > billing_record.net_amount:
            raise ValueError(f"Payment amount exceeds outstanding balance of {billing_record.net_amount}")

        # Update billing record
        billing_record.payment_status = 'paid'
        billing_record.payment_date = payment_date
        billing_record.save()

        # Create payment transaction
        SponsorFinancialTransaction.objects.create(
            sponsor=sponsor,
            cohort=billing_record.sponsor_cohort,
            transaction_type='payment',
            description=f'Payment received via {payment_method} for {billing_record.billing_month.strftime("%B %Y")} billing',
            amount=payment_amount,
            currency='KES',
            status='paid'
        )

        # If partial payment, create new billing record for remaining balance
        remaining_balance = billing_record.net_amount - payment_amount
        if remaining_balance > 0:
            # Create new billing record for remaining amount
            SponsorCohortBilling.objects.create(
                sponsor_cohort=billing_record.sponsor_cohort,
                billing_month=billing_record.billing_month,
                students_active=billing_record.students_active,
                platform_cost=0,  # Already billed
                mentor_cost=0,
                lab_cost=0,
                scholarship_cost=0,
                revenue_share_kes=0,
                payment_status='invoiced',
                invoice_generated=False
            )

        # Send payment confirmation email
        PaymentService._send_payment_confirmation_email(sponsor, billing_record, payment_amount)

        return {
            'billing_record_id': str(billing_record.id),
            'payment_amount': float(payment_amount),
            'remaining_balance': float(remaining_balance),
            'payment_date': payment_date.isoformat(),
            'status': 'paid'
        }

    @staticmethod
    def mark_overdue_payments():
        """
        Mark payments as overdue based on due dates.
        Run this as a periodic task (e.g., daily).
        """
        # Find invoiced payments that are past due date (30 days from invoice generation)
        thirty_days_ago = timezone.now() - timedelta(days=30)

        overdue_records = SponsorCohortBilling.objects.filter(
            payment_status__in=['invoiced', 'pending'],
            created_at__lt=thirty_days_ago
        )

        updated_count = 0
        for record in overdue_records:
            record.payment_status = 'overdue'
            record.save()
            updated_count += 1

            # Send overdue notice email
            PaymentService._send_overdue_notice_email(record.sponsor_cohort.sponsor, record)

        logger.info(f"Marked {updated_count} billing records as overdue")
        return updated_count

    @staticmethod
    def send_payment_reminders():
        """
        Send payment reminder emails for upcoming due dates.
        Run this as a periodic task (e.g., weekly).
        """
        # Find payments due in 7 days
        seven_days_from_now = timezone.now() + timedelta(days=7)

        upcoming_due = SponsorCohortBilling.objects.filter(
            payment_status__in=['invoiced', 'pending'],
            created_at__date__lte=(seven_days_from_now - timedelta(days=30)).date(),
            created_at__date__gte=(timezone.now() - timedelta(days=20)).date()
        )

        reminder_count = 0
        for record in upcoming_due:
            PaymentService._send_payment_reminder_email(record.sponsor_cohort.sponsor, record)
            reminder_count += 1

        logger.info(f"Sent payment reminders for {reminder_count} billing records")
        return reminder_count

    @staticmethod
    def process_revenue_share_payment(revenue_share: RevenueShareTracking,
                                    payment_date: datetime = None) -> dict:
        """
        Mark a revenue share payment as paid.
        """
        if payment_date is None:
            payment_date = timezone.now()

        revenue_share.payment_status = 'paid'
        revenue_share.paid_date = payment_date
        revenue_share.save()

        # Create financial transaction record
        SponsorFinancialTransaction.objects.create(
            sponsor=revenue_share.sponsor,
            cohort=revenue_share.cohort,
            transaction_type='revenue_share_payment',
            description=f'Revenue share payment for {revenue_share.student.get_full_name()} → {revenue_share.employer_name}',
            amount=-revenue_share.revenue_share_3pct,  # Negative for outgoing payment
            currency='KES',
            status='paid'
        )

        return {
            'revenue_share_id': str(revenue_share.id),
            'amount_paid': float(revenue_share.revenue_share_3pct),
            'payment_date': payment_date.isoformat(),
            'status': 'paid'
        }

    @staticmethod
    def get_payment_summary(sponsor: Sponsor) -> dict:
        """
        Get comprehensive payment summary for a sponsor.
        """
        billing_records = SponsorCohortBilling.objects.filter(
            sponsor_cohort__sponsor=sponsor
        )

        total_billed = sum(record.net_amount for record in billing_records)
        total_paid = sum(record.net_amount for record in billing_records if record.payment_status == 'paid')
        total_overdue = sum(record.net_amount for record in billing_records if record.payment_status == 'overdue')

        # Revenue share summary
        revenue_shares = RevenueShareTracking.objects.filter(sponsor=sponsor)
        total_revenue_share_earned = sum(rs.revenue_share_3pct for rs in revenue_shares)
        total_revenue_share_paid = sum(rs.revenue_share_3pct for rs in revenue_shares if rs.payment_status == 'paid')

        return {
            'total_billed': float(total_billed),
            'total_paid': float(total_paid),
            'total_outstanding': float(total_billed - total_paid),
            'total_overdue': float(total_overdue),
            'payment_completion_rate': (total_paid / total_billed * 100) if total_billed > 0 else 0,
            'revenue_share': {
                'total_earned': float(total_revenue_share_earned),
                'total_paid': float(total_revenue_share_paid),
                'outstanding': float(total_revenue_share_earned - total_revenue_share_paid)
            },
            'billing_records_count': billing_records.count(),
            'overdue_count': billing_records.filter(payment_status='overdue').count()
        }

    @staticmethod
    def configure_payment_terms(sponsor: Sponsor, terms_data: dict) -> dict:
        """
        Configure payment terms for a sponsor.
        """
        # In a real implementation, this would update sponsor payment preferences
        # For now, just return success
        return {
            'payment_terms_days': terms_data.get('payment_terms_days', 30),
            'auto_reminders': terms_data.get('auto_reminders', True),
            'preferred_currency': terms_data.get('preferred_currency', 'KES'),
            'payment_methods': terms_data.get('payment_methods', ['bank_transfer', 'mpesa']),
            'status': 'updated'
        }

    @staticmethod
    def _send_payment_confirmation_email(sponsor: Sponsor, billing_record: SponsorCohortBilling, amount: Decimal):
        """Send payment confirmation email"""
        try:
            subject = f'Payment Confirmation - {billing_record.sponsor_cohort.name}'

            message = f"""
            Dear {sponsor.name},

            We have received your payment of KES {amount:,.0f} for {billing_record.sponsor_cohort.name} billing period {billing_record.billing_month.strftime('%B %Y')}.

            Payment Details:
            - Amount: KES {amount:,.0f}
            - Billing Period: {billing_record.billing_month.strftime('%B %Y')}
            - Cohort: {billing_record.sponsor_cohort.name}
            - Transaction Date: {timezone.now().strftime('%Y-%m-%d')}

            Thank you for your continued partnership with Ongóza Cyber Hub!

            Best regards,
            Finance Team
            Ongóza Cyber Hub
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[sponsor.contact_email],
                fail_silently=True
            )

        except Exception as e:
            logger.error(f"Failed to send payment confirmation email: {str(e)}")

    @staticmethod
    def _send_overdue_notice_email(sponsor: Sponsor, billing_record: SponsorCohortBilling):
        """Send overdue payment notice email"""
        try:
            subject = f'Overdue Payment Notice - {billing_record.sponsor_cohort.name}'

            message = f"""
            Dear {sponsor.name},

            This is a reminder that payment for {billing_record.sponsor_cohort.name} billing period {billing_record.billing_month.strftime('%B %Y')} is now overdue.

            Outstanding Amount: KES {billing_record.net_amount:,.0f}
            Due Date: {(billing_record.created_at + timedelta(days=30)).strftime('%Y-%m-%d')}

            Please arrange payment at your earliest convenience to avoid any service interruptions.

            Payment can be made via:
            - Bank Transfer to: Ongóza Cyber Hub account
            - M-Pesa to: +254 XXX XXX XXX

            If you have already made this payment, please disregard this notice.

            Best regards,
            Finance Team
            Ongóza Cyber Hub
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[sponsor.contact_email],
                fail_silently=True
            )

        except Exception as e:
            logger.error(f"Failed to send overdue notice email: {str(e)}")

    @staticmethod
    def _send_payment_reminder_email(sponsor: Sponsor, billing_record: SponsorCohortBilling):
        """Send payment reminder email"""
        try:
            subject = f'Payment Reminder - {billing_record.sponsor_cohort.name}'

            due_date = billing_record.created_at + timedelta(days=30)

            message = f"""
            Dear {sponsor.name},

            This is a friendly reminder that payment for {billing_record.sponsor_cohort.name} billing period {billing_record.billing_month.strftime('%B %Y')} is due on {due_date.strftime('%Y-%m-%d')}.

            Amount Due: KES {billing_record.net_amount:,.0f}

            Payment Methods:
            - Bank Transfer to: Ongóza Cyber Hub account
            - M-Pesa to: +254 XXX XXX XXX

            Thank you for your partnership!

            Best regards,
            Finance Team
            Ongóza Cyber Hub
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[sponsor.contact_email],
                fail_silently=True
            )

        except Exception as e:
            logger.error(f"Failed to send payment reminder email: {str(e)}")
