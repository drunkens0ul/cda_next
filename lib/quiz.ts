import { query } from './db'
import type {
    Quiz,
    QuizQuestion,
    QuizAnswer,
    QuizSubmission,
    QuizResponse,
    SubmissionResponse,
    QuizAnalytics,
    QuizRow,
    QuestionRow,
    AnswerRow,
    SubmissionRow,
    SubmitQuizOptions
} from './types/quiz'

// ============================================================================
// Helper Functions
// ============================================================================

function mapQuizRow(row: QuizRow): Omit<Quiz, 'questions'> {
    return {
        id: row.id,
        slug: row.slug,
        title: {
            en: row.title,
            ar: row.title_ar
        },
        description: {
            en: row.description || '',
            ar: row.description_ar || ''
        },
        requiresAuth: row.requires_auth,
        allowMultipleSubmissions: row.allow_multiple_submissions,
        eventId: row.event_id,
        isActive: row.is_active
    }
}

function mapQuestionRow(row: QuestionRow): Omit<QuizQuestion, 'answers'> {
    return {
        id: row.id,
        question: {
            en: row.question_text,
            ar: row.question_text_ar
        },
        type: row.question_type,
        required: row.is_required,
        order: row.question_order
    }
}

function mapAnswerRow(row: AnswerRow): QuizAnswer {
    return {
        id: row.id,
        text: {
            en: row.answer_text,
            ar: row.answer_text_ar
        },
        value: row.answer_value
    }
}

function mapSubmissionRow(row: SubmissionRow): QuizSubmission {
    return {
        id: row.id,
        quizId: row.quiz_id,
        userId: row.user_id,
        eventId: row.event_id,
        submittedAt: row.submitted_at,
        sessionDurationSeconds: row.session_duration_seconds
    }
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Get a quiz by slug with all questions and answers
 */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
    // Fetch quiz metadata
    const quizResult = await query<QuizRow>(`
    SELECT id, slug, title, title_ar, description, description_ar,
           event_id, is_active, requires_auth, allow_multiple_submissions,
           is_deleted, created_at, updated_at
    FROM quizzes
    WHERE slug = $1 AND is_deleted = FALSE AND is_active = TRUE
  `, [slug])

    if (quizResult.rows.length === 0) {
        return null
    }

    const quizData = mapQuizRow(quizResult.rows[0])

    // Fetch questions
    const questionsResult = await query<QuestionRow>(`
    SELECT id, quiz_id, question_order, question_text, question_text_ar,
           question_type, is_required, is_deleted
    FROM quiz_questions
    WHERE quiz_id = $1 AND is_deleted = FALSE
    ORDER BY question_order ASC
  `, [quizData.id])

    const questionIds = questionsResult.rows.map(q => q.id)

    // Fetch answers for all questions
    let answersResult = { rows: [] as AnswerRow[] }
    if (questionIds.length > 0) {
        answersResult = await query<AnswerRow>(`
      SELECT id, question_id, answer_order, answer_text, answer_text_ar,
             answer_value, is_deleted
      FROM quiz_answers
      WHERE question_id = ANY($1) AND is_deleted = FALSE
      ORDER BY question_id, answer_order ASC
    `, [questionIds])
    }

    // Build questions with their answers
    const questions: QuizQuestion[] = questionsResult.rows.map(q => {
        const questionAnswers = answersResult.rows
            .filter(a => a.question_id === q.id)
            .map(mapAnswerRow)

        return {
            ...mapQuestionRow(q),
            answers: questionAnswers
        }
    })

    return {
        ...quizData,
        questions
    }
}

/**
 * Get a quiz by ID (for internal use)
 */
export async function getQuizById(quizId: string): Promise<Omit<Quiz, 'questions'> | null> {
    const result = await query<QuizRow>(`
    SELECT id, slug, title, title_ar, description, description_ar,
           event_id, is_active, requires_auth, allow_multiple_submissions,
           is_deleted, created_at, updated_at
    FROM quizzes
    WHERE id = $1 AND is_deleted = FALSE
  `, [quizId])

    if (result.rows.length === 0) {
        return null
    }

    return mapQuizRow(result.rows[0])
}

/**
 * Check if a user has already submitted a quiz
 */
export async function hasUserSubmittedQuiz(userId: string, quizId: string): Promise<boolean> {
    const result = await query<{ count: string }>(`
    SELECT COUNT(*) as count
    FROM quiz_submissions
    WHERE user_id = $1 AND quiz_id = $2 AND is_deleted = FALSE
  `, [userId, quizId])

    return parseInt(result.rows[0].count) > 0
}

/**
 * Submit a quiz with responses
 * Returns the submission ID
 */
