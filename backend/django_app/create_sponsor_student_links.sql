-- Create sponsor_student_links table to manage sponsor-student relationships
-- This is cleaner than adding sponsor_id to users table

CREATE TABLE sponsor_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_uuid_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
    student_uuid_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(uuid_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(sponsor_uuid_id, student_uuid_id)
);

-- Add indexes for performance
CREATE INDEX sponsor_student_links_sponsor_idx ON sponsor_student_links(sponsor_uuid_id);
CREATE INDEX sponsor_student_links_student_idx ON sponsor_student_links(student_uuid_id);
CREATE INDEX sponsor_student_links_active_idx ON sponsor_student_links(is_active);