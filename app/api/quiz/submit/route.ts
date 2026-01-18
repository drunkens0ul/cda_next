import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
    getQuizById,
    hasUserSubmittedQuiz,
    submitQuiz,
    finalizeQuizSubmission
} from '@/lib/quiz'
import type { QuizResponse } from '@/lib/types/quiz'

interface SubmitQuizRequest {
    quizId?: string
    attemptId?: string
    eventId?: string
    responses?: QuizResponse[]
    sessionDuration?: number
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getCurrentUser()
        if (!authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body: SubmitQuizRequest = await request.json()
        const { quizId, attemptId, eventId, responses, sessionDuration } = body

        // Check if using new format (attemptId) or old format (quizId + responses)
        if (attemptId) {
            // New format: finalize an existing attempt
            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
            const userAgent = request.headers.get('user-agent') || 'unknown'

            const submissionId = await finalizeQuizSubmission(attemptId, {
                eventId,
                ipAddress,
                userAgent
            })

            return NextResponse.json({
                success: true,
                submissionId
            })
        } else if (quizId && responses && responses.length > 0) {
            // Old format: submit all responses at once (backward compatibility)
            if (!quizId || !responses || responses.length === 0) {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                )
            }

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

            if (!quiz.allowMultipleSubmissions) {
                const alreadySubmitted = await hasUserSubmittedQuiz(authUser.id, quizId)

                if (alreadySubmitted) {
                    return NextResponse.json(
                        { error: 'You have already submitted this quiz' },
                        { status: 400 }
                    )
                }
            }

            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
            const userAgent = request.headers.get('user-agent') || 'unknown'

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
        } else {
            return NextResponse.json(
                { error: 'Either attemptId or (quizId + responses) is required' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Error submitting quiz:', error)
        return NextResponse.json(
            { error: 'Failed to submit quiz' },
            { status: 500 }
        )
    }
}
