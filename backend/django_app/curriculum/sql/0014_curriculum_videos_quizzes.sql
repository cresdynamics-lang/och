-- Create curriculum_videos and curriculum_quizzes tables
-- Fixes: relation "curriculum_quizzes" does not exist when deleting a module (CASCADE).
-- Run with: psql -U <user> -d <database> -f 0014_curriculum_videos_quizzes.sql
-- Or execute in your SQL client.

BEGIN;

-- curriculum_videos: video lessons within curriculum modules
CREATE TABLE IF NOT EXISTS curriculum_videos (
    id UUID NOT NULL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    video_url VARCHAR(200) NOT NULL DEFAULT '',
    duration_seconds INTEGER NULL,
    order_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    module_id UUID NOT NULL REFERENCES curriculummodules(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS curriculum_videos_module_slug_uniq
    ON curriculum_videos (module_id, slug);

COMMENT ON TABLE curriculum_videos IS 'Curriculum Video - video lessons within curriculum modules';

-- curriculum_quizzes: quizzes within curriculum modules
CREATE TABLE IF NOT EXISTS curriculum_quizzes (
    id UUID NOT NULL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    pass_threshold INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    module_id UUID NOT NULL REFERENCES curriculummodules(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS curriculum_quizzes_module_slug_uniq
    ON curriculum_quizzes (module_id, slug);

COMMENT ON TABLE curriculum_quizzes IS 'Curriculum Quiz - quizzes within curriculum modules';

COMMIT;
