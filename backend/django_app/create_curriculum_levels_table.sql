-- Create curriculum_levels table

CREATE TABLE IF NOT EXISTS curriculum_levels (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL,
    slug VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    order_number INTEGER DEFAULT 0 NOT NULL,
    estimated_duration_hours INTEGER,
    prerequisites JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_curriculum_levels_track 
        FOREIGN KEY (track_id) 
        REFERENCES curriculum_tracks(id) 
        ON DELETE CASCADE,
    UNIQUE (track_id, slug)
);

CREATE INDEX IF NOT EXISTS curriculum_levels_track_order_idx ON curriculum_levels(track_id, order_number);
