// ============================================================================
// Quiz Types
// ============================================================================

export interface QuizAnswer {
    id: string
    text: { en: string; ar: string }
    value: number | null
}

export interface QuizQuestion {
    id: string
    question: { en: string; ar: string }
    type: string
    answers: QuizAnswer[]
    required: boolean
    order: number
}

export interface Quiz {
    id: string
    slug: string
    title: { en: string; ar: string }
    description: { en: string; ar: string }
    questions: QuizQuestion[]
    requiresAuth: boolean
    allowMultipleSubmissions: boolean
    eventId: string | null
    isActive: boolean
}

export interface QuizSubmission {
    id: string
    quizId: string
    userId: string
    eventId: string | null
    submittedAt: Date
    sessionDurationSeconds: number | null
}

export interface QuizResponse {
    questionId: string
    answerId?: string
    responseText?: string
}

export interface SubmissionResponse {
    question: {
        en: string
        ar: string
    }
    answer: {
        en: string
        ar: string
    } | null
    responseText: string | null
    responseValue: number | null
}

export interface QuizAnalytics {
    totalSubmissions: number
    averageDuration: number | null
    responseDistribution: {
        questionId: string
        questionText: string
        answerId: string
        answerText: string
        responseCount: number
    }[]
}

// ============================================================================
// Database Row Types (internal)
// ============================================================================

export interface QuizRow {
    id: string
    slug: string
    title: string
    title_ar: string
    description: string | null
    description_ar: string | null
    event_id: string | null
    is_active: boolean
    requires_auth: boolean
    allow_multiple_submissions: boolean
    is_deleted: boolean
    created_at: Date
    updated_at: Date
}

export interface QuestionRow {
    id: string
    quiz_id: string
    question_order: number
    question_text: string
    question_text_ar: string
    question_type: string
    is_required: boolean
    is_deleted: boolean
}

export interface AnswerRow {
    id: string
    question_id: string
    answer_order: number
    answer_text: string
    answer_text_ar: string
    answer_value: number | null
    is_deleted: boolean
}

export interface SubmissionRow {
    id: string
    quiz_id: string
    user_id: string
    event_id: string | null
    submitted_at: Date
    ip_address: string | null
    user_agent: string | null
    session_duration_seconds: number | null
    is_deleted: boolean
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SubmitQuizOptions {
    eventId?: string
    ipAddress?: string
    userAgent?: string
    sessionDuration?: number
}

export interface QuizListItem {
    id: string
    slug: string
    title: string
    titleAr: string
    submissionCount: number
    isActive: boolean
    eventId: string | null
    createdAt: Date
}

export type QuizWithQuestions = Quiz

export interface CreateQuizData {
    slug: string
    title: string
    titleAr: string
    description: string | null
    descriptionAr: string | null
    eventId: string | null
    isActive: boolean
    requiresAuth: boolean
    allowMultipleSubmissions: boolean
    questions: CreateQuestionData[]
}

export interface UpdateQuizData {
    title: string
    titleAr: string
    description: string | null
    descriptionAr: string | null
    eventId: string | null
    isActive: boolean
    requiresAuth: boolean
    allowMultipleSubmissions: boolean
    questions: UpdateQuestionData[]
}

export interface CreateQuestionData {
    questionOrder: number
    questionText: string
    questionTextAr: string
    questionType: 'multiple_choice' | 'rating' | 'text'
    isRequired: boolean
    answers: CreateAnswerData[]
}

export interface UpdateQuestionData {
    id?: string
    questionOrder: number
    questionText: string
    questionTextAr: string
    questionType: 'multiple_choice' | 'rating' | 'text'
    isRequired: boolean
    isDeleted?: boolean
    answers: UpdateAnswerData[]
}

export interface CreateAnswerData {
    answerOrder: number
    answerText: string
    answerTextAr: string
    answerValue: number | null
}

export interface UpdateAnswerData {
    id?: string
    answerOrder: number
    answerText: string
    answerTextAr: string
    answerValue: number | null
    isDeleted?: boolean
}

export interface SubmissionListItem {
    id: string
    userId: string
    userEmail: string
    firstName: string
    lastName: string | null
    submittedAt: Date
    ipAddress: string | null
    sessionDurationSeconds: number | null
}

export interface SubmissionDetail extends SubmissionListItem {
    responses: DetailedResponse[]
}

export interface DetailedResponse {
    questionId: string
    question: { en: string; ar: string }
    answerId: string | null
    answer: { en: string; ar: string } | null
    responseText: string | null
    responseValue: number | null
}

export interface GetSubmissionsParams {
    page?: number
    limit?: number
    search?: string
    startDate?: string
    endDate?: string
}

export interface GetSubmissionsResult {
    submissions: SubmissionListItem[]
    pagination: PaginationInfo
}

export interface PaginationInfo {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface DetailedAnalytics extends QuizAnalytics {
    submissionsByDate: DateDistribution[]
}

export interface DateDistribution {
    date: string
    count: number
}

