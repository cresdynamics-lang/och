#!/usr/bin/env python3
"""Fix subscription table columns."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Fixing subscription table columns...")

with connection.cursor() as cursor:
    # Rename price to price_monthly
    print("\n[1] Renaming price to price_monthly...")
    cursor.execute("""
        ALTER TABLE subscription_plans
        RENAME COLUMN price TO price_monthly;
    """)
    print("    [OK] Column renamed")

    # Rename billing_cycle to stripe_price_id (if needed)
    print("\n[2] Checking for other missing columns...")
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'subscription_plans';
    """)
    columns = [row[0] for row in cursor.fetchall()]
    print(f"    Current columns: {', '.join(columns)}")

    # Add missing columns if needed
    missing_cols = []
    if 'ai_coach_daily_limit' not in columns:
        missing_cols.append('ai_coach_daily_limit')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN ai_coach_daily_limit INTEGER;")

    if 'portfolio_item_limit' not in columns:
        missing_cols.append('portfolio_item_limit')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN portfolio_item_limit INTEGER;")

    if 'missions_access_type' not in columns:
        missing_cols.append('missions_access_type')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN missions_access_type VARCHAR(50) DEFAULT 'none';")

    if 'mentorship_access' not in columns:
        missing_cols.append('mentorship_access')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN mentorship_access BOOLEAN DEFAULT false;")

    if 'talentscope_access' not in columns:
        missing_cols.append('talentscope_access')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN talentscope_access VARCHAR(50) DEFAULT 'none';")

    if 'marketplace_access' not in columns:
        missing_cols.append('marketplace_access')
        cursor.execute("ALTER TABLE subscription_plans ADD COLUMN marketplace_access BOOLEAN DEFAULT false;")

    if missing_cols:
        print(f"    [OK] Added {len(missing_cols)} missing columns: {', '.join(missing_cols)}")
    else:
        print("    [OK] All required columns present")

print("\n[DONE] Columns fixed!")
