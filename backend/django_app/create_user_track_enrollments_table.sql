-- Create user_track_enrollments table

CREATE TABLE IF NOT EXISTS user_track_enrollments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    track_id UUID NOT NULL,
    current_level_slug VARCHAR(50) DEFAULT 'beginner' NOT NULL,
    progress_percent DECIMAL(5,2) DEFAULT 0 NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_user_track_enrollments_track 
        FOREIGN KEY (track_id) 
        REFERENCES curriculum_tracks(id) 
        ON DELETE CASCADE,
    UNIQUE (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS user_track_enrollments_user_track_idx ON user_track_enrollments(user_id, track_id);
CREATE INDEX IF NOT EXISTS user_track_enrollments_enrolled_at_idx ON user_track_enrollments(enrolled_at DESC);
