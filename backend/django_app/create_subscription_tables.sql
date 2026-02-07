-- Create subscription tables

-- subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL,
    price_monthly DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    ai_coach_daily_limit INTEGER,
    portfolio_item_limit INTEGER,
    missions_access_type VARCHAR(50) DEFAULT 'none',
    mentorship_access BOOLEAN DEFAULT FALSE,
    talentscope_access VARCHAR(50) DEFAULT 'none',
    marketplace_contact BOOLEAN DEFAULT FALSE,
    enhanced_access_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    plan_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'trial',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    enhanced_access_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_gateways
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    webhook_secret VARCHAR(255),
    webhook_url VARCHAR(200),
    test_mode BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    gateway_id UUID,
    subscription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB DEFAULT '{}'::jsonb,
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- subscription_rules
CREATE TABLE IF NOT EXISTS subscription_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    value JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_settings
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by_id VARCHAR(36)
);

-- Indexes
CREATE INDEX IF NOT EXISTS subscription_plans_tier_idx ON subscription_plans(tier);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_period_idx ON user_subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_idx ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS payment_transactions_user_status_idx ON payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS payment_transactions_gateway_tx_idx ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS payment_transactions_created_idx ON payment_transactions(created_at);
