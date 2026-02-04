#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User
from subscriptions.models import SubscriptionPlan, UserSubscription, PaymentTransaction

def show_subscription_system():
    """Show how subscriptions work in the database"""
    
    print("=== SUBSCRIPTION PLANS (Available Tiers) ===")
    plans = SubscriptionPlan.objects.all()
    for plan in plans:
        print(f"Plan: {plan.name}")
        print(f"  Tier: {plan.tier}")
        print(f"  Price: ${plan.price_monthly}/month")
        print(f"  Features: {plan.features}")
        print(f"  Missions: {plan.missions_access_type}")
        print()
    
    print("=== USER SUBSCRIPTIONS (Student Links) ===")
    subscriptions = UserSubscription.objects.select_related('user', 'plan').all()
    for sub in subscriptions:
        print(f"User: {sub.user.email}")
        print(f"  Plan: {sub.plan.name}")
        print(f"  Status: {sub.status}")
        print(f"  Period: {sub.current_period_start} to {sub.current_period_end}")
        print(f"  Enhanced Access: {sub.enhanced_access_expires_at}")
        print()
    
    print("=== HOW STUDENT IS LINKED ===")
    user = User.objects.get(email='bob@student.com')
    print(f"Student: {user.email} (ID: {user.id})")
    
    # Direct relationship
    try:
        subscription = user.subscription  # OneToOne relationship
        print(f"Linked Plan: {subscription.plan.name}")
        print(f"Database Link: users.id={user.id} -> user_subscriptions.user_id={subscription.user_id}")
    except UserSubscription.DoesNotExist:
        print("No subscription linked")

if __name__ == '__main__':
    show_subscription_system()