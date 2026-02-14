-- Create curriculum_videos table

CREATE TABLE IF NOT EXISTS curriculum_videos (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    duration_seconds INTEGER,
    order_number INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_curriculum_videos_module 
        FOREIGN KEY (module_id) 
        REFERENCES curriculummodules(id) 
        ON DELETE CASCADE,
    UNIQUE (module_id, slug)
);

CREATE INDEX IF NOT EXISTS curriculum_videos_module_order_idx ON curriculum_videos(module_id, order_number);
