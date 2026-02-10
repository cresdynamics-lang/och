-- Create all TalentScope tables

-- Create ts_skill_signals table
CREATE TABLE IF NOT EXISTS ts_skill_signals (
    id UUID PRIMARY KEY,
    mentee_id BIGINT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100) NOT NULL,
    mastery_level DECIMAL(5,2) NOT NULL CHECK (mastery_level >= 0 AND mastery_level <= 100),
    hours_practiced DECIMAL(10,2) DEFAULT 0 CHECK (hours_practiced >= 0),
    last_practiced TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) NOT NULL DEFAULT 'mission',
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_skill_signals_mentee 
        FOREIGN KEY (mentee_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skill_signals_mentee ON ts_skill_signals(mentee_id);
CREATE INDEX IF NOT EXISTS idx_skill_signals_skill_name ON ts_skill_signals(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_signals_skill_category ON ts_skill_signals(skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_signals_mentee_category ON ts_skill_signals(mentee_id, skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_signals_mentee_created ON ts_skill_signals(mentee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_skill_signals_name_category ON ts_skill_signals(skill_name, skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_signals_source_id ON ts_skill_signals(source_id);

-- Create ts_behavior_signals table
CREATE TABLE IF NOT EXISTS ts_behavior_signals (
    id UUID PRIMARY KEY,
    mentee_id BIGINT NOT NULL,
    behavior_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    source VARCHAR(50) NOT NULL DEFAULT 'system',
    source_id UUID,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_behavior_signals_mentee 
        FOREIGN KEY (mentee_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_behavior_signals_mentee ON ts_behavior_signals(mentee_id);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_behavior_type ON ts_behavior_signals(behavior_type);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_mentee_type ON ts_behavior_signals(mentee_id, behavior_type);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_mentee_recorded ON ts_behavior_signals(mentee_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_type_recorded ON ts_behavior_signals(behavior_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_behavior_signals_source_id ON ts_behavior_signals(source_id);

-- Create ts_mentor_influence table
CREATE TABLE IF NOT EXISTS ts_mentor_influence (
    id UUID PRIMARY KEY,
    mentee_id BIGINT NOT NULL,
    mentor_id BIGINT,
    session_id UUID,
    submission_rate DECIMAL(5,2) CHECK (submission_rate >= 0 AND submission_rate <= 100),
    code_quality_score DECIMAL(5,2) CHECK (code_quality_score >= 0 AND code_quality_score <= 100),
    mission_completion_rate DECIMAL(5,2) CHECK (mission_completion_rate >= 0 AND mission_completion_rate <= 100),
    performance_score DECIMAL(5,2) CHECK (performance_score >= 0 AND performance_score <= 100),
    influence_index DECIMAL(3,1) CHECK (influence_index >= 0 AND influence_index <= 10),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mentor_influence_mentee 
        FOREIGN KEY (mentee_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_mentor_influence_mentor 
        FOREIGN KEY (mentor_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_influence_mentee ON ts_mentor_influence(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_influence_mentor ON ts_mentor_influence(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_influence_session ON ts_mentor_influence(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_influence_mentee_period ON ts_mentor_influence(mentee_id, period_start);
CREATE INDEX IF NOT EXISTS idx_mentor_influence_mentor_period ON ts_mentor_influence(mentor_id, period_start);
CREATE INDEX IF NOT EXISTS idx_mentor_influence_mentee_mentor ON ts_mentor_influence(mentee_id, mentor_id);

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

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_mentee ON ts_readiness_snapshots(mentee_id);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_mentee_snapshot ON ts_readiness_snapshots(mentee_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_mentee_stage ON ts_readiness_snapshots(mentee_id, career_readiness_stage);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_snapshot_date ON ts_readiness_snapshots(snapshot_date DESC);
