"""
Script to fix sponsor_dashboard_cache table missing issue.
Un-fakes the migrations and re-applies them properly.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from django.core.management import call_command

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

def remove_migration_record(app_name, migration_name):
    """Remove a migration record from django_migrations table."""
    with connection.cursor() as cursor:
        cursor.execute("""
            DELETE FROM django_migrations 
            WHERE app = %s AND name = %s;
        """, [app_name, migration_name])
        print(f"✅ Removed migration record: {app_name}.{migration_name}")

def main():
    print("=" * 60)
    print("Fixing sponsor_dashboard_cache table")
    print("=" * 60)
    
    table_name = 'sponsor_dashboard_cache'
    app_name = 'sponsor_dashboard'
    
    # Check if table exists
    if check_table_exists(table_name):
        print(f"✅ Table {table_name} already exists!")
        return
    
    print(f"❌ Table {table_name} does not exist")
    print("\nUn-faking migrations...")
    
    # Remove migration records
    remove_migration_record(app_name, '0001_initial')
    remove_migration_record(app_name, '0002_add_rls_policies')
    
    print("\nRe-applying migrations...")
    try:
        call_command('migrate', app_name, verbosity=2)
        print("✅ Migrations applied successfully!")
        
        # Verify table exists
        if check_table_exists(table_name):
            print(f"✅ Table {table_name} created successfully!")
        else:
            print(f"❌ Table {table_name} still doesn't exist. Check errors above.")
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
