-- Create marketplace_employers table without FK constraint
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

CREATE INDEX IF NOT EXISTS marketplace_employers_company_name_idx ON marketplace_employers(company_name);
CREATE INDEX IF NOT EXISTS marketplace_employers_user_id_idx ON marketplace_employers(user_id);
