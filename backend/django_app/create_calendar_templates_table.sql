-- Create the missing calendar_templates table
CREATE TABLE IF NOT EXISTS calendar_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL,
    track_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
    events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS calendar_templates_program_id_idx ON calendar_templates(program_id);
CREATE INDEX IF NOT EXISTS calendar_templates_track_id_idx ON calendar_templates(track_id);
CREATE INDEX IF NOT EXISTS calendar_templates_created_at_idx ON calendar_templates(created_at);