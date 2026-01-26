"""
Mark sponsor_dashboard migrations as applied after creating the table manually.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection
from django.utils import timezone

def mark_migration_applied(app_name, migration_name):
    """Mark a migration as applied in django_migrations table."""
    with connection.cursor() as cursor:
        # Check if already exists
        cursor.execute("""
            SELECT COUNT(*) FROM django_migrations 
            WHERE app = %s AND name = %s;
        """, [app_name, migration_name])
        exists = cursor.fetchone()[0] > 0
        
        if not exists:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES (%s, %s, %s);
            """, [app_name, migration_name, timezone.now()])
            print(f"✅ Marked {app_name}.{migration_name} as applied")
        else:
            print(f"✅ {app_name}.{migration_name} already marked as applied")

def main():
    print("Marking sponsor_dashboard migrations as applied...")
    mark_migration_applied('sponsor_dashboard', '0001_initial')
    mark_migration_applied('sponsor_dashboard', '0002_add_rls_policies')
    print("\n✅ All migrations marked as applied!")

if __name__ == '__main__':
    main()
