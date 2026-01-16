# UTC Time Migration Guide

## Overview
This document explains the UTC time handling implementation and how to handle existing events created before this change.

## Implementation Date
January 15, 2026

## Problem Statement
Before this implementation, the application did not explicitly handle timezones:
- Events were created with date/time strings in the admin's local timezone
- Times were displayed in browser's timezone without proper UTC conversion
- Database `TIMESTAMP WITH TIME ZONE` columns used server's local timezone (not UTC)

## Solution
1. **Database**: All timestamps now explicitly use UTC
2. **Backend**: All date/time inputs are converted to UTC before storage
3. **Frontend**: All times are displayed in user's local timezone using browser's timezone

## Changes Made

### Database Schema Updates
- **Events table**: Changed `start_time` and `end_time` from `TIME` to `TIME WITH TIME ZONE`
- This ensures timezone-aware time storage (e.g., '05:00:00+00' for UTC)
- Seed data updated with UTC times for Dubai-based events

### Database Layer
- Updated `lib/db.ts` to set `options: '-c timezone=UTC'` in PostgreSQL pool configuration
- Ensures `NOW()`, `CURRENT_TIMESTAMP` always return UTC time
- Updated events table to use `TIME WITH TIME ZONE` for start_time and end_time columns
- This ensures explicit timezone context for event times

### Backend Utilities
- Created `lib/time.ts` with UTC conversion functions:
  - `toUTCDateTime()`: Convert local date+time to UTC timestamp
  - `toLocalTimeString()`: Convert UTC timestamp to local time string
  - `formatDateTimeLocal()`: Format datetime for form inputs
  - `formatDateTimeDisplay()`: Format datetime for display

### Type Definitions
- Updated `CreateEventData` and `UpdateEventData` to include optional `timezoneOffset` field

### API Routes
- `/api/admin/events` now accepts `timezoneOffset` (in minutes) from frontend
- Converts local date/time to UTC before storing in database

### Frontend Components
- Admin forms capture `timezoneOffset` from `new Date().getTimezoneOffset()`
- All display components use `formatDateTimeDisplay()` which properly handles UTC to local conversion
- Countdown timers calculate differences using UTC timestamps

## Existing Events

### Current State
As of January 15, 2026, the application contains only test events.

### Issues with Existing Events
Existing events created before UTC implementation may have:
1. Date/time stored without explicit timezone context
2. Times may display incorrectly for users in different timezones

### Handling Existing Events

### Database Migration for Existing Deployments

If you have an existing database, you need to update the events table columns to `TIME WITH TIME ZONE`:

```sql
-- Backup existing events first
CREATE TABLE events_backup AS SELECT * FROM events;

-- Update column types
ALTER TABLE events
ALTER COLUMN start_time TYPE TIME WITH TIME ZONE,
ALTER COLUMN end_time TYPE TIME WITH TIME ZONE;

-- Verify the migration
SELECT id, title, start_time, end_time
FROM events
LIMIT 5;
```

**Important Note**: After updating column types, existing time values will be interpreted according to your PostgreSQL timezone setting. Since we set `options: '-c timezone=UTC'` in `lib/db.ts`, the times will be treated as UTC.

If your old events were created in a different timezone (e.g., Dubai UTC+4 with times like '09:00:00'), these will now be treated as UTC times (09:00 UTC instead of 05:00 UTC), causing events to display incorrectly.

**Recommended approach for existing events**:
1. Delete existing test events
2. Recreate them using the new UTC-aware forms
3. Or manually adjust times using SQL (see example below)

```sql
-- Example: If old events were created in Dubai (UTC+4), adjust times to UTC
-- This converts 09:00:00 (Dubai time) to 05:00:00 (UTC)
UPDATE events
SET start_time = (start_time - INTERVAL '4 hours')::time with time zone,
    end_time = (end_time - INTERVAL '4 hours')::time with time zone
WHERE is_deleted = FALSE
  AND start_time NOT LIKE '%+%'  -- Only update old format times
  AND created_at < '2026-01-15 00:00:00+00';
```

