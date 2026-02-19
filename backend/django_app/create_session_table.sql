-- Create django_session table for session management
-- This is required for Django's session framework

CREATE TABLE IF NOT EXISTS django_session (
    session_key VARCHAR(40) NOT NULL PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on expire_date for efficient session cleanup
CREATE INDEX IF NOT EXISTS django_session_expire_date_idx ON django_session (expire_date);

-- Grant permissions (adjust if needed)
-- GRANT ALL PRIVILEGES ON TABLE django_session TO postgres;
