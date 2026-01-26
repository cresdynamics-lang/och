#!/usr/bin/env python
"""
Automatically fake migrations for all tables that already exist in the database.
This prevents "relation already exists" errors during migration.
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
    """Determine which Django app a table belongs to."""
    # Map table names to apps
    table_to_app = {
        # Django core
        'django_admin_log': 'admin',
        'django_content_type': 'contenttypes',
        'django_migrations': None,  # Skip this one
        'django_session': 'sessions',
        'auth_group': 'auth',
        'auth_group_permissions': 'auth',
        'auth_permission': 'auth',
        'auth_user': 'auth',
        'auth_user_groups': 'auth',
        'auth_user_user_permissions': 'auth',
    }
    
    if table_name in table_to_app:
        return table_to_app[table_name]
    
    # Try to find app by model's db_table
    for app_config in apps.get_app_configs():
        try:
            for model in app_config.get_models():
                if hasattr(model, '_meta'):
                    db_table = model._meta.db_table
                    if db_table == table_name:
                        return app_config.label
        except Exception:
            continue
    
    # Try to infer from table name (remove common suffixes)
    table_parts = table_name.split('_')
    if len(table_parts) > 1:
        # Try first part as app name
        potential_app = table_parts[0]
        if potential_app in [app.label for app in apps.get_app_configs()]:
            return potential_app
    
    return None

def main():
    print("=" * 70)
    print("Auto-Faking Migrations for Existing Tables")
    print("=" * 70)
    print()
    
    # Get all existing tables
    existing_tables = get_all_tables()
    print(f"Found {len(existing_tables)} tables in database")
    print()
    
    # Map tables to apps
    app_tables = {}
    for table in existing_tables:
        if table == 'django_migrations':
            continue  # Skip migration tracking table
        app = get_app_for_table(table)
        if app:
            if app not in app_tables:
                app_tables[app] = []
            app_tables[app].append(table)
        else:
            print(f"⚠️  Could not determine app for table: {table}")
    
    print(f"Found tables in {len(app_tables)} apps:")
    for app, tables in sorted(app_tables.items()):
        print(f"  {app}: {len(tables)} tables")
    print()
    
    # Fake migrations for each app
    print("Faking migrations for apps with existing tables...")
    print("-" * 70)
    faked_apps = []
    failed_apps = []
    
    for app in sorted(app_tables.keys()):
        print(f"  Faking {app}...", end=' ')
        try:
            call_command('migrate', app, '--fake', verbosity=0)
            print("✅")
            faked_apps.append(app)
        except Exception as e:
            print(f"⚠️  ({str(e)[:50]})")
            failed_apps.append(app)
    
    print()
    print(f"✅ Faked migrations for {len(faked_apps)} apps")
    if failed_apps:
        print(f"⚠️  Failed to fake {len(failed_apps)} apps: {', '.join(failed_apps)}")
    print()
    
    # Run remaining migrations
    print("=" * 70)
    print("Running Remaining Migrations")
    print("=" * 70)
    print()
    
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
        print("If you see 'relation already exists' errors, fake that app:")
        print("  python manage.py migrate <app_name> --fake")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)



















