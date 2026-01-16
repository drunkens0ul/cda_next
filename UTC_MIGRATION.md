# UTC Time Migration

## Overview

This document outlines the timezone handling implementation for the CDA application and provides test scenarios to verify correct behavior.

## Architecture

### Database Layer
- **events table**: Uses `DATE` type for dates and `TIME WITH TIME ZONE` for times
- **Storage**: All timestamps are stored in UTC format
- **Format**: Times stored as `HH:MM:SS+00` (e.g., `05:00:00+00` for UTC time)

### Application Layer
- **Frontend**: Displays times in user's local timezone based on browser settings
- **Timezone Offset**: Uses `new Date().getTimezoneOffset()` to determine user's timezone
  - Returns minutes to ADD to local time to get UTC
  - Example: Dubai (UTC+4) = -240 minutes, EST (UTC-5) = +300 minutes

### Utilities (lib/time.ts)

1. **toUTCDateTime(dateStr, timeStr, timezoneOffset)**
   - Converts local date/time to UTC timestamp for database storage
   - Used in: Admin event creation/editing

2. **toLocalTimeString(utcDate, timezoneOffset)**
   - Converts UTC time back to local time string for form inputs
   - Used in: Admin edit forms

3. **toLocalDateString(utcDate, timezoneOffset)**
   - Converts UTC date back to local date string for form inputs
   - Used in: Admin edit forms

4. **combineDateAndTime(dateStr, timeStr)**
   - Combines database DATE + TIME WITH TIME ZONE into a single Date object
   - Properly handles timezone-aware time strings
   - Used in: All time display and calculation logic

5. **formatEventTime(date, timeStr, locale)**
   - Unified utility for displaying event times in user's locale
   - Used in: Events list, Event details, Dashboard, Join Movement

6. **getDaysUntilEvent(date, timeStr)**
   - Calculates days remaining until an event
   - Used in: Dashboard for countdown display

## Bug Fixes Applied

### 1. Fixed toUTCDateTime
**Before**: Created date as UTC, then added offset incorrectly
**After**: Parses date parts as local, creates proper local date, subtracts offset to get UTC

### 2. Fixed toLocalTimeString/toLocalDateString
**Before**: Subtracted offset (wrong direction)
**After**: Adds offset to convert UTC to local

### 3. Fixed combineDateAndTime
**Before**: Treated timezone-aware time as UTC hours/minutes
**After**: Properly extracts timezone offset and adjusts UTC hours accordingly

### 3b. Fixed combineDateAndTime ISO String Handling (2026-01-15)
**Before**: When date came as full ISO string from JSON (e.g., `"2026-01-16T00:00:00.000Z"`), it was used directly, causing invalid dates when concatenated with time
**After**: Now properly extracts just the date portion (`YYYY-MM-DD`) from full ISO strings before combining with time

### 4. Added formatEventTime
Unified time display across all components, eliminating duplicated custom implementations

### 5. Fixed date comparisons
Updated dashboard to use UTC dates consistently for upcoming/past filtering. Now compares dates at start of day in UTC to avoid timezone edge cases.

## Test Scenarios

### Scenario 1: Event Creation in Dubai (UTC+4)
**Setup**: Admin creates event with these inputs in Dubai timezone:
- Date: 2026-01-15
- Start Time: 09:00
- End Time: 17:00

**Expected Database Storage**:
- date: 2026-01-15
- start_time: 05:00:00+00 (9:00 Dubai - 4 hours = 5:00 UTC)
- end_time: 13:00:00+00 (17:00 Dubai - 4 hours = 13:00 UTC)

**Verification**:
```sql
SELECT title, date, start_time, end_time 
FROM events 
WHERE slug = 'test-dubai-event';
```

**Expected Display**:
- Dubai user (UTC+4): 09:00 - 17:00
- EST user (UTC-5): 01:00 - 09:00
- UTC user: 05:00 - 13:00

---

### Scenario 2: Event Viewing Across Timezones
**Setup**: Event stored in database:
- date: 2026-02-20
- start_time: 10:00:00+00
- end_time: 18:00:00+00

**Expected Display**:
- Dubai (UTC+4): 14:00 - 22:00
- London (UTC+0): 10:00 - 18:00
- EST (UTC-5): 05:00 - 13:00
- Tokyo (UTC+9): 19:00 - 03:00 (next day)

**Test Steps**:
1. Open browser in each timezone (use browser dev tools or system settings)
2. Navigate to event detail page
3. Verify displayed time matches expected local time
4. Verify date display is correct (especially for Tokyo crossing day boundary)

---

### Scenario 3: Admin Event Editing
**Setup**: Admin in New York (UTC-5) edits an existing event:
- Original: date=2026-03-01, start_time=06:00:00+00
- Admin changes start_time to 08:00:00+00 (in local form)

