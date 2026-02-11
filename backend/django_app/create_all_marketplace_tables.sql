-- Create all marketplace tables

-- marketplace_employers
CREATE TABLE IF NOT EXISTS marketplace_employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(200),
    sector VARCHAR(255),
    country VARCHAR(100),
    logo_url VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- marketplace_profiles
CREATE TABLE IF NOT EXISTS marketplace_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentee_id VARCHAR(36) NOT NULL UNIQUE,
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
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- marketplace_job_postings
CREATE TABLE IF NOT EXISTS marketplace_job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    job_type VARCHAR(32),
    description TEXT NOT NULL,
    required_skills JSONB DEFAULT '[]'::jsonb,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_deadline TIMESTAMP WITH TIME ZONE
);

-- marketplace_employer_interest_logs
CREATE TABLE IF NOT EXISTS marketplace_employer_interest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    action VARCHAR(32) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- marketplace_job_applications
CREATE TABLE IF NOT EXISTS marketplace_job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL,
    applicant_id VARCHAR(36) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    cover_letter TEXT,
    match_score DECIMAL(5,2),
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_changed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(job_posting_id, applicant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS marketplace_employers_company_name_idx ON marketplace_employers(company_name);
CREATE INDEX IF NOT EXISTS marketplace_employers_user_id_idx ON marketplace_employers(user_id);

CREATE INDEX IF NOT EXISTS marketplace_profiles_profile_status_idx ON marketplace_profiles(profile_status);
CREATE INDEX IF NOT EXISTS marketplace_profiles_tier_visible_idx ON marketplace_profiles(tier, is_visible);
CREATE INDEX IF NOT EXISTS marketplace_profiles_mentee_id_idx ON marketplace_profiles(mentee_id);

CREATE INDEX IF NOT EXISTS marketplace_job_postings_active_posted_idx ON marketplace_job_postings(is_active, posted_at);
CREATE INDEX IF NOT EXISTS marketplace_job_postings_employer_id_idx ON marketplace_job_postings(employer_id);

CREATE INDEX IF NOT EXISTS marketplace_interest_employer_action_idx ON marketplace_employer_interest_logs(employer_id, action);
CREATE INDEX IF NOT EXISTS marketplace_interest_profile_action_idx ON marketplace_employer_interest_logs(profile_id, action);

CREATE INDEX IF NOT EXISTS marketplace_applications_job_status_idx ON marketplace_job_applications(job_posting_id, status);
CREATE INDEX IF NOT EXISTS marketplace_applications_applicant_status_idx ON marketplace_job_applications(applicant_id, status);
CREATE INDEX IF NOT EXISTS marketplace_applications_status_applied_idx ON marketplace_job_applications(status, applied_at);
