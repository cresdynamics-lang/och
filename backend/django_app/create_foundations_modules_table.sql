-- Create foundations_modules table

CREATE TABLE IF NOT EXISTS foundations_modules (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    module_type VARCHAR(20) DEFAULT 'video' NOT NULL,
    video_url TEXT,
    diagram_url TEXT,
    content TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0 NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
    estimated_minutes INTEGER DEFAULT 10 NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS foundations_modules_order_idx ON foundations_modules("order");
CREATE INDEX IF NOT EXISTS foundations_modules_is_active_idx ON foundations_modules(is_active);
