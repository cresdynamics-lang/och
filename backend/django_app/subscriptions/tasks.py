"""
Background tasks for Subscription Engine.
"""
import logging
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import UserSubscription, SubscriptionPlan
from student_dashboard.services import DashboardAggregationService

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='subscriptions.process_stripe_webhook')
def process_stripe_webhook_task(event):
    """
    Process Stripe webhook events.
    """
    try:
        event_type = event['type']
        data = event['data']['object']
        
        if event_type == 'charge.succeeded':
            # Find user by customer ID
            customer_id = data.get('customer')
            subscription = UserSubscription.objects.filter(
                stripe_subscription_id__isnull=False
            ).first()  # Would need customer_id mapping
            
            if subscription:
                subscription.status = 'active'
                subscription.save()
                DashboardAggregationService.queue_update(
                    subscription.user,
                    'payment_succeeded',
                    'urgent'
                )
        
        elif event_type == 'subscription.updated':
            subscription_id = data.get('id')
            try:
                subscription = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
                subscription.status = data.get('status', 'active')
                subscription.current_period_end = timezone.datetime.fromtimestamp(
                    data.get('current_period_end', 0),
                    tz=timezone.utc
                )
                subscription.save()
                DashboardAggregationService.queue_update(
                    subscription.user,
                    'subscription_updated',
                    'urgent'
                )
            except UserSubscription.DoesNotExist:
                pass
        
        elif event_type == 'invoice.payment_failed':
            subscription_id = data.get('subscription')
            try:
                subscription = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
                subscription.status = 'past_due'
                subscription.save()
            except UserSubscription.DoesNotExist:
                pass
        
        logger.info(f"Processed Stripe webhook: {event_type}")
        return {'status': 'success', 'event_type': event_type}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

