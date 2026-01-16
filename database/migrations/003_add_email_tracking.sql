-- Migration: Add email tracking to event_registrations
-- This adds a column to track when confirmation emails were sent

-- Add email tracking column
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying registrations without emails sent
CREATE INDEX IF NOT EXISTS idx_registrations_email_pending
ON event_registrations (event_id, confirmation_email_sent_at)
WHERE is_deleted = FALSE AND confirmation_email_sent_at IS NULL;
