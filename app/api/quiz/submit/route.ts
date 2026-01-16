import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import {
    getQuizById,
    hasUserSubmittedQuiz,
    submitQuiz
} from '@/lib/quiz'
import type { QuizResponse } from '@/lib/types/quiz'

interface SubmitQuizRequest {
    quizId: string
    eventId?: string
    responses: QuizResponse[]
    sessionDuration?: number
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session_token')?.value

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify session and get user
        const sessionResult = await query<{ user_id: string }>(`
      SELECT user_id FROM sessions 
      WHERE session_token = $1 
      AND expires_at > NOW() 
      AND is_deleted = FALSE
    `, [sessionToken])

        if (sessionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 401 }
            )
        }

        const userId = sessionResult.rows[0].user_id

        const body: SubmitQuizRequest = await request.json()
        const { quizId, eventId, responses, sessionDuration } = body

        if (!quizId || !responses || responses.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Verify quiz exists and is active
        const quiz = await getQuizById(quizId)

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        if (!quiz.isActive) {
            return NextResponse.json(
                { error: 'Quiz is not active' },
                { status: 400 }
            )
        }

        // Check if user already submitted (if not allowing multiple submissions)
        if (!quiz.allowMultipleSubmissions) {
            const alreadySubmitted = await hasUserSubmittedQuiz(userId, quizId)

            if (alreadySubmitted) {
                return NextResponse.json(
                    { error: 'You have already submitted this quiz' },
                    { status: 400 }
                )
            }
        }

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Submit quiz using library function
        const submissionId = await submitQuiz(quizId, userId, responses, {
            eventId,
            ipAddress,
            userAgent,
            sessionDuration
        })

        return NextResponse.json({
            success: true,
            submissionId
        })

    } catch (error) {
        console.error('Error submitting quiz:', error)
        return NextResponse.json(
            { error: 'Failed to submit quiz' },
            { status: 500 }
        )
    }
}
