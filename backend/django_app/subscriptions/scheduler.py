"""
Subscription scheduler using django-apscheduler.
Runs periodic jobs that enforce billing business rules from the DSD spec:

  - enforce_grace_period_and_downgrade  (every 12 hours)
      • past_due subscriptions past 5-day grace  → downgrade to Free Tier
      • canceled subscriptions past period_end   → downgrade to Free Tier
      • expired enhanced_access              → nothing (Normal Mode auto-computed
                                              by `days_enhanced_left` property)

  - renew_active_subscriptions  (daily, 02:00 UTC)
      • Simulated renewal: extends current_period_end by 30 days for active subs.
        In production this is replaced by a real payment gateway webhook.
"""
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


# ── Job functions ─────────────────────────────────────────────────────────────

def enforce_grace_period_and_downgrade():
    """
    DSD §14.2 / §5.4.3:
      - Payment fails → grace period = 5 days
      - After 5 days without success → status = canceled, downgrade to Free Tier

    Also handles:
      - Canceled subs whose period_end has passed → downgrade to Free Tier
    """
    from subscriptions.models import UserSubscription, SubscriptionPlan

    now = timezone.now()
    grace_days = 5

    # -- 1. past_due past grace period → downgrade to Free ----------------
    try:
        free_plan = SubscriptionPlan.objects.get(tier='free', is_active=True)
    except SubscriptionPlan.DoesNotExist:
        logger.error('[scheduler] Free plan not found — cannot downgrade. Run seed_plans first.')
        return

    # past_due subscriptions where updated_at is older than grace_days
    grace_cutoff = now - timezone.timedelta(days=grace_days)
    past_due_qs = UserSubscription.objects.filter(
        status='past_due',
        updated_at__lte=grace_cutoff,
    ).select_related('user', 'plan')

    for sub in past_due_qs:
        old_plan = sub.plan.name
        sub.plan = free_plan
        sub.status = 'canceled'
        sub.enhanced_access_expires_at = None
        sub.save(update_fields=['plan', 'status', 'enhanced_access_expires_at', 'updated_at'])
        logger.info(
            f'[scheduler] Grace expired: {sub.user.email} downgraded '
            f'{old_plan} → free (past_due > {grace_days}d)'
        )

    # -- 2. canceled subs whose period has ended → move to free plan ------
    expired_canceled_qs = UserSubscription.objects.filter(
        status='canceled',
        current_period_end__lte=now,
    ).exclude(plan__tier='free').select_related('user', 'plan')

    for sub in expired_canceled_qs:
        old_plan = sub.plan.name
        sub.plan = free_plan
        sub.enhanced_access_expires_at = None
        sub.save(update_fields=['plan', 'enhanced_access_expires_at', 'updated_at'])
        logger.info(
            f'[scheduler] Canceled period ended: {sub.user.email} moved '
            f'{old_plan} → free'
        )


def renew_active_subscriptions():
    """
    Simulated monthly renewal — extends current_period_end by 30 days for
    active subscriptions whose billing period has ended.

    In production, real payment gateways send webhooks instead of this job.
    This keeps the simulated system working correctly without a real gateway.
    """
    from subscriptions.models import UserSubscription, PaymentTransaction
    import uuid

    now = timezone.now()
    due_qs = UserSubscription.objects.filter(
        status='active',
        current_period_end__lte=now,
    ).exclude(plan__tier='free').select_related('user', 'plan')

    for sub in due_qs:
        old_end = sub.current_period_end
        sub.current_period_start = now
        sub.current_period_end = now + timezone.timedelta(days=30)
        sub.save(update_fields=['current_period_start', 'current_period_end', 'updated_at'])

        # Log simulated renewal transaction
        PaymentTransaction.objects.create(
            user=sub.user,
            subscription=sub,
            amount=sub.plan.price_monthly or 0,
            currency='USD',
            status='completed',
            gateway_transaction_id=f'sim_renew_{uuid.uuid4().hex[:10]}',
            gateway_response={'simulated': True, 'type': 'renewal', 'plan': sub.plan.name},
            processed_at=now,
        )
        logger.info(
            f'[scheduler] Renewed: {sub.user.email} | {sub.plan.name} '
            f'| {old_end.date()} → {sub.current_period_end.date()}'
        )


# ── Scheduler setup ───────────────────────────────────────────────────────────

def start():
    """
    Start APScheduler with the subscription jobs.
    Called from the subscriptions AppConfig.ready() hook.
    """
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    from django_apscheduler.jobstores import DjangoJobStore
    from django_apscheduler.models import DjangoJobExecution
    import django_apscheduler.util as aputil

    scheduler = BackgroundScheduler(timezone='UTC')
    scheduler.add_jobstore(DjangoJobStore(), 'default')

    # Grace-period enforcement: every 12 hours
    scheduler.add_job(
        enforce_grace_period_and_downgrade,
        trigger=CronTrigger(hour='*/12'),
        id='enforce_grace_period',
        max_instances=1,
        replace_existing=True,
    )

    # Simulated renewal: daily at 02:00 UTC
    scheduler.add_job(
        renew_active_subscriptions,
        trigger=CronTrigger(hour=2, minute=0),
        id='renew_subscriptions',
        max_instances=1,
        replace_existing=True,
    )

    # Auto-cleanup old job execution records (keep 7 days)
    @aputil.close_old_connections
    def delete_old_job_executions(max_age=604800):
        DjangoJobExecution.objects.delete_old_job_executions(max_age)

    scheduler.add_job(
        delete_old_job_executions,
        trigger=CronTrigger(day_of_week='mon', hour=1),
        id='delete_old_job_executions',
        max_instances=1,
        replace_existing=True,
    )

    scheduler.start()
    logger.info('[scheduler] APScheduler started: enforce_grace_period (12h) + renew_subscriptions (daily 02:00 UTC)')
