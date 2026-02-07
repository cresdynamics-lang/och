#!/usr/bin/env python3
"""Test and setup subscription system."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from subscriptions.models import SubscriptionPlan, UserSubscription
from users.models import User

print("=" * 80)
print("SUBSCRIPTION SYSTEM TEST")
print("=" * 80)

# Check if tables exist
print("\n[1] Checking database tables...")
with connection.cursor() as cursor:
    # Check subscription_plans table
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'subscription_plans'
        );
    """)
    plans_exist = cursor.fetchone()[0]
    print(f"    subscription_plans table: {'EXISTS' if plans_exist else 'MISSING'}")

    # Check user_subscriptions table
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'user_subscriptions'
        );
    """)
    subs_exist = cursor.fetchone()[0]
    print(f"    user_subscriptions table: {'EXISTS' if subs_exist else 'MISSING'}")

    # Check payment_transactions table
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'payment_transactions'
        );
    """)
    payments_exist = cursor.fetchone()[0]
    print(f"    payment_transactions table: {'EXISTS' if payments_exist else 'MISSING'}")

# If tables don't exist, show creation SQL
if not all([plans_exist, subs_exist, payments_exist]):
    print("\n[!] Some tables are missing. Need to create them.")
    print("    Run: python manage.py migrate subscriptions")
else:
    print("\n[2] All subscription tables exist!")

    # Check if plans exist
    plans_count = SubscriptionPlan.objects.count()
    print(f"\n[3] Subscription plans in database: {plans_count}")

    if plans_count == 0:
        print("    [!] No subscription plans found. Creating default plans...")
        # Create default plans
        plans_to_create = [
            {
                'name': 'free',
                'tier': 'free',
                'price': 0,
                'billing_cycle': 'monthly',
                'features': ['Basic access', 'Limited missions'],
                'description': 'Free tier with basic access'
            },
            {
                'name': 'starter_3',
                'tier': 'starter',
                'price': 3,
                'billing_cycle': 'monthly',
                'features': ['5 missions/month', 'AI feedback', 'Basic support'],
                'description': 'Starter plan at $3/month'
            },
            {
                'name': 'professional_7',
                'tier': 'premium',
                'price': 7,
                'billing_cycle': 'monthly',
                'features': ['Unlimited missions', 'AI feedback', 'Mentor review', 'Priority support'],
                'description': 'Professional plan at $7/month with mentor access'
            }
        ]

        for plan_data in plans_to_create:
            plan = SubscriptionPlan.objects.create(**plan_data)
            print(f"    [OK] Created plan: {plan.name} (${plan.price}/month)")

        print(f"\n    [DONE] Created {len(plans_to_create)} subscription plans")
    else:
        print("\n    Existing plans:")
        for plan in SubscriptionPlan.objects.all():
            print(f"    - {plan.name}: ${plan.price}/{plan.billing_cycle} ({plan.tier} tier)")

    # Check user subscriptions
    subs_count = UserSubscription.objects.count()
    print(f"\n[4] Active user subscriptions: {subs_count}")

    if subs_count > 0:
        print("    Subscriptions:")
        for sub in UserSubscription.objects.select_related('user', 'plan')[:5]:
            print(f"    - {sub.user.email}: {sub.plan.name} (status: {sub.status})")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
