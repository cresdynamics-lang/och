-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    item_type VARCHAR(50) DEFAULT 'mission',
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'private',
    skill_tags TEXT,
    evidence_files TEXT,
    profiler_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_items_user_status_created_idx ON portfolio_items(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS portfolio_items_profiler_session_idx ON portfolio_items(profiler_session_id);
