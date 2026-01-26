#!/usr/bin/env python
"""
Fix migration state when database tables already exist.
Fakes all migrations for tables that already exist in the database.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.management import call_command
from django.db import connection
from django.apps import apps

def check_table_exists(table_name):
    """Check if a table exists in the database."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def get_all_tables():
    """Get all tables in the database."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        return [row[0] for row in cursor.fetchall()]

def get_app_for_table(table_name):
    """Try to determine which app a table belongs to."""
    # Map common Django tables
    django_tables = {
        'django_admin_log': 'admin',
        'django_content_type': 'contenttypes',
        'django_migrations': 'migrations',
        'django_session': 'sessions',
        'auth_group': 'auth',
        'auth_group_permissions': 'auth',
        'auth_permission': 'auth',
        'auth_user': 'auth',
        'auth_user_groups': 'auth',
        'auth_user_user_permissions': 'auth',
    }
    
    if table_name in django_tables:
        return django_tables[table_name]
    
    # Try to find app by model
    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            if hasattr(model, '_meta') and model._meta.db_table == table_name:
                return app_config.label
    
    return None

def main():
    print("=" * 70)
    print("Fixing Migration State - Faking Migrations for Existing Tables")
    print("=" * 70)
    print()
        
    # Get all existing tables
    existing_tables = get_all_tables()
    print(f"Found {len(existing_tables)} tables in database")
    print()
    
    # Django core apps that should be faked
    django_core_apps = [
        'admin',
        'auth',
        'contenttypes',
        'sessions',
    ]
    
    # Fake Django core migrations
    print("Step 1: Faking Django core migrations...")
    for app in django_core_apps:
        try:
            print(f"  Faking {app} migrations...", end=' ')
            call_command('migrate', app, '--fake', verbosity=0)
            print("✅")
        except Exception as e:
            print(f"⚠️  {e}")
    
    print()
    
    # Fake organizations if table exists
    if check_table_exists('organizations'):
        print("Step 2: Faking organizations migrations...")
        try:
            call_command('migrate', 'organizations', '--fake', verbosity=2)
            print("✅ Organizations migrations faked")
        except Exception as e:
            print(f"⚠️  Organizations: {e}")
        print()
    
    # Fake users if table exists
    if check_table_exists('users'):
        print("Step 3: Faking users migrations...")
        try:
            call_command('migrate', 'users', '--fake', verbosity=2)
            print("✅ Users migrations faked")
        except Exception as e:
            print(f"⚠️  Users: {e}")
        print()
    
    # Now try to run real migrations
    print("Step 4: Running remaining migrations...")
    print("-" * 70)
    try:
        call_command('migrate', verbosity=2)
        print()
        print("=" * 70)
        print("✅ All migrations completed successfully!")
        print("=" * 70)
        return True
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ Migration failed")
        print("=" * 70)
        print(f"Error: {e}")
        print()
        print("You may need to fake additional migrations manually:")
        print("  python manage.py migrate <app_name> --fake")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
