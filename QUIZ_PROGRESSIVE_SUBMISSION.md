# Quiz Progressive Submission Implementation - Summary

## Overview
Transformed the quiz system from "submit all at once" to "submit one by one" with proper activity tracking and resume capability.

## Implementation Complete ✓

### 1. Database Changes

#### Migration: `007_add_quiz_progressive_submission.sql`

**New Table: `quiz_attempts`**
- Tracks active quiz sessions per user per quiz
- Stores current question index, started/last activity timestamps
- Tracks total active seconds (actual time spent)

**Modified Tables:**
- `quiz_responses`: Added `attempt_id` column (links to attempt before submission)
- `quiz_submissions`: Added `attempt_id` column (links to final submission)

#### Migration: `008_fix_quiz_responses_unique_constraint.sql`
- Adds partial unique index to prevent duplicate answers per question

#### Migration: `009_fix_quiz_progressive_submission.sql`
- **Makes `submission_id` nullable** for in-progress responses
- **Fixes unique constraints** - proper partial unique index for attempts
- **Removes problematic trigger** - activity time now tracked via heartbeats in app code

#### How to Run Migration

**Option 1: Using the provided script**
```bash
cd /home/mat/Projects/cda_next
./database/run-progressive-migration.sh
```

**Option 2: Manual execution**
```bash
psql "$DATABASE_URL" -f database/migrations/007_add_quiz_progressive_submission.sql
psql "$DATABASE_URL" -f database/migrations/008_fix_quiz_responses_unique_constraint.sql
psql "$DATABASE_URL" -f database/migrations/009_fix_quiz_progressive_submission.sql
```

### 2. Backend Changes

#### New Library Functions (`lib/quiz.ts`)
- `startQuizAttempt(userId, quizId)` - Creates new quiz attempt
- `submitQuizAnswer(attemptId, questionId, answerId)` - Submits single answer
- `getQuizAttempt(attemptId)` - Gets attempt by ID
- `getQuizAttemptByUserAndQuiz(userId, quizId)` - Gets active attempt
- `getAttemptResponses(attemptId)` - Gets all responses for attempt
- `finalizeQuizSubmission(attemptId, options)` - Finalizes attempt into submission
- `updateQuizAttemptActivity(attemptId)` - Updates activity timestamp

#### New API Routes

**POST `/api/quiz/start`**
- Creates new quiz attempt
- Returns attempt ID and current question index
- If attempt already exists, returns existing one (resume capability)

**POST `/api/quiz/submit-answer`**
- Submits a single answer immediately
- Increments question index
- Returns next question index and completion status

**GET `/api/quiz/attempt/[attemptId]`**
- Gets current attempt state
- Returns saved responses for resuming

**POST `/api/quiz/update-activity`**
- Updates `last_activity_at` timestamp
- **Adds 30 seconds to `total_active_seconds`** (heartbeat-based tracking)
- Called periodically (every 30 seconds) while user is active AND tab is visible

#### Modified API Routes

**GET `/api/quiz/[slug]`**
- Now returns `attemptInfo` with existing attempt data
- Includes saved responses for resume capability

**POST `/api/quiz/submit`**
- Modified to accept `attemptId` instead of full responses
- Backward compatible with old format (quizId + responses)
- Links submission to attempt and marks attempt as completed

### 3. Frontend Changes

#### Updated: `app/[lang]/quiz/[slug]/page.tsx`

**New State:**
- `attemptId` - Tracks current attempt ID
- `activityTimerRef` - Reference to activity update timer

**New Features:**
- `startActivityTracking()` - Starts periodic activity updates (every 30s)
- `stopActivityTracking()` - Stops activity updates
- Page Visibility API integration - Pauses tracking when tab hidden
- localStorage persistence - Saves attempt ID for recovery

**Modified Flow:**
1. **On page load**: Check for existing incomplete attempt, resume if found
2. **On Start Quiz**: Call `/api/quiz/start`, get attempt ID, start activity tracking
3. **On Next Question**: Call `/api/quiz/submit-answer`, move to next question
4. **On Submit**: Call `/api/quiz/submit` with attempt ID to finalize
5. **On refresh/return**: Restore state from localStorage + API

