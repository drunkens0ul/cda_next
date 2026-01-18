import { query, transaction, getClient } from './db'
import type { PoolClient } from 'pg'
import { generateSlug } from './utils'
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
    SubmitQuizOptions,
    QuizListItem,
    CreateQuizData,
    UpdateQuizData,
    CreateQuestionData,
    UpdateQuestionData,
    CreateAnswerData,
    UpdateAnswerData,
    SubmissionListItem,
    SubmissionDetail,
    DetailedResponse,
    GetSubmissionsParams,
    GetSubmissionsResult,
    PaginationInfo,
    DetailedAnalytics,
    DateDistribution,
    QuizAttempt,
    AttemptResponse,
    QuizAttemptRow
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
export async function getBasicQuizSubmissions(quizId: string): Promise<QuizSubmission[]> {
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

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all quizzes for admin list with submission counts
 */
export async function getAllQuizzesForAdmin(): Promise<QuizListItem[]> {
    const result = await query<{
        id: string
        slug: string
        title: string
        title_ar: string
        is_active: boolean
        event_id: string | null
        created_at: Date
        submission_count: string
    }>(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.title_ar,
      q.is_active,
      q.event_id,
      q.created_at,
      COALESCE(COUNT(qs.id), 0) as submission_count
    FROM quizzes q
    LEFT JOIN quiz_submissions qs ON q.id = qs.quiz_id AND qs.is_deleted = FALSE
    WHERE q.is_deleted = FALSE
    GROUP BY q.id, q.slug, q.title, q.title_ar, q.is_active, q.event_id, q.created_at
    ORDER BY q.created_at DESC
  `)

    return result.rows.map(row => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        titleAr: row.title_ar,
        isActive: row.is_active,
        eventId: row.event_id,
        createdAt: row.created_at,
        submissionCount: parseInt(row.submission_count)
    }))
}

/**
 * Create a new quiz with questions and answers
 */
async function generateUniqueSlug(baseSlug: string, client: PoolClient): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
        const result = await client.query<{ exists: boolean }>(`
      SELECT EXISTS(
        SELECT 1 FROM quizzes
        WHERE slug = $1
      ) as exists
    `, [slug])

        if (!result.rows[0].exists) {
            return slug
        }

        slug = `${baseSlug}-${counter}`
        counter++
    }
}

export async function createQuiz(data: CreateQuizData): Promise<Quiz> {
    return await transaction(async (client) => {
        let slug = data.slug
        let attempts = 0
        const maxAttempts = 5
        let lastError: Error | null = null

        while (attempts < maxAttempts) {
            attempts++

            try {
                if (!slug) {
                    const baseSlug = generateSlug(data.title)
                    slug = await generateUniqueSlug(baseSlug, client)
                }

                // Create quiz
                const quizResult = await client.query<QuizRow>(`
              INSERT INTO quizzes
              (slug, title, title_ar, description, description_ar, event_id,
               is_active, requires_auth, allow_multiple_submissions)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *
            `, [
                    slug,
                    data.title,
                    data.titleAr,
                    data.description,
                    data.descriptionAr,
                    data.eventId,
                    data.isActive,
                    data.requiresAuth,
                    data.allowMultipleSubmissions
                ])

                const quizId = quizResult.rows[0].id

                // Create questions and answers
                for (const question of data.questions) {
                    const questionResult = await client.query<QuestionRow>(`
                INSERT INTO quiz_questions
                (quiz_id, question_order, question_text, question_text_ar,
                 question_type, is_required)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
              `, [
                        quizId,
                        question.questionOrder,
                        question.questionText,
                        question.questionTextAr,
                        question.questionType,
                        question.isRequired
                    ])

                    const questionId = questionResult.rows[0].id

                    // Create answers
                    for (const answer of question.answers) {
                        await client.query<AnswerRow>(`
                  INSERT INTO quiz_answers
                  (question_id, answer_order, answer_text, answer_text_ar, answer_value)
                  VALUES ($1, $2, $3, $4, $5)
                `, [
                            questionId,
                            answer.answerOrder,
                            answer.answerText,
                            answer.answerTextAr,
                            answer.answerValue
                        ])
                    }
                }

                // Fetch questions using the transaction client
                const questionsResult = await client.query<QuestionRow>(`
                    SELECT id, quiz_id, question_order, question_text, question_text_ar,
                           question_type, is_required, is_deleted
                    FROM quiz_questions
                    WHERE quiz_id = $1 AND is_deleted = FALSE
                    ORDER BY question_order ASC
                `, [quizId])

                const questionIds = questionsResult.rows.map(q => q.id)

                // Fetch answers for all questions using the transaction client
                let answersResult = { rows: [] as AnswerRow[] }
                if (questionIds.length > 0) {
                    answersResult = await client.query<AnswerRow>(`
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

                // Build full quiz object
                const quizData = mapQuizRow(quizResult.rows[0])
                return {
                    ...quizData,
                    questions
                }
            } catch (error) {
                lastError = error as Error

                // Check if it's a unique constraint violation
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
                    // Regenerate slug with suffix for next attempt
                    const baseSlug = generateSlug(data.title)
                    const counter = attempts
                    slug = `${baseSlug}-${counter}`
                    continue
                }

                // If it's not a duplicate slug error, throw immediately
                throw error
            }
        }

        // If we exhausted all attempts, throw the last error
        throw lastError || new Error('Failed to generate unique slug after multiple attempts')
    })
}

