"""
Create all missing sponsor dashboard tables.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

TABLES = {
    'sponsor_dashboard_cache': """
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
    """,
    'sponsor_cohort_dashboard': """
        CREATE TABLE IF NOT EXISTS sponsor_cohort_dashboard (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id INTEGER NOT NULL,
            cohort_id UUID NOT NULL,
            cohort_name VARCHAR(200) NOT NULL,
            track_name VARCHAR(200),
            start_date DATE,
            end_date DATE,
            mode VARCHAR(20),
            seats_total INTEGER NOT NULL DEFAULT 0,
            seats_used INTEGER NOT NULL DEFAULT 0,
            seats_sponsored INTEGER NOT NULL DEFAULT 0,
            seats_remaining INTEGER NOT NULL DEFAULT 0,
            avg_readiness NUMERIC(5,2),
            completion_pct NUMERIC(5,2),
            portfolio_health_avg NUMERIC(5,2),
            graduates_count INTEGER NOT NULL DEFAULT 0,
            at_risk_count INTEGER NOT NULL DEFAULT 0,
            next_milestone JSONB DEFAULT '{}'::jsonb,
            upcoming_events JSONB DEFAULT '[]'::jsonb,
            flags JSONB DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT sponsor_cohort_dashboard_org_id_fkey FOREIGN KEY (org_id) 
                REFERENCES organizations(id) ON DELETE CASCADE,
            CONSTRAINT sponsor_cohort_dashboard_cohort_id_fkey FOREIGN KEY (cohort_id) 
                REFERENCES cohorts(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS sponsor_coh_org_id_17cd8a_idx ON sponsor_cohort_dashboard(org_id, updated_at);
        CREATE INDEX IF NOT EXISTS sponsor_coh_cohort__18cc6e_idx ON sponsor_cohort_dashboard(cohort_id);
        CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohort_dashboard_org_cohort_unique ON sponsor_cohort_dashboard(org_id, cohort_id);
    """,
    'sponsor_student_aggregates': """
        CREATE TABLE IF NOT EXISTS sponsor_student_aggregates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id INTEGER NOT NULL,
            cohort_id UUID NOT NULL,
            student_id INTEGER NOT NULL,
            name_anonymized VARCHAR(100) NOT NULL,
            readiness_score NUMERIC(5,2),
            completion_pct NUMERIC(5,2),
            portfolio_items INTEGER NOT NULL DEFAULT 0,
            consent_employer_share BOOLEAN NOT NULL DEFAULT FALSE,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT sponsor_student_aggregates_org_id_fkey FOREIGN KEY (org_id) 
                REFERENCES organizations(id) ON DELETE CASCADE,
            CONSTRAINT sponsor_student_aggregates_cohort_id_fkey FOREIGN KEY (cohort_id) 
                REFERENCES cohorts(id) ON DELETE CASCADE,
            CONSTRAINT sponsor_student_aggregates_student_id_fkey FOREIGN KEY (student_id) 
                REFERENCES users_user(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS sponsor_stu_org_id_411bac_idx ON sponsor_student_aggregates(org_id, cohort_id);
        CREATE INDEX IF NOT EXISTS sponsor_stu_org_id_72a1a3_idx ON sponsor_student_aggregates(org_id, consent_employer_share);
        CREATE UNIQUE INDEX IF NOT EXISTS sponsor_student_aggregates_org_cohort_student_unique ON sponsor_student_aggregates(org_id, cohort_id, student_id);
    """,
    'sponsor_codes': """
        CREATE TABLE IF NOT EXISTS sponsor_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id INTEGER NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            seats INTEGER NOT NULL,
            value_per_seat NUMERIC(8,2),
            valid_from DATE,
            valid_until DATE,
            usage_count INTEGER NOT NULL DEFAULT 0,
            max_usage INTEGER,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT sponsor_codes_org_id_fkey FOREIGN KEY (org_id) 
                REFERENCES organizations(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS sponsor_cod_org_id_8a84aa_idx ON sponsor_codes(org_id, status);
        CREATE INDEX IF NOT EXISTS sponsor_cod_code_bd3b98_idx ON sponsor_codes(code);
    """
}

def check_table_exists(table_name):
    """Check if a table exists."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def create_table(table_name, sql):
    """Create a table if it doesn't exist."""
    if check_table_exists(table_name):
        print(f"✅ Table {table_name} already exists")
        return True
    
    print(f"Creating table {table_name}...")
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f"✅ Table {table_name} created successfully!")
            return True
        except Exception as e:
            error_msg = str(e).lower()
            if 'already exists' in error_msg or 'duplicate' in error_msg:
                print(f"✅ Table {table_name} already exists (race condition)")
                return True
            else:
                print(f"❌ Error creating {table_name}: {e}")
                # Check if it's a dependency issue (cohorts table might not exist)
                if 'cohorts' in error_msg or 'relation "cohorts"' in error_msg:
                    print(f"   Note: This table depends on 'cohorts' table which may not exist yet.")
                    print(f"   This is OK - cohorts will be created when needed.")
                    return False
                return False

def main():
    print("=" * 60)
    print("Creating All Sponsor Dashboard Tables")
    print("=" * 60)
    
    created = 0
    skipped = 0
    failed = 0
    
    for table_name, sql in TABLES.items():
        print(f"\n{table_name}:")
        if create_table(table_name, sql):
            created += 1
        else:
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Summary: {created} created/skipped, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("\n✅ All tables ready!")
    else:
        print(f"\n⚠️  {failed} table(s) could not be created (likely dependency issues)")
        print("   These will be created when dependencies are available.")

if __name__ == '__main__':
    main()
