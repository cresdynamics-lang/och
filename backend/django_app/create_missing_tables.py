"""
Create missing database tables by manually executing SQL.
This is a workaround when migrations are in a broken state.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

SQL_CREATE_SPONSOR_DASHBOARD_CACHE = """
CREATE TABLE IF NOT EXISTS sponsor_dashboard_cache (
    org_id INTEGER PRIMARY KEY,
    seats_total INTEGER NOT NULL DEFAULT 0,
    seats_used INTEGER NOT NULL DEFAULT 0,
    seats_at_risk INTEGER NOT NULL DEFAULT 0,
    budget_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    budget_used NUMERIC(12,2) NOT NULL DEFAULT 0,
    budget_used_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_readiness NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    graduates_count INTEGER NOT NULL DEFAULT 0,
    active_cohorts_count INTEGER NOT NULL DEFAULT 0,
    overdue_invoices_count INTEGER NOT NULL DEFAULT 0,
    low_utilization_cohorts INTEGER NOT NULL DEFAULT 0,
    cache_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_dashboard_cache_org_id_fkey FOREIGN KEY (org_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);
"""

def main():
    print("Creating sponsor_dashboard_cache table...")
    
    with connection.cursor() as cursor:
        try:
            cursor.execute(SQL_CREATE_SPONSOR_DASHBOARD_CACHE)
            print("✅ Table sponsor_dashboard_cache created successfully!")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print("✅ Table sponsor_dashboard_cache already exists!")
            else:
                print(f"❌ Error: {e}")
                return
    
    print("\nTable created. You may need to restart the Django server.")

if __name__ == '__main__':
    main()
