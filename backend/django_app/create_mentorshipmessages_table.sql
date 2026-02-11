-- Create the missing mentorshipmessages table used for in-app mentor/mentee messages.
-- Fixes: ProgrammingError - relation "mentorshipmessages" does not exist
-- Run with (PostgreSQL):
--   psql -U your_user -d your_db -f create_mentorshipmessages_table.sql
-- Or from Django:
--   python manage.py dbshell < backend/django_app/create_mentorshipmessages_table.sql

CREATE TABLE IF NOT EXISTS mentorshipmessages (
    id UUID PRIMARY KEY,
    message_id VARCHAR(100) NOT NULL UNIQUE,
    assignment_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    subject VARCHAR(200) NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes mirroring Django model Meta.indexes and fields with db_index=True
CREATE INDEX IF NOT EXISTS mentorshipmessages_assignment_created_idx
    ON mentorshipmessages(assignment_id, created_at);

CREATE INDEX IF NOT EXISTS mentorshipmessages_sender_recipient_archived_idx
    ON mentorshipmessages(sender_id, recipient_id, archived);

CREATE INDEX IF NOT EXISTS mentorshipmessages_is_read_created_idx
    ON mentorshipmessages(is_read, created_at);

CREATE INDEX IF NOT EXISTS mentorshipmessages_message_id_idx
    ON mentorshipmessages(message_id);