**Removed Features:**
- Previous button functionality (no going back in progressive mode)
- `startTimeRef` (time tracking now handled by backend)

#### Updated: `components/quiz/QuizQuestion.tsx`
- No changes needed (Previous button now hidden via `showPrevious={false}`)

### 4. Types Updated (`lib/types/quiz.ts`)

**New Interfaces:**
```typescript
interface QuizAttempt {
    id: string
    quizId: string
    userId: string
    currentQuestionIndex: number
    startedAt: Date
    lastActivityAt: Date
    totalActiveSeconds: number
    isCompleted: boolean
}

interface AttemptResponse {
    questionId: string
    answerId: string
}
```

## How It Works

### User Flow Example

**Scenario: User starts at 10:00 AM, takes 5 minutes, leaves at 10:05, returns at 10:07, finishes at 10:10**

1. **10:00 AM** - User clicks "Start Quiz"
   - Frontend: POST `/api/quiz/start` → creates attempt
   - Database: `quiz_attempts` row created with `started_at = 10:00`
   - Frontend: Starts activity timer (every 30s)

2. **10:00-10:05** - User answers questions
   - Frontend: POST `/api/quiz/submit-answer` for each answer
   - Database: Responses saved with `attempt_id`, `current_question_index` increments
   - Database: `last_activity_at` updated every 30s, `total_active_seconds` accumulates
   - At 10:05: `total_active_seconds` = 300 (5 minutes)

3. **10:05-10:07** - User minimizes app, leaves
   - Frontend: Page Visibility API detects hidden tab, stops activity timer
   - Database: `last_activity_at` = 10:05 (not updated during inactivity)

4. **10:07** - User returns to app
   - Frontend: GET `/api/quiz/[slug]` → returns `attemptInfo`
   - Frontend: Resumes from question where user left off
   - Frontend: Restarts activity timer
   - Database: `last_activity_at` updated on next activity ping

5. **10:07-10:10** - User finishes remaining questions
   - Frontend: POST `/api/quiz/submit-answer` for remaining answers
   - Database: `total_active_seconds` continues accumulating
   - At 10:10: `total_active_seconds` = 480 (8 minutes total)

6. **10:10** - User submits final answer
   - Frontend: POST `/api/quiz/submit` with `attemptId`
   - Database: Creates submission with `session_duration_seconds = 480`
   - Database: Links all responses to submission
   - Database: Marks attempt as `is_completed = TRUE`

**Result:** Total time saved = 8 minutes (8 × 60 = 480 seconds), which represents actual active time, not wall-clock time.

### Activity Time Calculation

**Heartbeat-Based Tracking (Application Code):**

Activity time is tracked via periodic heartbeats from the frontend:

1. Frontend sends a heartbeat every 30 seconds (only when tab is visible)
2. Each heartbeat adds 30 seconds to `total_active_seconds`
3. When user leaves (tab hidden, app minimized), heartbeats stop
4. When user returns, heartbeats resume

```typescript
// lib/quiz.ts
const HEARTBEAT_INTERVAL_SECONDS = 30

export async function updateQuizAttemptActivity(attemptId: string): Promise<number> {
    const result = await query(`
    UPDATE quiz_attempts
    SET last_activity_at = NOW(),
        total_active_seconds = total_active_seconds + $1,
        updated_at = NOW()
    WHERE id = $2 AND is_completed = FALSE AND is_deleted = FALSE
    RETURNING total_active_seconds
  `, [HEARTBEAT_INTERVAL_SECONDS, attemptId])
    return result.rows[0].total_active_seconds
}
```

This means:
- Time spent away from quiz (tab hidden, app minimized) is NOT counted
- Only active time is accumulated
- True user engagement is measured

### Resume Capability

**Page Refresh:**
1. Frontend checks localStorage for `quiz_attempt_{quizId}`
2. If found, calls GET `/api/quiz/attempt/{attemptId}`
3. Restores state (current question, saved answers)
4. Continues where user left off

**Tab Return:**
1. Page Visibility API detects `visibilitychange` → `visible`
2. Restarts activity timer
3. Continues tracking active time

