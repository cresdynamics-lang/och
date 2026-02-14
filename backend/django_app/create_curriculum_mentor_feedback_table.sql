-- Create curriculum_mentor_feedback table

CREATE TABLE IF NOT EXISTS curriculum_mentor_feedback (
    id SERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    learner_id BIGINT NOT NULL,
    lesson_id UUID,
    module_id UUID,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_curriculum_mentor_feedback_mentor 
        FOREIGN KEY (mentor_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_curriculum_mentor_feedback_learner 
        FOREIGN KEY (learner_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_curriculum_mentor_feedback_lesson 
        FOREIGN KEY (lesson_id) 
        REFERENCES lessons(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_curriculum_mentor_feedback_module 
        FOREIGN KEY (module_id) 
        REFERENCES curriculummodules(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS curriculum_mentor_feedback_mentor_idx ON curriculum_mentor_feedback(mentor_id);
CREATE INDEX IF NOT EXISTS curriculum_mentor_feedback_learner_lesson_idx ON curriculum_mentor_feedback(learner_id, lesson_id);
CREATE INDEX IF NOT EXISTS curriculum_mentor_feedback_learner_module_idx ON curriculum_mentor_feedback(learner_id, module_id);
