-- Quiz Progressive Submission Migration
-- Adds support for tracking quiz attempts with activity time and progressive answer submission
-- Created: 2026-01-18

-- ============================================================================
-- QUIZ ATTEMPTS TABLE
-- Tracks active quiz sessions with activity time tracking
-- ============================================================================
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_question_index INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_active_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, user_id, is_completed)
);

CREATE INDEX idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id, is_completed);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_is_deleted ON quiz_attempts(is_deleted);
CREATE INDEX idx_quiz_attempts_is_completed ON quiz_attempts(is_completed);

COMMENT ON TABLE quiz_attempts IS 'Active quiz sessions with activity time tracking';
COMMENT ON COLUMN quiz_attempts.current_question_index IS 'Current question user is on (0-indexed)';
COMMENT ON COLUMN quiz_attempts.last_activity_at IS 'Last time user was active on quiz';
COMMENT ON COLUMN quiz_attempts.total_active_seconds IS 'Total time user spent on quiz (seconds)';

-- ============================================================================
-- MODIFY QUIZ RESPONSES TABLE
-- Add attempt_id to link responses to attempts before final submission
-- ============================================================================
ALTER TABLE quiz_responses 
ADD COLUMN attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_quiz_responses_submission_id;

CREATE INDEX idx_quiz_responses_submission_id ON quiz_responses(submission_id);
CREATE INDEX idx_quiz_responses_attempt_id ON quiz_responses(attempt_id);

COMMENT ON COLUMN quiz_responses.attempt_id IS 'Links to quiz attempt before final submission';

-- ============================================================================
-- MODIFY QUIZ SUBMISSIONS TABLE
-- Add attempt_id to link final submission to attempt
-- ============================================================================
ALTER TABLE quiz_submissions 
ADD COLUMN attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL;

CREATE INDEX idx_quiz_submissions_attempt_id ON quiz_submissions(attempt_id);

COMMENT ON COLUMN quiz_submissions.attempt_id IS 'Links to the quiz attempt that produced this submission';

-- ============================================================================
-- ACTIVITY TIME TRACKING TRIGGER
-- Automatically calculates active time based on activity updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_attempt_active_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate time elapsed since last activity and add to total
    IF OLD.last_activity_at IS NOT NULL AND NEW.last_activity_at != OLD.last_activity_at THEN
        NEW.total_active_seconds := NEW.total_active_seconds + 
            EXTRACT(EPOCH FROM (NEW.last_activity_at - OLD.last_activity_at))::INTEGER;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_attempts_active_time
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_attempt_active_time();

COMMENT ON FUNCTION update_attempt_active_time() IS 'Calculates active time based on activity updates';

-- ============================================================================
-- MIGRATE EXISTING SUBMISSIONS (OPTIONAL)
-- If you want to link existing submissions to attempts, uncomment below
-- ============================================================================
-- INSERT INTO quiz_attempts (quiz_id, user_id, current_question_index, started_at, last_activity_at, total_active_seconds, is_completed)
-- SELECT 
--     quiz_id, 
--     user_id, 
--     (SELECT COUNT(*) FROM quiz_responses qr WHERE qr.submission_id = qs.id) as current_question_index,
--     submitted_at - (session_duration_seconds || ' seconds')::INTERVAL as started_at,
--     submitted_at,
--     COALESCE(session_duration_seconds, 0),
--     TRUE
-- FROM quiz_submissions qs
-- WHERE NOT EXISTS (
--     SELECT 1 FROM quiz_attempts qa 
--     WHERE qa.quiz_id = qs.quiz_id 
--     AND qa.user_id = qs.user_id 
--     AND qa.is_completed = TRUE
-- );
-- 
-- UPDATE quiz_submissions SET attempt_id = (
--     SELECT id FROM quiz_attempts 
--     WHERE quiz_attempts.quiz_id = quiz_submissions.quiz_id 
--     AND quiz_attempts.user_id = quiz_submissions.user_id 
--     AND quiz_attempts.is_completed = TRUE 
--     AND quiz_attempts.started_at = (quiz_submissions.submitted_at - (COALESCE(quiz_submissions.session_duration_seconds, 0) || ' seconds')::INTERVAL)
--     LIMIT 1
-- );
