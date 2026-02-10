-- Create ts_readiness_snapshots table

CREATE TABLE IF NOT EXISTS ts_readiness_snapshots (
    id UUID PRIMARY KEY,
    mentee_id BIGINT NOT NULL,
    core_readiness_score DECIMAL(5,2) NOT NULL CHECK (core_readiness_score >= 0 AND core_readiness_score <= 100),
    estimated_readiness_window VARCHAR(50),
    learning_velocity DECIMAL(10,2) CHECK (learning_velocity >= 0),
    career_readiness_stage VARCHAR(20) NOT NULL DEFAULT 'exploring',
    job_fit_score DECIMAL(5,2) CHECK (job_fit_score >= 0 AND job_fit_score <= 100),
    hiring_timeline_prediction VARCHAR(50),
    breakdown JSONB DEFAULT '{}'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    improvement_plan JSONB DEFAULT '[]'::jsonb,
    track_benchmarks JSONB DEFAULT '{}'::jsonb,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_readiness_snapshots_mentee 
        FOREIGN KEY (mentee_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_mentee_snapshot 
    ON ts_readiness_snapshots(mentee_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_mentee_stage 
    ON ts_readiness_snapshots(mentee_id, career_readiness_stage);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_snapshot_date 
    ON ts_readiness_snapshots(snapshot_date DESC);