export async function submitQuiz(
    quizId: string,
    userId: string,
    responses: QuizResponse[],
    options?: SubmitQuizOptions
): Promise<string> {
    // Create submission
    const submissionResult = await query<SubmissionRow>(`
    INSERT INTO quiz_submissions
    (quiz_id, user_id, event_id, ip_address, user_agent, session_duration_seconds)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
        quizId,
        userId,
        options?.eventId || null,
        options?.ipAddress || null,
        options?.userAgent || null,
        options?.sessionDuration || null
    ])

    const submissionId = submissionResult.rows[0].id

    // Insert all responses
    for (const response of responses) {
        // Get answer value if answerId is provided
        let answerValue = null
        if (response.answerId) {
            const answerResult = await query<{ answer_value: number | null }>(`
        SELECT answer_value FROM quiz_answers WHERE id = $1
      `, [response.answerId])

            if (answerResult.rows.length > 0) {
                answerValue = answerResult.rows[0].answer_value
            }
        }

        // Insert response
        await query(`
      INSERT INTO quiz_responses
      (submission_id, question_id, answer_id, response_text, response_value)
      VALUES ($1, $2, $3, $4, $5)
    `, [
            submissionId,
            response.questionId,
            response.answerId || null,
            response.responseText || null,
            answerValue
        ])
    }

    return submissionId
}

/**
 * Get all submissions for a quiz (for analytics)
 */
export async function getQuizSubmissions(quizId: string): Promise<QuizSubmission[]> {
    const result = await query<SubmissionRow>(`
    SELECT id, quiz_id, user_id, event_id, submitted_at,
           ip_address, user_agent, session_duration_seconds, is_deleted
    FROM quiz_submissions
    WHERE quiz_id = $1 AND is_deleted = FALSE
    ORDER BY submitted_at DESC
  `, [quizId])

    return result.rows.map(mapSubmissionRow)
}

/**
 * Get submission responses with details
 */
export async function getSubmissionResponses(submissionId: string): Promise<SubmissionResponse[]> {
    const result = await query<{
        question_text: string
        question_text_ar: string
        answer_text: string | null
        answer_text_ar: string | null
        response_text: string | null
        response_value: number | null
    }>(`
    SELECT
      qq.question_text,
      qq.question_text_ar,
      qa.answer_text,
      qa.answer_text_ar,
      qr.response_text,
      qr.response_value
    FROM quiz_responses qr
    JOIN quiz_questions qq ON qr.question_id = qq.id
    LEFT JOIN quiz_answers qa ON qr.answer_id = qa.id
    WHERE qr.submission_id = $1 AND qr.is_deleted = FALSE
    ORDER BY qq.question_order ASC
  `, [submissionId])

    return result.rows.map(row => ({
        question: {
            en: row.question_text,
            ar: row.question_text_ar
        },
        answer: row.answer_text ? {
            en: row.answer_text,
            ar: row.answer_text_ar || ''
        } : null,
        responseText: row.response_text,
        responseValue: row.response_value
    }))
}

/**
 * Get quiz analytics
 */
export async function getQuizAnalytics(quizId: string): Promise<QuizAnalytics> {
    // Total submissions
    const totalResult = await query<{ total: string }>(`
    SELECT COUNT(*) as total
    FROM quiz_submissions
    WHERE quiz_id = $1 AND is_deleted = FALSE
  `, [quizId])

    // Average session duration
    const durationResult = await query<{ avg_duration: number | null }>(`
    SELECT AVG(session_duration_seconds) as avg_duration
    FROM quiz_submissions
    WHERE quiz_id = $1 AND is_deleted = FALSE AND session_duration_seconds IS NOT NULL
  `, [quizId])

    // Response distribution per question
    const distributionResult = await query<{
        question_id: string
        question_text: string
        answer_id: string
        answer_text: string
        response_count: string
    }>(`
    SELECT
      qq.id as question_id,
      qq.question_text,
      qa.id as answer_id,
      qa.answer_text,
      COUNT(qr.id) as response_count
    FROM quiz_questions qq
    LEFT JOIN quiz_answers qa ON qq.id = qa.question_id AND qa.is_deleted = FALSE
    LEFT JOIN quiz_responses qr ON qa.id = qr.answer_id AND qr.is_deleted = FALSE
    WHERE qq.quiz_id = $1 AND qq.is_deleted = FALSE
    GROUP BY qq.id, qq.question_text, qq.question_order, qa.id, qa.answer_text, qa.answer_order
    ORDER BY qq.question_order, qa.answer_order
  `, [quizId])

    return {
        totalSubmissions: parseInt(totalResult.rows[0]?.total || '0'),
        averageDuration: durationResult.rows[0]?.avg_duration || null,
        responseDistribution: distributionResult.rows.map(row => ({
            questionId: row.question_id,
            questionText: row.question_text,
            answerId: row.answer_id,
            answerText: row.answer_text,
            responseCount: parseInt(row.response_count)
        }))
    }
}
