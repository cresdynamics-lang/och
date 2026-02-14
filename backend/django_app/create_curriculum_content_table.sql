-- Create curriculum_content table

CREATE TABLE IF NOT EXISTS curriculum_content (
    id UUID PRIMARY KEY,
    module_id UUID NOT NULL,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(10) NOT NULL,
    video_url TEXT,
    quiz_data JSONB,
    duration_seconds INTEGER,
    order_number INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_curriculum_content_module 
        FOREIGN KEY (module_id) 
        REFERENCES curriculummodules(id) 
        ON DELETE CASCADE,
    UNIQUE (module_id, slug)
);

CREATE INDEX IF NOT EXISTS curriculum_content_module_order_idx ON curriculum_content(module_id, order_number);
