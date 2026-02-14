-- Create cohort_progress table

CREATE TABLE IF NOT EXISTS cohort_progress (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cohort_id UUID,
    percentage REAL NOT NULL DEFAULT 0.0,
    current_module VARCHAR(255),
    total_modules INTEGER NOT NULL DEFAULT 0,
    completed_modules INTEGER NOT NULL DEFAULT 0,
    estimated_time_remaining INTEGER NOT NULL DEFAULT 0,
    graduation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cohort_progress_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_progress_user_cohort 
    ON cohort_progress(user_id, cohort_id);
