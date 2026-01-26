#!/usr/bin/env python
"""
Fix migration state inconsistency for student_dashboard app.
Removes the incorrectly applied 0003 migration record so we can apply in correct order.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def fix_migration_state():
    """Remove the incorrectly applied 0003 migration record."""
    with connection.cursor() as cursor:
        # Check current state
        cursor.execute("""
            SELECT app, name 
            FROM django_migrations 
            WHERE app = 'student_dashboard' 
            ORDER BY name;
        """)
        current = cursor.fetchall()
        print("Current student_dashboard migrations in database:")
        for app, name in current:
            print(f"  - {name}")
        
        # Remove the incorrectly applied 0003 migration
        print("\nRemoving incorrectly applied 0003_add_rls_policies migration...")
        cursor.execute("""
            DELETE FROM django_migrations 
            WHERE app = 'student_dashboard' 
            AND name = '0003_add_rls_policies';
        """)
        
        affected = cursor.rowcount
        print(f"Removed {affected} migration record(s)")
        
        # Verify removal
        cursor.execute("""
            SELECT app, name 
            FROM django_migrations 
            WHERE app = 'student_dashboard' 
            ORDER BY name;
        """)
        after = cursor.fetchall()
        print("\nRemaining student_dashboard migrations in database:")
        for app, name in after:
            print(f"  - {name}")
        
        print("\n✅ Migration state fixed! You can now run: python manage.py migrate")

if __name__ == '__main__':
    try:
        fix_migration_state()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
