#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User
from subscriptions.models import SubscriptionPlan, UserSubscription
from django.utils import timezone
from datetime import timedelta

def fix_subscription_system():
    """Fix subscription system for bob@student.com"""
    
    # 1. Create subscription plans if they don't exist
    starter_plan, created = SubscriptionPlan.objects.get_or_create(
        name='starter_3',
        defaults={
            'tier': 'starter',
            'price_monthly': 3.00,
            'features': ['curriculum_read', 'profiler_full', 'missions', 'ai_coach', 'portfolio'],
            'missions_access_type': 'ai_only',
            'ai_coach_daily_limit': 10,
            'portfolio_item_limit': 5,
            'enhanced_access_days': 180
        }
    )
    if created:
        print('+ Created starter_3 plan')
    
    # 2. Get user
    try:
        user = User.objects.get(email='bob@student.com')
        print(f'Found user: {user.email}')
        
        # 3. Create or update user subscription
        subscription, created = UserSubscription.objects.get_or_create(
            user=user,
            defaults={
                'plan': starter_plan,
                'status': 'active',
                'current_period_start': timezone.now(),
                'current_period_end': timezone.now() + timedelta(days=30),
                'enhanced_access_expires_at': timezone.now() + timedelta(days=180)
            }
        )
        
        if not created:
            # Update existing subscription
            subscription.plan = starter_plan
            subscription.status = 'active'
            subscription.current_period_start = timezone.now()
            subscription.current_period_end = timezone.now() + timedelta(days=30)
            subscription.enhanced_access_expires_at = timezone.now() + timedelta(days=180)
            subscription.save()
            print('+ Updated user subscription to starter_3')
        else:
            print('+ Created new starter_3 subscription')
            
        print(f'Subscription status: {subscription.status}')
        print(f'Plan: {subscription.plan.name}')
        print(f'Missions access: {subscription.plan.missions_access_type}')
        
    except User.DoesNotExist:
        print('Error: User bob@student.com not found')

if __name__ == '__main__':
    fix_subscription_system()