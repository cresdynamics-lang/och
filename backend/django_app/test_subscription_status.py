#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User
from subscriptions.models import UserSubscription
from subscriptions.utils import get_user_tier

def test_subscription_status():
    """Test current subscription status for bob@student.com"""
    
    try:
        user = User.objects.get(email='bob@student.com')
        print(f'User: {user.email}')
        print(f'User ID: {user.id}')
        print(f'Is Active: {user.is_active}')
        print(f'Is Mentor: {getattr(user, "is_mentor", False)}')
        
        # Check subscription
        try:
            subscription = UserSubscription.objects.get(user=user, status='active')
            print(f'\nSubscription found:')
            print(f'  Plan: {subscription.plan.name}')
            print(f'  Tier: {subscription.plan.tier}')
            print(f'  Status: {subscription.status}')
            print(f'  Missions Access: {subscription.plan.missions_access_type}')
            print(f'  Features: {subscription.plan.features}')
        except UserSubscription.DoesNotExist:
            print('\nNo active subscription found')
        
        # Test utility function
        tier = get_user_tier(user.id)
        print(f'\nget_user_tier() returns: {tier}')
        
        # Check if tier allows missions
        if tier == 'free':
            print('X Tier is free - missions blocked')
        else:
            print('+ Tier allows missions')
            
    except User.DoesNotExist:
        print('User not found')

if __name__ == '__main__':
    test_subscription_status()