/**
 * Update an existing quiz with questions and answers
 */
export async function updateQuiz(slug: string, data: UpdateQuizData): Promise<Quiz> {
    return await transaction(async (client) => {
        // Get existing quiz
        const existingQuiz = await getQuizBySlug(slug)
        if (!existingQuiz) {
            throw new Error('Quiz not found')
        }

        // Update quiz metadata
        await client.query(`
      UPDATE quizzes
      SET title = $1, title_ar = $2, description = $3, description_ar = $4,
          event_id = $5, is_active = $6, requires_auth = $7,
          allow_multiple_submissions = $8, updated_at = NOW()
      WHERE slug = $9
    `, [
            data.title,
            data.titleAr,
            data.description,
            data.descriptionAr,
            data.eventId,
            data.isActive,
            data.requiresAuth,
            data.allowMultipleSubmissions,
            slug
        ])

        // Get existing question IDs
        const existingQuestions = await client.query<{ id: string; question_order: number }>(`
        SELECT id, question_order FROM quiz_questions
        WHERE quiz_id = $1 AND is_deleted = FALSE
        ORDER BY question_order
      `, [existingQuiz.id])

        const existingQuestionMap = new Map(
            existingQuestions.rows.map(q => [q.question_order, q.id])
        )

        // Update or create questions
        for (const question of data.questions) {
            if (question.id) {
                // Update existing question
                await client.query(`
          UPDATE quiz_questions
          SET question_order = $1, question_text = $2, question_text_ar = $3,
              question_type = $4, is_required = $5, is_deleted = FALSE, updated_at = NOW()
          WHERE id = $6
        `, [
                    question.questionOrder,
                    question.questionText,
                    question.questionTextAr,
                    question.questionType,
                    question.isRequired,
                    question.id
                ])
            } else {
                // Create new question
                const result = await client.query<QuestionRow>(`
          INSERT INTO quiz_questions
          (quiz_id, question_order, question_text, question_text_ar,
           question_type, is_required)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
                    existingQuiz.id,
                    question.questionOrder,
                    question.questionText,
                    question.questionTextAr,
                    question.questionType,
                    question.isRequired
                ])
                existingQuestionMap.set(question.questionOrder, result.rows[0].id)
            }

            const questionId = question.id || existingQuestionMap.get(question.questionOrder)!

            // Get existing answer IDs for this question
            const existingAnswers = await client.query<{ id: string; answer_order: number }>(`
        SELECT id, answer_order FROM quiz_answers
        WHERE question_id = $1 AND is_deleted = FALSE
        ORDER BY answer_order
      `, [questionId])

            const existingAnswerMap = new Map(
                existingAnswers.rows.map(a => [a.answer_order, a.id])
            )

            // Update or create answers
            for (const answer of question.answers) {
                if (answer.id) {
                    // Update existing answer
                    await client.query(`
            UPDATE quiz_answers
            SET answer_order = $1, answer_text = $2, answer_text_ar = $3,
                answer_value = $4, is_deleted = FALSE, updated_at = NOW()
            WHERE id = $5
          `, [
                        answer.answerOrder,
                        answer.answerText,
                        answer.answerTextAr,
                        answer.answerValue,
                        answer.id
                    ])
                } else if (!answer.isDeleted) {
                    // Create new answer
                    await client.query(`
            INSERT INTO quiz_answers
            (question_id, answer_order, answer_text, answer_text_ar, answer_value)
            VALUES ($1, $2, $3, $4, $5)
          `, [
                        questionId,
                        answer.answerOrder,
                        answer.answerText,
                        answer.answerTextAr,
                        answer.answerValue
                    ])
                }
            }

            // Soft-delete removed answers
            for (const answer of question.answers) {
                if (answer.id && answer.isDeleted) {
                    await client.query(`
            UPDATE quiz_answers
            SET is_deleted = TRUE, deleted_at = NOW()
            WHERE id = $1
          `, [answer.id])
                }
            }
        }

        // Soft-delete removed questions
        for (const question of data.questions) {
            if (question.id && question.isDeleted) {
                await client.query(`
        UPDATE quiz_questions
        SET is_deleted = TRUE, deleted_at = NOW()
        WHERE id = $1
      `, [question.id])
            }
        }

        // Return updated quiz
        const updatedQuiz = await getQuizBySlug(slug)
        return updatedQuiz!
    })
}

/**
 * Soft delete a quiz
 */
export async function deleteQuiz(slug: string): Promise<boolean> {
    const result = await query(`
    UPDATE quizzes
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE slug = $1 AND is_deleted = FALSE
  `, [slug])

    return (result.rowCount ?? 0) > 0
}

/**
 * Get quiz submissions with pagination and filters
 */
export async function getQuizSubmissions(
    quizId: string,
    params: GetSubmissionsParams = {}
): Promise<GetSubmissionsResult> {
    const page = params.page || 1
    const limit = Math.min(100, Math.max(1, params.limit || 20))
    const offset = (page - 1) * limit
    const search = params.search?.trim() || ''

    // Build WHERE conditions
    const conditions: string[] = ['qs.is_deleted = FALSE', 'qs.quiz_id = $1']
    const queryParams: (string | number)[] = [quizId]

    if (search) {
        conditions.push('u.email ILIKE $' + (queryParams.length + 1))
        queryParams.push(`%${search}%`)
    }

    if (params.startDate) {
        conditions.push('qs.submitted_at >= $' + (queryParams.length + 1))
        queryParams.push(params.startDate)
    }

    if (params.endDate) {
        conditions.push('qs.submitted_at <= $' + (queryParams.length + 1))
        queryParams.push(params.endDate)
    }

    const whereClause = conditions.join(' AND ')

    // Get submissions with user details
    const submissionsResult = await query<{
        id: string
        user_id: string
        email: string
        first_name: string
        last_name: string | null
        submitted_at: Date
        ip_address: string | null
        session_duration_seconds: number | null
        total_count: string
    }>(`
    SELECT
      qs.id,
      qs.user_id,
      u.email,
      u.first_name,
      u.last_name,
      qs.submitted_at,
      qs.ip_address,
      qs.session_duration_seconds,
      COUNT(*) OVER() as total_count
    FROM quiz_submissions qs
    JOIN users u ON qs.user_id = u.id AND u.is_deleted = FALSE
    WHERE ${whereClause}
    ORDER BY qs.submitted_at DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `, [...queryParams, limit, offset])

    const submissions = submissionsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        submittedAt: row.submitted_at,
        ipAddress: row.ip_address,
        sessionDurationSeconds: row.session_duration_seconds
    }))

    const total = submissionsResult.rows.length > 0
        ? parseInt(submissionsResult.rows[0].total_count)
        : 0
    const totalPages = Math.ceil(total / limit)

    return {
        submissions,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    }
}

/**
 * Get detailed submission with user info and responses
 */
export async function getSubmissionDetails(submissionId: string): Promise<SubmissionDetail | null> {
    // Get submission with user details
    const submissionResult = await query<{
        id: string
        user_id: string
        email: string
        first_name: string
        last_name: string | null
        submitted_at: Date
        ip_address: string | null
        session_duration_seconds: number | null
    }>(`
    SELECT
      qs.id,
      qs.user_id,
      u.email,
      u.first_name,
      u.last_name,
      qs.submitted_at,
      qs.ip_address,
      qs.session_duration_seconds
    FROM quiz_submissions qs
    JOIN users u ON qs.user_id = u.id AND u.is_deleted = FALSE
    WHERE qs.id = $1 AND qs.is_deleted = FALSE
  `, [submissionId])

    if (submissionResult.rows.length === 0) {
        return null
    }

    const submission = submissionResult.rows[0]

    // Get detailed responses
    const responsesResult = await query<{
        question_id: string
        question_text: string
        question_text_ar: string
        answer_id: string | null
        answer_text: string | null
        answer_text_ar: string | null
        response_text: string | null
        response_value: number | null
    }>(`
    SELECT
      qr.question_id,
      qq.question_text,
      qq.question_text_ar,
      qr.answer_id,
      qa.answer_text,
      qa.answer_text_ar,
      qr.response_text,
      qr.response_value
    FROM quiz_responses qr
    JOIN quiz_questions qq ON qr.question_id = qq.id
    LEFT JOIN quiz_answers qa ON qr.answer_id = qa.id AND qa.is_deleted = FALSE
    WHERE qr.submission_id = $1 AND qr.is_deleted = FALSE
    ORDER BY qq.question_order ASC
  `, [submissionId])

    const responses: DetailedResponse[] = responsesResult.rows.map(row => ({
        questionId: row.question_id,
        question: {
            en: row.question_text,
            ar: row.question_text_ar
        },
        answerId: row.answer_id,
        answer: row.answer_text ? {
            en: row.answer_text,
            ar: row.answer_text_ar || ''
        } : null,
        responseText: row.response_text,
        responseValue: row.response_value
    }))

    return {
        id: submission.id,
        userId: submission.user_id,
        userEmail: submission.email,
        firstName: submission.first_name,
        lastName: submission.last_name,
        submittedAt: submission.submitted_at,
        ipAddress: submission.ip_address,
        sessionDurationSeconds: submission.session_duration_seconds,
        responses
    }
}

/**
 * Get detailed quiz analytics with date distribution
 */
export async function getDetailedQuizAnalytics(quizId: string): Promise<DetailedAnalytics> {
    const basicAnalytics = await getQuizAnalytics(quizId)

    // Get submissions by date (last 30 days)
    const dateResult = await query<{
        date: string
        count: string
    }>(`
    SELECT
      DATE(submitted_at) as date,
      COUNT(*) as count
    FROM quiz_submissions
    WHERE quiz_id = $1
      AND is_deleted = FALSE
      AND submitted_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(submitted_at)
    ORDER BY date ASC
  `, [quizId])

    return {
        ...basicAnalytics,
        submissionsByDate: dateResult.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count)
        }))
    }
}

// ============================================================================
// Progressive Submission Functions
// ============================================================================

/**
 * Start a new quiz attempt for a user
 */
export async function startQuizAttempt(userId: string, quizId: string): Promise<string> {
    const result = await query<QuizAttemptRow>(`
    INSERT INTO quiz_attempts
    (quiz_id, user_id, current_question_index, started_at, last_activity_at, total_active_seconds, is_completed)
    VALUES ($1, $2, 0, NOW(), NOW(), 0, FALSE)
    RETURNING *
  `, [quizId, userId])

    return result.rows[0].id
}

/**
 * Submit a single answer for a quiz attempt
 * Returns the next question index
 */
export async function submitQuizAnswer(
    attemptId: string,
    questionId: string,
    answerId: string
): Promise<{ nextQuestionIndex: number; isComplete: boolean }> {
    return await transaction(async (client) => {
        // Get current attempt state
        const attemptResult = await client.query<QuizAttemptRow>(`
      SELECT * FROM quiz_attempts
      WHERE id = $1 AND is_deleted = FALSE AND is_completed = FALSE
      FOR UPDATE
    `, [attemptId])

        if (attemptResult.rows.length === 0) {
            throw new Error('Quiz attempt not found or already completed')
        }

        const attempt = attemptResult.rows[0]
        const currentQuestionIndex = attempt.current_question_index

        // Check if question was already answered
        const existingResponse = await client.query<{ id: string }>(`
            SELECT id FROM quiz_responses
            WHERE attempt_id = $1 AND question_id = $2 AND is_deleted = FALSE
        `, [attemptId, questionId])

        if (existingResponse.rows.length > 0) {
            throw new Error('Question already answered')
        }

        // Insert the response (will fail if constraint violated)
        await client.query(`
      INSERT INTO quiz_responses (attempt_id, question_id, answer_id, response_text, response_value)
      VALUES ($1, $2, $3, NULL, (
        SELECT answer_value FROM quiz_answers WHERE id = $3
      ))
    `, [attemptId, questionId, answerId])

        // Get total number of questions
        const quizResult = await client.query<{ question_count: string }>(`
      SELECT COUNT(*) as question_count
      FROM quiz_questions
      WHERE quiz_id = $1 AND is_deleted = FALSE
    `, [attempt.quiz_id])

        const totalQuestions = parseInt(quizResult.rows[0].question_count)
        const nextQuestionIndex = currentQuestionIndex + 1
        const isComplete = nextQuestionIndex >= totalQuestions

        // Update attempt: increment question index and update last activity timestamp
        // Note: total_active_seconds is tracked via heartbeat (update-activity endpoint)
        // We don't add time here to avoid double-counting with heartbeats
        await client.query(`
      UPDATE quiz_attempts
      SET current_question_index = $1,
          last_activity_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `, [nextQuestionIndex, attemptId])

        return {
            nextQuestionIndex,
            isComplete
        }
    })
}

/**
 * Get a quiz attempt by ID
 */
export async function getQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const result = await query<QuizAttemptRow>(`
    SELECT * FROM quiz_attempts
    WHERE id = $1 AND is_deleted = FALSE
  `, [attemptId])

    if (result.rows.length === 0) {
        return null
    }

    const row = result.rows[0]
    return {
        id: row.id,
        quizId: row.quiz_id,
        userId: row.user_id,
        currentQuestionIndex: row.current_question_index,
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
        totalActiveSeconds: row.total_active_seconds,
        isCompleted: row.is_completed
    }
}

/**
 * Get an incomplete quiz attempt for a user and quiz
 */
export async function getQuizAttemptByUserAndQuiz(
    userId: string,
    quizId: string
): Promise<QuizAttempt | null> {
    const result = await query<QuizAttemptRow>(`
    SELECT * FROM quiz_attempts
    WHERE user_id = $1 AND quiz_id = $2 AND is_completed = FALSE AND is_deleted = FALSE
    ORDER BY created_at DESC
    LIMIT 1
  `, [userId, quizId])

    if (result.rows.length === 0) {
        return null
    }

    const row = result.rows[0]
    return {
        id: row.id,
        quizId: row.quiz_id,
        userId: row.user_id,
        currentQuestionIndex: row.current_question_index,
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
        totalActiveSeconds: row.total_active_seconds,
        isCompleted: row.is_completed
    }
}

/**
 * Get all responses for a quiz attempt
 */
export async function getAttemptResponses(attemptId: string): Promise<AttemptResponse[]> {
    const result = await query<{
        question_id: string
        answer_id: string
    }>(`
    SELECT question_id, answer_id
    FROM quiz_responses
    WHERE attempt_id = $1 AND submission_id IS NULL AND is_deleted = FALSE
  `, [attemptId])

    return result.rows.map(row => ({
        questionId: row.question_id,
        answerId: row.answer_id
    }))
}

/**
 * Finalize a quiz attempt into a submission
 * Returns the submission ID
 */
export async function finalizeQuizSubmission(
    attemptId: string,
    options?: SubmitQuizOptions
): Promise<string> {
    return await transaction(async (client) => {
        // Get the attempt
        const attemptResult = await client.query<QuizAttemptRow>(`
      SELECT * FROM quiz_attempts
      WHERE id = $1 AND is_completed = FALSE AND is_deleted = FALSE
      FOR UPDATE
    `, [attemptId])

        if (attemptResult.rows.length === 0) {
            throw new Error('Quiz attempt not found or already completed')
        }

        const attempt = attemptResult.rows[0]

        // Create submission
        const submissionResult = await client.query<SubmissionRow>(`
      INSERT INTO quiz_submissions
      (quiz_id, user_id, event_id, attempt_id, ip_address, user_agent, session_duration_seconds)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            attempt.quiz_id,
            attempt.user_id,
            options?.eventId || null,
            attemptId,
            options?.ipAddress || null,
            options?.userAgent || null,
            attempt.total_active_seconds
        ])

        const submissionId = submissionResult.rows[0].id

        // Link all responses to the submission
        await client.query(`
      UPDATE quiz_responses
      SET submission_id = $1
      WHERE attempt_id = $2 AND submission_id IS NULL AND is_deleted = FALSE
    `, [submissionId, attemptId])

        // Mark attempt as completed
        await client.query(`
      UPDATE quiz_attempts
      SET is_completed = TRUE,
          updated_at = NOW()
      WHERE id = $1
    `, [attemptId])

        return submissionId
    })
}

/**
 * Update quiz attempt activity timestamp and add active time
 * This is called via heartbeat from frontend (e.g., every 30 seconds)
 * Each call adds HEARTBEAT_INTERVAL_SECONDS to total_active_seconds
 * Returns the new total active seconds
 */
const HEARTBEAT_INTERVAL_SECONDS = 30

export async function updateQuizAttemptActivity(attemptId: string): Promise<number> {
    const result = await query<{ total_active_seconds: number }>(`
    UPDATE quiz_attempts
    SET last_activity_at = NOW(),
        total_active_seconds = total_active_seconds + $1,
        updated_at = NOW()
    WHERE id = $2 AND is_completed = FALSE AND is_deleted = FALSE
    RETURNING total_active_seconds
  `, [HEARTBEAT_INTERVAL_SECONDS, attemptId])

    if (result.rows.length === 0) {
        throw new Error('Quiz attempt not found or already completed')
    }

    return result.rows[0].total_active_seconds
}

