import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
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
        // Check authentication using unified auth helper
        const authUser = await getCurrentUser()
        if (!authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

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
            const alreadySubmitted = await hasUserSubmittedQuiz(authUser.id, quizId)

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
        const submissionId = await submitQuiz(quizId, authUser.id, responses, {
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
