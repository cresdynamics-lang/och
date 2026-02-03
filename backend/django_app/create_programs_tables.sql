-- Create programs table directly
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'technical',
    categories JSONB DEFAULT '[]',
    description TEXT DEFAULT '',
    duration_months INTEGER NOT NULL DEFAULT 6,
    default_price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    outcomes JSONB DEFAULT '[]',
    structure JSONB DEFAULT '{}',
    missions_registry_link TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    key VARCHAR(100) NOT NULL,
    track_type VARCHAR(20) DEFAULT 'primary',
    description TEXT DEFAULT '',
    competencies JSONB DEFAULT '{}',
    missions JSONB DEFAULT '[]',
    director_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, key)
);

-- Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    mode VARCHAR(20) DEFAULT 'virtual',
    seat_cap INTEGER NOT NULL DEFAULT 25,
    mentor_ratio DECIMAL(3,2) DEFAULT 0.10,
    calendar_id UUID,
    calendar_template_id UUID,
    seat_pool JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    coordinator_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    org_id UUID,
    enrollment_type VARCHAR(20) DEFAULT 'self',
    seat_type VARCHAR(20) DEFAULT 'paid',
    payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'pending_payment',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(cohort_id, user_id)
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE UNIQUE,
    file_uri TEXT DEFAULT '',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mark migration as applied
INSERT INTO django_migrations (app, name, applied) 
SELECT 'programs', '0001_create_programs', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'programs' AND name = '0001_create_programs'
);