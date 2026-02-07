#!/usr/bin/env python3
"""Assign subscription plan to a user (for testing/admin purposes)."""
import os
import django
import sys
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.utils import timezone
from subscriptions.models import SubscriptionPlan, UserSubscription
from users.models import User

def assign_plan(email, plan_name):
    """Assign a subscription plan to a user."""
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"[ERROR] User {email} not found")
        return False

    try:
        plan = SubscriptionPlan.objects.get(name=plan_name)
    except SubscriptionPlan.DoesNotExist:
        print(f"[ERROR] Plan {plan_name} not found")
        print(f"Available plans: {list(SubscriptionPlan.objects.values_list('name', flat=True))}")
        return False

    # Create or update subscription
    subscription, created = UserSubscription.objects.update_or_create(
        user=user,
        defaults={
            'plan': plan,
            'status': 'active',
            'current_period_start': timezone.now(),
            'current_period_end': timezone.now() + timedelta(days=30),
            'enhanced_access_expires_at': timezone.now() + timedelta(days=plan.enhanced_access_days) if plan.enhanced_access_days else None,
        }
    )

    action = "Created" if created else "Updated"
    print(f"[OK] {action} subscription for {email}")
    print(f"    Plan: {plan.name} (${plan.price_monthly or 0}/month)")
    print(f"    Status: {subscription.status}")
    print(f"    Period: {subscription.current_period_start.date()} to {subscription.current_period_end.date()}")

    return True

if __name__ == '__main__':
    print("=" * 80)
    print("ASSIGN SUBSCRIPTION TO USER")
    print("=" * 80)

    if len(sys.argv) < 3:
        print("\nUsage: python assign_subscription.py <email> <plan_name>")
        print("\nAvailable plans:")
        for plan in SubscriptionPlan.objects.all():
            print(f"  - {plan.name}: ${plan.price_monthly or 0}/month")
        print("\nExample:")
        print("  python assign_subscription.py student@example.com professional_7")
        sys.exit(1)

    email = sys.argv[1]
    plan_name = sys.argv[2]

    assign_plan(email, plan_name)
