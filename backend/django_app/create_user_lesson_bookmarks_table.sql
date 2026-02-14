-- Create user_lesson_bookmarks table

CREATE TABLE IF NOT EXISTS user_lesson_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lesson_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_user_lesson_bookmarks_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_lesson_bookmarks_lesson 
        FOREIGN KEY (lesson_id) 
        REFERENCES lessons(id) 
        ON DELETE CASCADE,
    UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_lesson_bookmarks_user_idx ON user_lesson_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_lesson_bookmarks_lesson_idx ON user_lesson_bookmarks(lesson_id);
CREATE INDEX IF NOT EXISTS user_lesson_bookmarks_created_at_idx ON user_lesson_bookmarks(created_at DESC);
