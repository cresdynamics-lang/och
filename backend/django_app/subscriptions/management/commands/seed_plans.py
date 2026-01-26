"""
Django management command to seed subscription plans.
"""
from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed subscription plans'

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'free',
                'price_monthly': 0,
                'features': ['basic_ai', 'limited_missions'],
                'max_missions_monthly': 3,
            },
            {
                'name': 'starter_normal',
                'price_monthly': 9.99,
                'features': ['ai_full', 'unlimited_missions'],
                'max_missions_monthly': None,
            },
            {
                'name': 'starter_enhanced',
                'price_monthly': 19.99,
                'features': ['ai_full', 'unlimited_missions', 'enhanced_access_180d'],
                'max_missions_monthly': None,
            },
            {
                'name': 'premium',
                'price_monthly': 49.99,
                'features': ['ai_full', 'unlimited_missions', 'mentor_access', 'priority_support'],
                'max_missions_monthly': None,
            },
        ]
        
        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created plan: {plan.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated plan: {plan.name}'))

