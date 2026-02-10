-- Create mission_artifacts table

CREATE TABLE IF NOT EXISTS mission_artifacts (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'other',
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mission_artifacts_submission 
        FOREIGN KEY (submission_id) 
        REFERENCES mission_submissions(id) 
        ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mission_artifacts_submission 
    ON mission_artifacts(submission_id);

CREATE INDEX IF NOT EXISTS idx_mission_artifacts_uploaded_at 
    ON mission_artifacts(uploaded_at DESC);
