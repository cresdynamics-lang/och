"""
Django management command to seed subscription plans.
Based on DSD spec: Free Tier, $3 Starter (+ 6-month Enhanced Access), $7 Professional.
"""
from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed subscription plans per the DSD specification'

    def handle(self, *args, **options):
        plans = [
            # ── FREE TIER ──────────────────────────────────────────────────────
            {
                'name': 'free',
                'tier': 'free',
                'price_monthly': 0,
                'features': [
                    'curriculum_read_only',
                    'community_limited',
                ],
                'ai_coach_daily_limit': 1,          # 1 interaction/day
                'portfolio_item_limit': 0,           # no portfolio
                'missions_access_type': 'none',
                'mentorship_access': False,
                'talentscope_access': 'none',
                'marketplace_contact': False,
                'enhanced_access_days': 0,
            },

            # ── $3 STARTER ─────────────────────────────────────────────────────
            # First 6 months = Enhanced Access; after that = Normal Mode
            # Backend tracks which mode via enhanced_access_expires_at on UserSubscription
            {
                'name': 'starter_3',
                'tier': 'starter',
                'price_monthly': 3.00,
                'features': [
                    'curriculum_full',
                    'community_full',
                    'missions_ai_only',
                    'portfolio_unlimited',           # unlimited first 6 months
                    'talentscope_preview',
                    'ai_coach_full',
                ],
                'ai_coach_daily_limit': None,        # unlimited during enhanced
                'portfolio_item_limit': None,        # unlimited first 6 months, enforced later
                'missions_access_type': 'ai_only',
                'mentorship_access': False,          # no mentor access
                'talentscope_access': 'preview',
                'marketplace_contact': False,
                'enhanced_access_days': 180,         # 6-month enhanced window
            },

            # ── $7 PROFESSIONAL ────────────────────────────────────────────────
            {
                'name': 'professional_7',
                'tier': 'premium',
                'price_monthly': 7.00,
                'features': [
                    'curriculum_full',
                    'community_full',
                    'missions_full',
                    'missions_mentor_review',
                    'capstones',
                    'portfolio_unlimited',
                    'mentorship_sessions',
                    'mentor_recordings',
                    'ai_coach_full',
                    'talentscope_full',
                    'marketplace_contact',
                    'readiness_breakdown',
                    'cv_scoring',
                    'mentor_influence_index',
                    'lab_integrations',
                ],
                'ai_coach_daily_limit': None,        # unlimited
                'portfolio_item_limit': None,        # unlimited
                'missions_access_type': 'full',
                'mentorship_access': True,
                'talentscope_access': 'full',
                'marketplace_contact': True,
                'enhanced_access_days': 0,
            },
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{action}: {plan.name} — ${plan.price_monthly}/mo')
            )

        self.stdout.write(self.style.SUCCESS('\nPlans seeded successfully.'))
        self.stdout.write('Tiers: free | starter_3 ($3) | professional_7 ($7)')
