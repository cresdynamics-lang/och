#!/usr/bin/env python
"""Create all marketplace-related tables manually."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Creating marketplace tables...\n")

with connection.cursor() as cursor:
    try:
        # 1. Create marketplace_employers table
        print("Creating marketplace_employers table...")
        cursor.execute("DROP TABLE IF EXISTS marketplace_job_applications CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS marketplace_employer_interest_logs CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS marketplace_job_postings CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS marketplace_profiles CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS marketplace_employers CASCADE;")

        cursor.execute("""
            CREATE TABLE marketplace_employers (
                id UUID PRIMARY KEY,
                user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                company_name VARCHAR(255) NOT NULL,
                website TEXT,
                sector VARCHAR(255),
                country VARCHAR(100),
                logo_url TEXT,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX idx_marketplace_employers_company ON marketplace_employers(company_name);")
        print("[OK] Created marketplace_employers\n")

        # 2. Create marketplace_profiles table
        print("Creating marketplace_profiles table...")
        cursor.execute("""
            CREATE TABLE marketplace_profiles (
                id UUID PRIMARY KEY,
                mentee_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tier VARCHAR(32) DEFAULT 'free',
                readiness_score DECIMAL(5,2),
                job_fit_score DECIMAL(5,2),
                hiring_timeline_days INTEGER,
                profile_status VARCHAR(32) DEFAULT 'foundation_mode',
                primary_role VARCHAR(255),
                primary_track_key VARCHAR(64),
                skills JSONB DEFAULT '[]'::jsonb,
                portfolio_depth VARCHAR(32),
                is_visible BOOLEAN DEFAULT FALSE,
                employer_share_consent BOOLEAN DEFAULT FALSE,
                last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX idx_marketplace_profiles_mentee ON marketplace_profiles(mentee_id);")
        cursor.execute("CREATE INDEX idx_marketplace_profiles_status ON marketplace_profiles(profile_status);")
        cursor.execute("CREATE INDEX idx_marketplace_profiles_tier_visible ON marketplace_profiles(tier, is_visible);")
        print("[OK] Created marketplace_profiles\n")

        # 3. Create marketplace_job_postings table
        print("Creating marketplace_job_postings table...")
        cursor.execute("""
            CREATE TABLE marketplace_job_postings (
                id UUID PRIMARY KEY,
                employer_id UUID NOT NULL REFERENCES marketplace_employers(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                job_type VARCHAR(32) NOT NULL,
                description TEXT NOT NULL,
                required_skills JSONB DEFAULT '[]'::jsonb,
                salary_min DECIMAL(10,2),
                salary_max DECIMAL(10,2),
                salary_currency VARCHAR(3) DEFAULT 'USD',
                is_active BOOLEAN DEFAULT TRUE,
                posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                application_deadline TIMESTAMP WITH TIME ZONE
            );
        """)
        cursor.execute("CREATE INDEX idx_marketplace_job_postings_employer ON marketplace_job_postings(employer_id);")
        cursor.execute("CREATE INDEX idx_marketplace_job_postings_active ON marketplace_job_postings(is_active, posted_at);")
        print("[OK] Created marketplace_job_postings\n")

        # 4. Create marketplace_employer_interest_logs table
        print("Creating marketplace_employer_interest_logs table...")
        cursor.execute("""
            CREATE TABLE marketplace_employer_interest_logs (
                id UUID PRIMARY KEY,
                employer_id UUID NOT NULL REFERENCES marketplace_employers(id) ON DELETE CASCADE,
                profile_id UUID NOT NULL REFERENCES marketplace_profiles(id) ON DELETE CASCADE,
                action VARCHAR(32) NOT NULL,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX idx_marketplace_interest_employer ON marketplace_employer_interest_logs(employer_id, action);")
        cursor.execute("CREATE INDEX idx_marketplace_interest_profile ON marketplace_employer_interest_logs(profile_id, action);")
        print("[OK] Created marketplace_employer_interest_logs\n")

        # 5. Create marketplace_job_applications table
        print("Creating marketplace_job_applications table...")
        cursor.execute("""
            CREATE TABLE marketplace_job_applications (
                id UUID PRIMARY KEY,
                job_posting_id UUID NOT NULL REFERENCES marketplace_job_postings(id) ON DELETE CASCADE,
                applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(32) DEFAULT 'pending',
                cover_letter TEXT,
                match_score DECIMAL(5,2),
                notes TEXT,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status_changed_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(job_posting_id, applicant_id)
            );
        """)
        cursor.execute("CREATE INDEX idx_marketplace_applications_job ON marketplace_job_applications(job_posting_id);")
        cursor.execute("CREATE INDEX idx_marketplace_applications_applicant ON marketplace_job_applications(applicant_id);")
        cursor.execute("CREATE INDEX idx_marketplace_applications_status ON marketplace_job_applications(status);")
        cursor.execute("CREATE INDEX idx_marketplace_applications_job_status ON marketplace_job_applications(job_posting_id, status);")
        cursor.execute("CREATE INDEX idx_marketplace_applications_applicant_status ON marketplace_job_applications(applicant_id, status);")
        cursor.execute("CREATE INDEX idx_marketplace_applications_status_date ON marketplace_job_applications(status, applied_at);")
        print("[OK] Created marketplace_job_applications\n")

        print("\n[SUCCESS] All marketplace tables created successfully!")

    except Exception as e:
        print(f"[ERROR] {e}")
        raise

print("\nDone!")
