#!/usr/bin/env python3
"""
Check if required tables exist
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def check_tables():
    tables_to_check = [
        'user_subscriptions',
        'subscription_plans',
        'coaching_goals',
        'coaching_habits',
    ]

    with connection.cursor() as cursor:
        for table in tables_to_check:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = %s
                );
            """, [table])
            exists = cursor.fetchone()[0]
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"{table}: {status}")

if __name__ == '__main__':
    check_tables()
