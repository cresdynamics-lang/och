#!/usr/bin/env python
"""
Fix organizations migration issue when table already exists.
Marks organizations migrations as applied without running them.
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
    print("Fixing Organizations Migration Issue")
    print("=" * 60)
    print()
    
    # Check if organizations table exists
    if check_table_exists('organizations'):
        print("✅ Organizations table already exists in database")
        print()
        print("Marking organizations migrations as applied (fake)...")
        
        try:
            # Fake apply organizations migrations
            call_command('migrate', 'organizations', '--fake', verbosity=2)
            print()
            print("✅ Organizations migrations marked as applied")
        except Exception as e:
            print(f"❌ Error: {e}")
            print()
            print("Trying to fake specific migration...")
            try:
                # Try to fake the specific migration
                call_command('migrate', 'organizations', '0001', '--fake', verbosity=2)
                if check_table_exists('organization_members'):
                    call_command('migrate', 'organizations', '0002', '--fake', verbosity=2)
                print("✅ Organizations migrations marked as applied")
            except Exception as e2:
                print(f"❌ Error: {e2}")
                return False
    else:
        print("⚠️  Organizations table does not exist")
        print("Running normal migration...")
        try:
            call_command('migrate', 'organizations', verbosity=2)
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    print()
    print("=" * 60)
    print("Now you can run: python manage.py migrate")
    print("=" * 60)
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)



















