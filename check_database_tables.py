#!/usr/bin/env python3
"""Check database tables"""
import os
import sys

# Add backend/django_app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Check user tables
    cursor.execute("""
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname='public' AND tablename LIKE '%user%'
        ORDER BY tablename
    """)
    print("\n user-related tables:")
    for table in cursor.fetchall():
        print(f"  - {table[0]}")
    
    # Check if User model's actual table name
    from users.models import User
    print(f"\nDjango User model uses table: {User._meta.db_table}")
    
    # Check foundation tables
    cursor.execute("""
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname='public' AND tablename LIKE '%foundation%'
        ORDER BY tablename
    """)
    print("\nFoundation-related tables:")
    for table in cursor.fetchall():
        print(f"  - {table[0]}")
