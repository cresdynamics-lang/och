-- Create readiness_scores table

CREATE TABLE IF NOT EXISTS readiness_scores (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 100,
    trend REAL NOT NULL DEFAULT 0.0,
    trend_direction VARCHAR(10) NOT NULL DEFAULT 'stable',
    countdown_days INTEGER NOT NULL DEFAULT 0,
    countdown_label VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_readiness_scores_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_user_updated 
    ON readiness_scores(user_id, updated_at DESC);
