-- Migration: Add registration deadline to events
-- This adds a column to store when registration closes for an event

-- Add registration deadline column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the field
COMMENT ON COLUMN events.registration_deadline IS 'The date and time when registration closes for this event';
