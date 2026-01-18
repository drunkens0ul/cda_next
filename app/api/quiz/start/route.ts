import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getQuizById, startQuizAttempt, getQuizAttemptByUserAndQuiz } from '@/lib/quiz'

export async function POST(request: NextRequest) {
    try {
        const authUser = await getCurrentUser()
        if (!authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { quizId } = body

        if (!quizId) {
            return NextResponse.json(
                { error: 'Quiz ID is required' },
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

        // Check if user already has an incomplete attempt
        const existingAttempt = await getQuizAttemptByUserAndQuiz(authUser.id, quizId)
        if (existingAttempt) {
            // Return existing attempt instead of creating new one
            return NextResponse.json({
                attemptId: existingAttempt.id,
                currentQuestionIndex: existingAttempt.currentQuestionIndex,
                startedAt: existingAttempt.startedAt,
                totalActiveSeconds: existingAttempt.totalActiveSeconds,
                isExisting: true
            })
        }

        // Create new attempt
        const attemptId = await startQuizAttempt(authUser.id, quizId)

        return NextResponse.json({
            attemptId,
            currentQuestionIndex: 0,
            isExisting: false
        })

    } catch (error) {
        console.error('Error starting quiz:', error)
        return NextResponse.json(
            { error: 'Failed to start quiz' },
            { status: 500 }
        )
    }
}
