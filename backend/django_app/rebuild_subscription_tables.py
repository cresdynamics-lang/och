#!/usr/bin/env python3
"""Completely rebuild subscription tables with correct schema."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Rebuilding subscription tables...")

with connection.cursor() as cursor:
    # Drop existing tables
    print("\n[1] Dropping existing tables...")
    cursor.execute("DROP TABLE IF EXISTS payment_transactions CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS user_subscriptions CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS subscription_plans CASCADE;")
    print("    [OK] Tables dropped")

    # Create subscription_plans with ALL required fields
    print("\n[2] Creating subscription_plans table...")
    cursor.execute("""
        CREATE TABLE subscription_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) UNIQUE NOT NULL,
            tier VARCHAR(20) NOT NULL,
            price_monthly DECIMAL(10, 2),
            features JSONB DEFAULT '[]'::jsonb,
            ai_coach_daily_limit INTEGER,
            portfolio_item_limit INTEGER,
            missions_access_type VARCHAR(50) DEFAULT 'none',
            mentorship_access BOOLEAN DEFAULT false,
            talentscope_access VARCHAR(50) DEFAULT 'none',
            marketplace_contact BOOLEAN DEFAULT false,
            enhanced_access_days INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    cursor.execute("CREATE INDEX idx_sub_plans_tier ON subscription_plans(tier);")
    print("    [OK] subscription_plans table created")

    # Create user_subscriptions
    print("\n[3] Creating user_subscriptions table...")
    cursor.execute("""
        CREATE TABLE user_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(uuid_id) ON DELETE CASCADE,
            plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
            status VARCHAR(20) NOT NULL DEFAULT 'trial',
            current_period_start TIMESTAMP WITH TIME ZONE,
            current_period_end TIMESTAMP WITH TIME ZONE,
            enhanced_access_expires_at TIMESTAMP WITH TIME ZONE,
            stripe_subscription_id VARCHAR(255),
            stripe_customer_id VARCHAR(255),
            stripe_payment_method_id VARCHAR(255),
            cancel_at_period_end BOOLEAN DEFAULT false,
            canceled_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    cursor.execute("CREATE INDEX idx_user_subs_user ON user_subscriptions(user_id);")
    cursor.execute("CREATE INDEX idx_user_subs_status ON user_subscriptions(status);")
    cursor.execute("CREATE INDEX idx_user_subs_plan ON user_subscriptions(plan_id);")
    cursor.execute("CREATE INDEX idx_user_subs_enhanced ON user_subscriptions(enhanced_access_expires_at);")
    print("    [OK] user_subscriptions table created")

    # Create payment_transactions
    print("\n[4] Creating payment_transactions table...")
    cursor.execute("""
        CREATE TABLE payment_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            status VARCHAR(20) NOT NULL,
            payment_method VARCHAR(50),
            stripe_payment_intent_id VARCHAR(255),
            stripe_charge_id VARCHAR(255),
            error_message TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    cursor.execute("CREATE INDEX idx_payments_user ON payment_transactions(user_id);")
    cursor.execute("CREATE INDEX idx_payments_subscription ON payment_transactions(subscription_id);")
    cursor.execute("CREATE INDEX idx_payments_status ON payment_transactions(status);")
    print("    [OK] payment_transactions table created")

    # Insert default subscription plans
    print("\n[5] Creating default subscription plans...")
    cursor.execute("""
        INSERT INTO subscription_plans (
            name, tier, price_monthly, features,
            ai_coach_daily_limit, portfolio_item_limit,
            missions_access_type, mentorship_access,
            talentscope_access, marketplace_contact,
            enhanced_access_days
        ) VALUES
        (
            'free', 'free', NULL,
            '["curriculum_read"]'::jsonb,
            5, 3,
            'none', false,
            'none', false,
            NULL
        ),
        (
            'starter_3', 'starter', 3.00,
            '["curriculum_read", "profiler_full", "missions", "ai_coach"]'::jsonb,
            20, 10,
            'ai_only', false,
            'basic', false,
            180
        ),
        (
            'professional_7', 'premium', 7.00,
            '["curriculum_read", "profiler_full", "missions", "ai_coach", "portfolio", "talentscope", "mentorship", "marketplace"]'::jsonb,
            NULL, NULL,
            'full', true,
            'full', true,
            NULL
        );
    """)
    print("    [OK] Created 3 default subscription plans:")
    print("        - free: $0/month")
    print("        - starter_3: $3/month (180 days enhanced access)")
    print("        - professional_7: $7/month (unlimited)")

print("\n[DONE] Subscription system rebuilt successfully!")
print("\nNext: Test the endpoints at http://localhost:8000/api/v1/admin/plans/")