**Frontend Compatibility**: The code has been updated to handle both old `TIME` format (e.g., '09:00:00') and new `TIME WITH TIME ZONE` format (e.g., '05:00:00+00') for backward compatibility during migration.

**Important**: After updating the column types, the existing time values will be interpreted according to your PostgreSQL timezone setting. Since we set `options: '-c timezone=UTC'` in `lib/db.ts`, the times will be treated as UTC.

#### Option 1: Recreate Events (Recommended for Production)
Since only test events exist, the simplest approach is:
1. Delete all existing events
2. Recreate them using the new UTC-aware forms

**SQL Query**:
```sql
-- View existing events before deletion
SELECT id, title, date, start_time, end_time, created_at 
FROM events 
WHERE is_deleted = FALSE;

-- Delete all existing events (they will be recreated with proper UTC handling)
DELETE FROM event_registrations WHERE is_deleted = FALSE;
DELETE FROM events WHERE is_deleted = FALSE;
```

#### Option 2: Manual Timezone Adjustment (If Events Must Be Preserved)
If events cannot be deleted, manually adjust timestamps:

1. Determine the timezone where events were created
2. Calculate offset from UTC
3. Update timestamps in database

**Example: If events were created in EST (UTC-5)**:
```sql
-- Update event dates/times assuming they were created in EST
UPDATE events
SET date = date + INTERVAL '5 hours'
WHERE is_deleted = FALSE;
```

**Note**: This is a rough approach. For production data, use proper timezone conversion functions.

#### Option 3: Frontend Timezone Fallback (For Display Only)
Add a "created_timezone" column to events table to preserve the original timezone context:

**SQL Migration**:
```sql
-- Add timezone column
ALTER TABLE events
ADD COLUMN created_timezone VARCHAR(50) DEFAULT 'UTC';

-- For existing events, set a default (requires manual knowledge of creator's timezone)
UPDATE events
SET created_timezone = 'America/New_York'  -- Adjust based on actual timezone
WHERE is_deleted = FALSE
  AND created_timezone = 'UTC'
  AND created_at < '2026-01-15 00:00:00';
```

Then update display logic to use this timezone when formatting.

## Recommended Action for Current State

**Since these are test events only**, use Option 1:
1. Delete all existing events via admin panel or SQL
2. Recreate events using the updated UTC-aware forms
3. Verify events display correctly for users in different timezones

## Testing After Migration

### Test Scenarios
1. **Admin in EST (UTC-5) creates event for 9:00 AM EST**
   - Database stores: 14:00:00 UTC
   - User in PST (UTC-8) sees: 6:00 AM PST

2. **Admin in Dubai (UTC+4) creates event for 15:00 Dubai time**
   - Database stores: 11:00:00 UTC
   - User in London (UTC+0) sees: 11:00 AM London time

3. **Event spanning DST boundary**
   - Created before DST starts
   - Displayed correctly after DST change
   - JavaScript Date object handles automatically

4. **Countdown timer**
   - Calculates difference in UTC
   - Updates correctly in all timezones

### Verification Queries
```sql
-- Check that timestamps are in UTC
SELECT
  id,
  title,
  date,
  start_time,
  end_time,
  created_at,
  updated_at,
  created_at AT TIME ZONE 'UTC' as utc_time
FROM events
WHERE is_deleted = FALSE
LIMIT 5;

-- Verify TIME WITH TIME ZONE columns store UTC
SELECT
  id,
  title,
  start_time,
  start_time AT TIME ZONE 'UTC' as utc_start,
  end_time AT TIME ZONE 'UTC' as utc_end
FROM events
WHERE is_deleted = FALSE
LIMIT 5;

-- Verify NOW() returns UTC
SELECT NOW(), NOW() AT TIME ZONE 'UTC' as utc_now;
```

## Rollback Plan

If issues arise, rollback can be done by:
1. Revert `lib/db.ts` timezone setting
2. Revert frontend timezone capture logic
3. Restore database from backup

## Contact
For questions about this migration, contact the development team.
