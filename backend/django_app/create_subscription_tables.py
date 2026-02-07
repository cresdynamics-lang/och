#!/usr/bin/env python3
"""Create subscription tables."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Creating subscription tables...")

with connection.cursor() as cursor:
    # Create subscription_plans table
    print("\n[1] Creating subscription_plans table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) UNIQUE NOT NULL,
            tier VARCHAR(20) NOT NULL,
            price DECIMAL(10, 2) NOT NULL DEFAULT 0,
            billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
            features JSONB DEFAULT '[]'::jsonb,
            description TEXT,
            stripe_price_id VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    print("    [OK] subscription_plans table created")

    # Create user_subscriptions table
    print("\n[2] Creating user_subscriptions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            stripe_subscription_id VARCHAR(100),
            stripe_customer_id VARCHAR(100),
            current_period_start TIMESTAMP WITH TIME ZONE,
            current_period_end TIMESTAMP WITH TIME ZONE,
            cancel_at_period_end BOOLEAN DEFAULT false,
            canceled_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
    """)
    print("    [OK] user_subscriptions table created")

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_subs_user ON user_subscriptions(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_subs_plan ON user_subscriptions(plan_id);")

    # Create payment_transactions table
    print("\n[3] Creating payment_transactions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            status VARCHAR(20) NOT NULL,
            payment_method VARCHAR(50),
            stripe_payment_intent_id VARCHAR(100),
            stripe_charge_id VARCHAR(100),
            error_message TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    print("    [OK] payment_transactions table created")

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payment_transactions(subscription_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);")

    # Insert default subscription plans
    print("\n[4] Creating default subscription plans...")
    cursor.execute("""
        INSERT INTO subscription_plans (name, tier, price, billing_cycle, features, description)
        VALUES
            ('free', 'free', 0, 'monthly', '["Basic access", "Limited missions"]'::jsonb, 'Free tier with basic access'),
            ('starter_3', 'starter', 3.00, 'monthly', '["5 missions/month", "AI feedback", "Basic support"]'::jsonb, 'Starter plan at $3/month'),
            ('professional_7', 'premium', 7.00, 'monthly', '["Unlimited missions", "AI feedback", "Mentor review", "Priority support"]'::jsonb, 'Professional plan at $7/month with mentor access')
        ON CONFLICT (name) DO NOTHING;
    """)
    print("    [OK] Created 3 default subscription plans")

print("\n[DONE] Subscription system setup complete!")
print("\nNext steps:")
print("  1. Run: python test_subscriptions.py")
print("  2. Test endpoints with a student user")
