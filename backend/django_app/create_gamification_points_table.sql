-- Create gamification_points table

CREATE TABLE IF NOT EXISTS gamification_points (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    points INTEGER DEFAULT 0 NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL,
    badges INTEGER DEFAULT 0 NOT NULL,
    rank VARCHAR(50) DEFAULT '',
    level VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_gamification_points_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(uuid_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS gamification_points_user_points_idx ON gamification_points(user_id, points DESC);