### No Restart Enforcement

Database constraint ensures:
```sql
UNIQUE(quiz_id, user_id, is_completed)
```

This means:
- Only one INCOMPLETE attempt per user per quiz
- User cannot start over
- Must complete or abandon current attempt

## Migration Checklist

- [x] Create migration SQL file
- [x] Create migration runner script
- [ ] Run migration on development database
- [ ] Run migration on production database
- [ ] Test quiz flow (start → answer → submit)
- [ ] Test resume capability (refresh page)
- [ ] Test activity time tracking (leave and return)
- [ ] Verify no restart is possible
- [ ] Update admin dashboard to display attempt info (optional)
- [ ] Update analytics to use `total_active_seconds` instead of `session_duration_seconds` (optional)

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Old quiz submissions** still work (no changes to existing data)
2. **Submission API** accepts both old format (quizId + responses) and new format (attemptId)
3. **Admin dashboard** continues to work with existing submission data

## Testing Instructions

1. **Run migration:**
   ```bash
   cd /home/mat/CDA/cda_next
   ./database/run-progressive-migration.sh
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test basic flow:**
   - Navigate to quiz page
   - Start quiz
   - Answer questions one by one
   - Submit quiz

4. **Test resume capability:**
   - Start quiz
   - Answer a few questions
   - Refresh page
   - Verify you're on the correct question with saved answers
   - Complete quiz

5. **Test activity time tracking:**
   - Start quiz
   - Answer a question
   - Minimize browser tab for 2 minutes
   - Return and continue
   - Submit quiz
   - Check database: `total_active_seconds` should NOT include the 2-minute absence

6. **Test no restart:**
   - Start quiz
   - Answer a question
   - Try to reload and start over (should continue existing attempt)

## Database Queries for Verification

**Check attempts table:**
```sql
SELECT * FROM quiz_attempts;
```

**Check responses with attempt links:**
```sql
SELECT qr.*, qa.question_text
FROM quiz_responses qr
JOIN quiz_questions qa ON qr.question_id = qa.id
WHERE qr.attempt_id IS NOT NULL;
```

**Check submissions with attempt links:**
```sql
SELECT qs.*, qa.total_active_seconds
FROM quiz_submissions qs
LEFT JOIN quiz_attempts qa ON qs.attempt_id = qa.id;
```

**Verify active time calculation:**
```sql
SELECT 
    id,
    user_id,
    started_at,
    last_activity_at,
    total_active_seconds,
    ROUND(total_active_seconds::numeric / 60, 2) as minutes_active
FROM quiz_attempts;
```

## Files Changed

**Database:**
- `database/migrations/007_add_quiz_progressive_submission.sql` (new)
- `database/migrations/008_fix_quiz_responses_unique_constraint.sql` (new)
- `database/migrations/009_fix_quiz_progressive_submission.sql` (new)
- `database/run-progressive-migration.sh` (new)

**Backend:**
- `lib/types/quiz.ts` - Added new types
- `lib/quiz.ts` - Added 7 new functions
- `app/api/quiz/start/route.ts` (new)
- `app/api/quiz/submit-answer/route.ts` (new)
- `app/api/quiz/attempt/[attemptId]/route.ts` (new)
- `app/api/quiz/update-activity/route.ts` (new)
- `app/api/quiz/submit/route.ts` - Modified for backward compatibility
- `app/api/quiz/[slug]/route.ts` - Returns attempt info

**Frontend:**
- `app/[lang]/quiz/[slug]/page.tsx` - Major refactoring for progressive flow

## Next Steps

1. **Run the migration** on your database
2. **Test thoroughly** using the testing instructions above
3. **Deploy to production** with migration
4. **Monitor** quiz attempts and submissions in production
5. **Optional:** Update admin dashboard to show attempt progress and active time
6. **Optional:** Update analytics to display accurate engagement metrics

## Support

If you encounter any issues:
1. Check migration was applied successfully
2. Verify database connection
3. Check browser console for errors
4. Check server logs for API errors
5. Verify `attemptId` is being passed correctly in API calls
