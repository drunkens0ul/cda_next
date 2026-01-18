-- Fix Quiz Responses Unique Constraint for Progressive Submission
-- Adds partial unique index to prevent duplicate answers per question within an attempt
-- Created: 2026-01-18

-- ============================================================================
-- ADD PARTIAL UNIQUE INDEX
-- Prevents duplicate answers per question within an attempt
-- Only applies when attempt_id IS NOT NULL (backward compatible)
-- ============================================================================
CREATE UNIQUE INDEX idx_quiz_responses_attempt_question_unique
ON quiz_responses (attempt_id, question_id)
WHERE attempt_id IS NOT NULL;

COMMENT ON INDEX idx_quiz_responses_attempt_question_unique IS
'Ensures unique (attempt_id, question_id) for progressive submission answers - prevents re-submission of same question';
