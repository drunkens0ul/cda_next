# Quiz Module Documentation

## Overview

The quiz module is a fully dynamic, bilingual (English/Arabic) quiz system integrated into the CDA application. It supports authenticated users taking quizzes with multiple-choice questions, with all data stored in the database for analytics.

## Features

✅ **Bilingual Support**: All quiz content (titles, descriptions, questions, answers) available in English and Arabic
✅ **Authentication Required**: Users must be logged in to access quizzes
✅ **Dynamic Content**: All quiz content loaded from database
✅ **Progress Tracking**: Visual progress bar and question counter
✅ **Language Switching**: Users can switch language mid-quiz
✅ **Response Storage**: All responses saved with timestamps and user analytics
✅ **Beautiful UI**: Matches design specifications with confetti animations
✅ **Mobile Responsive**: Works seamlessly on all device sizes

## Route Structure

```
/[lang]/quiz/[slug]
```

Example URLs:
- `/en/quiz/event-feedback`
- `/ar/quiz/event-feedback`

## Database Schema

### Tables

#### `quizzes`
Stores quiz metadata
- `id`: UUID primary key
- `slug`: Unique URL identifier
- `title` / `title_ar`: Quiz titles
- `description` / `description_ar`: Quiz descriptions
- `event_id`: Optional link to event
- `is_active`: Whether quiz is available
- `requires_auth`: Auth requirement flag
- `allow_multiple_submissions`: Multiple submission flag

#### `quiz_questions`
Stores questions
- `id`: UUID primary key
- `quiz_id`: Foreign key to quizzes
- `question_order`: Display order
- `question_text` / `question_text_ar`: Question text
- `question_type`: Type (multiple_choice, rating, text)
- `is_required`: Required flag

#### `quiz_answers`
Stores answer options
- `id`: UUID primary key
- `question_id`: Foreign key to quiz_questions
- `answer_order`: Display order
- `answer_text` / `answer_text_ar`: Answer text
- `answer_value`: Numeric value for scoring

#### `quiz_submissions`
Stores completed submissions
- `id`: UUID primary key
- `quiz_id`: Foreign key to quizzes
- `user_id`: Foreign key to users
- `event_id`: Optional event link
- `submitted_at`: Submission timestamp
- `ip_address`, `user_agent`: Analytics data
- `session_duration_seconds`: Time to complete

#### `quiz_responses`
Stores individual answers
- `id`: UUID primary key
- `submission_id`: Foreign key to quiz_submissions
- `question_id`: Foreign key to quiz_questions
- `answer_id`: Foreign key to quiz_answers
- `response_text`: For text responses
- `response_value`: Copied from answer_value

## API Endpoints

### GET `/api/quiz/[slug]`

Fetches quiz data with all questions and answers.

**Response:**
```json
{
  "id": "uuid",
  "slug": "event-feedback",
  "title": {
    "en": "Event Feedback Quiz",
    "ar": "استبيان تقييم الفعالية"
  },
  "description": {
    "en": "Your feedback helps us improve future events",
    "ar": "ملاحظاتك تساعدنا على تحسين الفعاليات المستقبلية"
  },
  "questions": [
    {
      "id": "uuid",
      "question": {
        "en": "How would you rate your overall experience?",
        "ar": "كيف تقيّم تجربتك الشاملة؟"
      },
      "type": "multiple_choice",
      "answers": [
        {
          "id": "uuid",
          "text": {
            "en": "Excellent",
            "ar": "ممتاز"
          },
          "value": 5
        }
      ]
    }
  ],
  "requiresAuth": true,
  "allowMultipleSubmissions": false
}
```

### POST `/api/quiz/submit`

Submits quiz responses.

**Request:**
```json
{
  "quizId": "uuid",
  "eventId": "uuid (optional)",
  "responses": [
    {
      "questionId": "uuid",
      "answerId": "uuid"
    }
  ],
  "sessionDuration": 120
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "uuid"
}
```

## Components

### QuizStart
Starting screen with quiz title, description, and start button.

**Props:**
- `title`: string
- `description`: string
- `onStart`: () => void
- `lang`: 'en' | 'ar'

### QuizQuestion
Question display with answer options.

**Props:**
- `question`: Question object
- `questionNumber`: number
- `totalQuestions`: number
- `selectedAnswer`: string | undefined
- `onNext`: (questionId, answerId) => void
- `onPrevious`: () => void
- `showPrevious`: boolean
- `isLastQuestion`: boolean
- `lang`: 'en' | 'ar'

