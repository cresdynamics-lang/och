-- Create profiler tables

CREATE TABLE IF NOT EXISTS profilersessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    status VARCHAR(30) DEFAULT 'started',
    session_token VARCHAR(64) UNIQUE,
    current_section VARCHAR(50) DEFAULT 'welcome',
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    aptitude_responses JSONB DEFAULT '{}'::jsonb,
    behavioral_responses JSONB DEFAULT '{}'::jsonb,
    current_self_assessment JSONB DEFAULT '{}'::jsonb,
    futureyou_persona JSONB DEFAULT '{}'::jsonb,
    aptitude_score DECIMAL(5,2),
    behavioral_profile JSONB DEFAULT '{}'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    recommended_track_id UUID,
    track_confidence DECIMAL(4,2),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP WITH TIME ZONE,
    admin_reset_by_id VARCHAR(36)
);

CREATE TABLE IF NOT EXISTS profilerquestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type VARCHAR(20) NOT NULL,
    answer_type VARCHAR(20) NOT NULL,
    question_text TEXT NOT NULL,
    question_order INTEGER DEFAULT 0,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer JSONB,
    points INTEGER DEFAULT 1,
    category VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profileranswers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    question_id UUID,
    question_key VARCHAR(255) NOT NULL,
    answer JSONB NOT NULL,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

CREATE TABLE IF NOT EXISTS profilerresults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    aptitude_score DECIMAL(5,2) NOT NULL,
    behavioral_score DECIMAL(5,2) NOT NULL,
    aptitude_breakdown JSONB DEFAULT '{}'::jsonb,
    behavioral_traits JSONB DEFAULT '{}'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    areas_for_growth JSONB DEFAULT '[]'::jsonb,
    recommended_tracks JSONB DEFAULT '[]'::jsonb,
    learning_path_suggestions JSONB DEFAULT '[]'::jsonb,
    och_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS profilersessions_user_status_idx ON profilersessions(user_id, status);
CREATE INDEX IF NOT EXISTS profilersessions_user_locked_idx ON profilersessions(user_id, is_locked);
CREATE INDEX IF NOT EXISTS profilersessions_token_idx ON profilersessions(session_token);
CREATE INDEX IF NOT EXISTS profilerquestions_type_active_idx ON profilerquestions(question_type, is_active);
CREATE INDEX IF NOT EXISTS profilerquestions_category_idx ON profilerquestions(category);
CREATE INDEX IF NOT EXISTS profileranswers_session_question_idx ON profileranswers(session_id, question_id);
CREATE INDEX IF NOT EXISTS profileranswers_session_key_idx ON profileranswers(session_id, question_key);
CREATE INDEX IF NOT EXISTS profilerresults_user_idx ON profilerresults(user_id);
CREATE INDEX IF NOT EXISTS profilerresults_session_idx ON profilerresults(session_id);
