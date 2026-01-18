-- Fix Quiz Progressive Submission Schema
-- Addresses issues with the progressive submission system
-- Created: 2026-01-18
--
-- Issues being fixed:
-- 1. quiz_responses.submission_id is NOT NULL but we need it NULL for in-progress attempts
-- 2. quiz_attempts unique constraint is too restrictive
-- 3. Activity time tracking trigger adds offline time when user returns
--
-- The goal: Track ACTIVE time spent in the app, allowing resume after leaving

-- ============================================================================
-- DROP EXISTING PROBLEMATIC CONSTRAINTS AND TRIGGERS
-- ============================================================================

-- Drop the problematic trigger that incorrectly calculates time
DROP TRIGGER IF EXISTS update_quiz_attempts_active_time ON quiz_attempts;
DROP FUNCTION IF EXISTS update_attempt_active_time();

-- Drop the problematic unique constraint on quiz_attempts
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_user_id_is_completed_key;

-- Drop the partial unique index on quiz_responses that may cause issues
DROP INDEX IF EXISTS idx_quiz_responses_attempt_question_unique;

-- ============================================================================
-- FIX QUIZ_RESPONSES TABLE
-- Allow NULL submission_id for in-progress responses
-- ============================================================================

-- Make submission_id nullable (it will be set when attempt is finalized)
ALTER TABLE quiz_responses ALTER COLUMN submission_id DROP NOT NULL;

-- ============================================================================
-- FIX QUIZ_ATTEMPTS TABLE
-- Create proper unique constraint: only one incomplete attempt per user per quiz
-- ============================================================================

-- Add partial unique index: user can only have ONE incomplete attempt per quiz
-- Completed attempts don't need to be unique (for future: allow multiple completions)
CREATE UNIQUE INDEX idx_quiz_attempts_unique_incomplete 
ON quiz_attempts (quiz_id, user_id) 
WHERE is_completed = FALSE AND is_deleted = FALSE;

-- Add index for efficient lookup of incomplete attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lookup 
ON quiz_attempts (user_id, quiz_id, is_completed, is_deleted);

-- ============================================================================
-- RECREATE QUIZ_RESPONSES CONSTRAINT
-- Allow only one answer per question per attempt
-- ============================================================================

-- Create unique constraint: one answer per question per attempt
CREATE UNIQUE INDEX idx_quiz_responses_attempt_question 
ON quiz_responses (attempt_id, question_id) 
WHERE attempt_id IS NOT NULL AND is_deleted = FALSE;

-- ============================================================================
-- ADD COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON INDEX idx_quiz_attempts_unique_incomplete IS 
'Ensures user has at most one incomplete attempt per quiz';

COMMENT ON INDEX idx_quiz_responses_attempt_question IS 
'Ensures one answer per question within an attempt (progressive submission)';

-- ============================================================================
-- NOTES ON ACTIVITY TIME TRACKING
-- ============================================================================
-- Activity time is now calculated in application code:
-- - Frontend sends periodic heartbeats (e.g., every 30 seconds) when user is active
-- - Each heartbeat adds a fixed amount (e.g., 30 seconds) to total_active_seconds
-- - If user leaves and comes back, only active time gets counted
-- - The update_quiz_attempt_activity() function in lib/quiz.ts handles this
--
-- Example flow:
-- 1. User starts quiz at 10:00 (total_active_seconds = 0)
-- 2. Frontend sends heartbeat every 30s while user is active
-- 3. User leaves at 10:05 (total_active_seconds = 300)
-- 4. User returns at 10:07, resumes
-- 5. User completes at 10:10 (total_active_seconds = 480)
-- 6. Total tracked time: 8 minutes (300s + 180s = 480s)

