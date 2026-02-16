-- Director–mentor messaging: one-on-one messages between program directors and mentors
-- (e.g. student case, change of track). Apply with: psql -f director_mentor_message.sql

-- Table: directormentormessages
CREATE TABLE IF NOT EXISTS directormentormessages (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for list/filter and unread queries
CREATE INDEX IF NOT EXISTS directormen_sender_recipient_created_idx
    ON directormentormessages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS directormen_recipient_is_read_idx
    ON directormentormessages (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS directormen_created_at_idx
    ON directormentormessages (created_at);
CREATE INDEX IF NOT EXISTS directormen_is_read_idx
    ON directormentormessages (is_read);

COMMENT ON TABLE directormentormessages IS 'One-on-one messages between program directors and mentors (e.g. student case, change of track).';