**Expected Behavior**:
- Form shows: 08:00 (converted to UTC for display)
- On save: Converts to UTC (08:00 EST = 13:00 UTC)
- Database stores: start_time=13:00:00+00

**Verification**:
```bash
# Query database after edit
SELECT start_time FROM events WHERE slug = 'test-edit';
# Should show: 13:00:00+00
```

---

### Scenario 4: Dashboard Date Filtering
**Setup**: User with registrations:
- Event A: 2026-01-15, 10:00:00+00 (future)
- Event B: 2026-01-10, 10:00:00+00 (past)
- Current date: 2026-01-14

**Expected Behavior**:
- Upcoming tab: Shows Event A
- Past tab: Shows Event B
- Days to event for Event A: 1 day

**Verification**:
1. Login as user
2. Open dashboard
3. Check "Upcoming" tab - should show Event A only
4. Check "Past" tab - should show Event B only
5. Check days display for Event A - should show "1"

---

### Scenario 5: Join Movement Countdown
**Setup**: Featured event:
- date: 2026-01-20
- start_time: 05:00:00+00
- Current time: 2026-01-15 00:00:00 UTC

**Expected Countdown**:
- Days: 5
- Hours: 5
- Minutes: 0
- Seconds: 0 (decrementing)

**Verification**:
1. Open homepage
2. Check "Join Movement" section
3. Verify countdown shows correct values
4. Wait 1 minute - verify countdown decreases correctly

---

### Scenario 6: Events Without Time Specified
**Setup**: Event with null startTime/endTime:
- date: 2026-01-25
- start_time: null
- end_time: null

**Expected Behavior**:
- Display shows only date (no time)
- Dashboard shows event based on date only
- Countdown uses start of day (00:00 UTC)

**Verification**:
1. Create event without time
2. View in event list - should show date only
3. View in dashboard - should appear in correct upcoming/past tab

---

### Scenario 7: Events Spanning Date Boundaries
**Setup**: Event in Tokyo timezone (UTC+9):
- date: 2026-01-15
- start_time: 22:00:00+00 (UTC)
- end_time: 06:00:00+00 (next day UTC)

**Expected Display in Tokyo (UTC+9)**:
- Start: 2026-01-16 07:00
- End: 2026-01-16 15:00

**Expected Display in EST (UTC-5)**:
- Start: 2026-01-15 17:00
- End: 2026-01-16 01:00

**Verification**:
1. View event in Tokyo timezone - verify date/time
2. View event in EST timezone - verify correct date crossing

---

### Scenario 8: Legacy Time Format Support
**Setup**: Event with old TIME format (without timezone):
- date: 2026-01-15
- start_time: 10:00:00 (no +00 suffix)
- end_time: 18:00:00

**Expected Behavior**:
- combineDateAndTime handles this as UTC time
- Display shows correct UTC time converted to local

**Verification**:
1. Query database for event with old format
2. View in browser - verify time displays correctly

---

## Browser Testing Guide

### Testing Timezone Display

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Click "⋮" → "More tools" → "Sensors"
   - Override timezone under "Location"

2. **Firefox DevTools**:
   - Open DevTools (F12)
   - Click "⋮" → "Settings"
   - Override timezone under "Advanced"

3. **Testing Checklist**:
   - [ ] Create event in UTC+0 timezone
   - [ ] View event in UTC+4 timezone
   - [ ] View event in UTC-5 timezone
   - [ ] Edit event in different timezone
   - [ ] Verify countdown accuracy
   - [ ] Check dashboard filtering
   - [ ] Test events spanning day boundaries
   - [ ] Verify Arabic locale time display

---

## Common Issues and Solutions

### Issue: NaN displayed for time
**Cause**: Invalid date calculation or timezone math
**Solution**: Ensure combineDateAndTime properly extracts timezone offset

### Issue: Time off by hours
**Cause**: Timezone offset applied in wrong direction
**Solution**: Verify offset direction (local→UTC subtracts, UTC→local adds)

### Issue: Events in wrong upcoming/past tab
**Cause**: Date comparison mixing local and UTC dates
**Solution**: Use UTC dates for all comparisons

### Issue: Countdown not decrementing
**Cause**: combineDateAndTime not returning valid Date object
**Solution**: Ensure time string parsing handles timezone suffix

---

## Future Enhancements

1. **Consider using date-fns or luxon**: Better timezone handling than native JS Date
2. **Timezone selection**: Allow users to manually select timezone
3. **Daylight Saving Time**: Automatic DST adjustment handling
4. **Timezone-aware date pickers**: Better UX for admins creating events