### QuizCompletion
Completion screen with thank you message.

**Props:**
- `lang`: 'en' | 'ar'

## Translations

All quiz-related translations are stored in:
- `/i18n/translations/en.json` under `quiz` key
- `/i18n/translations/ar.json` under `quiz` key

Translation keys:
- `title`, `description`
- `startQuiz`, `nextQuestion`, `previousQuestion`
- `submitQuiz`, `submitting`
- `question`, `of`
- `thankYou`, `feedbackReceived`
- `backToDashboard`, `backToHome`
- `selectOption`, `completionPercentage`
- `switchLanguage`, `currentLanguage`
- `excellent`, `good`, `average`, `belowAverage`, `poor`

## Database Migration

To set up the quiz system, run:

```sql
psql -U your_user -d your_database -f database/migrations/006_add_quiz_system.sql
```

This migration includes:
1. All table definitions
2. Indexes for performance
3. Triggers for updated_at timestamps
4. Seed data for the "event-feedback" quiz

## Seed Data

The migration includes a sample "Event Feedback Quiz" with 5 questions:
1. Overall experience rating
2. Content quality rating
3. Speakers and presenters rating
4. Likelihood to recommend
5. Organization and logistics rating

Each question has 5 answer options with values 1-5 for scoring.

## Usage Example

1. **Create a quiz in the database** (or use the seeded one):
```sql
INSERT INTO quizzes (slug, title, title_ar, description, description_ar)
VALUES ('my-quiz', 'My Quiz', 'استبياني', 'Description', 'الوصف');
```

2. **Add questions and answers** using the quiz_id

3. **Access the quiz** at `/<lang>/quiz/<slug>`

4. **View submissions** by querying:
```sql
SELECT * FROM quiz_submissions WHERE quiz_id = 'your-quiz-id';
SELECT * FROM quiz_responses WHERE submission_id = 'your-submission-id';
```

## Analytics Queries

### Get all responses for a quiz:
```sql
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  qq.question_text,
  qa.answer_text,
  qa.answer_value,
  qr.created_at
FROM quiz_responses qr
JOIN quiz_submissions qs ON qr.submission_id = qs.id
JOIN users u ON qs.user_id = u.id
JOIN quiz_questions qq ON qr.question_id = qq.id
JOIN quiz_answers qa ON qr.answer_id = qa.id
WHERE qs.quiz_id = 'your-quiz-id'
ORDER BY qs.submitted_at DESC, qq.question_order ASC;
```

### Calculate average ratings:
```sql
SELECT 
  qq.question_text,
  AVG(qr.response_value) as average_rating,
  COUNT(*) as response_count
FROM quiz_responses qr
JOIN quiz_submissions qs ON qr.submission_id = qs.id
JOIN quiz_questions qq ON qr.question_id = qq.id
WHERE qs.quiz_id = 'your-quiz-id'
GROUP BY qq.id, qq.question_text, qq.question_order
ORDER BY qq.question_order;
```

## Future Enhancements

- [ ] Admin interface for creating/editing quizzes
- [ ] Quiz analytics dashboard
- [ ] Support for text-based questions
- [ ] Quiz templates
- [ ] Export results to CSV/Excel
- [ ] Email notifications on submission
- [ ] Quiz scheduling (start/end dates)
- [ ] Conditional questions based on previous answers
- [ ] Quiz themes/branding
- [ ] Multi-page quizzes with sections

## Testing

To test the quiz module:

1. Ensure you're logged in
2. Navigate to `/en/quiz/event-feedback`
3. Complete the quiz
4. Check the database for your submission:
```sql
SELECT * FROM quiz_submissions 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
ORDER BY submitted_at DESC LIMIT 1;
```

## Troubleshooting

**Quiz not loading:**
- Check if user is authenticated
- Verify quiz exists and is_active = TRUE
- Check browser console for API errors

**Submission failing:**
- Check if all required questions are answered
- Verify user session is valid
- Check database logs for constraint violations

**Wrong language displayed:**
- Verify lang parameter in URL
- Check translation files for missing keys
- Ensure quiz has both en and ar content

## Notes

- All times are stored in UTC with timezone awareness
- Quiz responses are never deleted (soft delete only)
- Support for multiple submissions can be enabled per quiz
- Session duration is tracked but optional
- IP and user agent are logged foranalytics (privacy compliant)
