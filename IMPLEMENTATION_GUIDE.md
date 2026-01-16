# Quiz Module Implementation Guide

This guide details the steps to activate the new Quiz Module in your existing application environment.

## 1. Database Migration (Required)

Since you are running this on a dev server where the app already exists, the most critical step is to update your database schema to include the new quiz tables.

Run the following command in your terminal (adjusting the user/db name if they differ from your defaults):

```bash
# Using psql directly
psql -d cda_next -f database/migrations/006_add_quiz_system.sql
```

**What this does:**
- Creates tables: `quizzes`, `quiz_questions`, `quiz_answers`, `quiz_submissions`, `quiz_responses`.
- Sets up indexes and foreign keys.
- **Seeds data**: Inserts a sample "Event Feedback Quiz" automatically so you have something to test immediately.

## 2. Verify Database Connection

Ensure your `.env.local` or environment variables contain the correct `DATABASE_URL`. The migration setup relies on the same database your app connects to.

```bash
# Example check
grep DATABASE_URL .env.local
```

## 3. Restart Development Server

While Next.js handles hot-reloading for code, it's good practice to restart the server after adding significant new API routes and database connections to ensure fresh pools are created.

```bash
# Stop the server (Ctrl+C) and run:
npm run dev
```

## 4. Testing the Implementation

Once the migration is run and the server is up, you can verify the installation:

### A. Access the Quiz directly
Navigate to: `http://localhost:3000/en/quiz/event-feedback`

**Expected behavior:**
1. If you are **NOT logged in**: You should be redirected to `/en/login`.
2. If you **ARE logged in**: You should see the Quiz Start screen with the instructor image and "Start Quiz" button.

### B. Complete a Quiz
1. Click "Start Quiz".
2. Answer the 5 questions.
3. Submit the quiz.
4. You should see the "Thank You" completion screen with confetti.

### C. Verify Data Storage
Check that your submission was saved by running this SQL query:

```sql
SELECT 
  u.email, 
  qs.submitted_at, 
  qs.session_duration_seconds 
FROM quiz_submissions qs
JOIN users u ON qs.user_id = u.id
ORDER BY qs.submitted_at DESC;
```

## 5. File Summary

We added the following files to your project. Ensure these exist if you copied the code manually:

**Database:**
- `database/migrations/006_add_quiz_system.sql`

**Core Logic & Types (New Architecture):**
- `lib/types/quiz.ts` (Type definitions)
- `lib/quiz.ts` (Business logic)

**API Routes:**
- `app/api/quiz/[slug]/route.ts` (Get quiz data)
- `app/api/quiz/submit/route.ts` (Submit responses)

**Components:**
- `components/quiz/QuizStart.tsx`
- `components/quiz/QuizQuestion.tsx`
- `components/quiz/QuizCompletion.tsx`

**Page:**
- `app/[lang]/quiz/[slug]/page.tsx`

**Assets:**
- `public/assets/quizstart.png`
- `public/assets/quiz.png`
- `public/assets/quizcompletion.png`
- `public/assets/quizsomplete.png`
