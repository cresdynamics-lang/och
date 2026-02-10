-- Create the missing messageattachments table used for mentorship message file attachments.
-- Fixes: ProgrammingError - relation "messageattachments" does not exist
-- Run with (PostgreSQL):
--   psql -U your_user -d your_db -f create_messageattachments_table.sql
-- Or from Django:
--   python manage.py dbshell < backend/django_app/create_messageattachments_table.sql

CREATE TABLE IF NOT EXISTS messageattachments (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL,
    file VARCHAR(1000) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic index for faster lookups by message
CREATE INDEX IF NOT EXISTS messageattachments_message_id_idx
    ON messageattachments(message_id);

