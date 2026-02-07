#!/usr/bin/env python
"""Check subscription plan features."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from subscriptions.models import SubscriptionPlan

print('Subscription Plans and Features:\n')
for plan in SubscriptionPlan.objects.all().order_by('price_monthly'):
    print(f'{plan.name} (${plan.price_monthly or 0}/month)')
    print(f'  Tier: {plan.tier}')
    print(f'  Features: {plan.features}')
    print(f'  AI Coach Daily Limit: {plan.ai_coach_daily_limit}')
    print(f'  Missions Access: {plan.missions_access_type}')
    print(f'  Mentorship: {plan.mentorship_access}')
    print()
