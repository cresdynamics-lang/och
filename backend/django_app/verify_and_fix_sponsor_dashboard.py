"""
Verify and fix sponsor dashboard table and migrations.
"""
import os
import sys
import django

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

def main():
    print("=" * 60)
    print("Verifying Sponsor Dashboard Setup")
    print("=" * 60)
    
    table_name = 'sponsor_dashboard_cache'
    
    # Check if table exists
    exists = check_table_exists(table_name)
    print(f"\nTable '{table_name}': {'✅ EXISTS' if exists else '❌ MISSING'}")
    
    if not exists:
        print("\nCreating table...")
        from create_missing_tables import SQL_CREATE_SPONSOR_DASHBOARD_CACHE
        
        with connection.cursor() as cursor:
            try:
                cursor.execute(SQL_CREATE_SPONSOR_DASHBOARD_CACHE)
                print("✅ Table created successfully!")
            except Exception as e:
                print(f"❌ Error creating table: {e}")
                return
        
        # Mark migrations as applied
        print("\nMarking migrations as applied...")
        try:
            call_command('migrate', 'sponsor_dashboard', '--fake', verbosity=0)
            print("✅ Migrations marked as applied!")
        except Exception as e:
            print(f"⚠️  Could not mark migrations: {e}")
    
    # Verify migrations
    print("\nChecking migrations...")
    from django.db.migrations.recorder import MigrationRecorder
    recorder = MigrationRecorder(connection)
    applied = recorder.applied_migrations()
    
    sponsor_migrations = [m for m in applied if m[0] == 'sponsor_dashboard']
    print(f"Applied sponsor_dashboard migrations: {len(sponsor_migrations)}")
    for app, migration in sponsor_migrations:
        print(f"  ✅ {migration}")
    
    print("\n" + "=" * 60)
    print("✅ Verification complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart your Django backend server")
    print("2. Try accessing the sponsor dashboard again")

if __name__ == '__main__':
    main()
