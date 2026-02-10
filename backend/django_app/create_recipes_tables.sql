-- Create recipes tables if they don't exist

BEGIN;

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner',
    estimated_time_minutes INTEGER NOT NULL DEFAULT 30,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    expected_outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    troubleshooting_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_recipes JSONB NOT NULL DEFAULT '[]'::jsonb,
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_free_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipes_slug_idx ON recipes(slug);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes(category);
CREATE INDEX IF NOT EXISTS recipes_is_active_idx ON recipes(is_active);
CREATE INDEX IF NOT EXISTS recipes_created_by_idx ON recipes(created_by_id);

-- Create recipe_sources table
CREATE TABLE IF NOT EXISTS recipe_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_url VARCHAR(500) NOT NULL DEFAULT '',
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipe_sources_recipe_idx ON recipe_sources(recipe_id);

-- Create recipe_notifications table
CREATE TABLE IF NOT EXISTS recipe_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipe_notifications_user_idx ON recipe_notifications(user_id);
CREATE INDEX IF NOT EXISTS recipe_notifications_recipe_idx ON recipe_notifications(recipe_id);

-- Create recipe_llm_jobs table
CREATE TABLE IF NOT EXISTS recipe_llm_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NULL REFERENCES recipes(id) ON DELETE SET NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS recipe_llm_jobs_user_idx ON recipe_llm_jobs(user_id);
CREATE INDEX IF NOT EXISTS recipe_llm_jobs_status_idx ON recipe_llm_jobs(status);

COMMIT;
