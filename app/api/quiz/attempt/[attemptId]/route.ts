import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getQuizAttempt, getAttemptResponses } from '@/lib/quiz'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ attemptId: string }> }
) {
    try {
        const authUser = await getCurrentUser()
        if (!authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { attemptId } = await params

        const attempt = await getQuizAttempt(attemptId)
        if (!attempt) {
            return NextResponse.json(
                { error: 'Attempt not found' },
                { status: 404 }
            )
        }

        // Verify user owns this attempt
        if (attempt.userId !== authUser.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Get responses if attempt is not completed
        const responses = attempt.isCompleted ? [] : await getAttemptResponses(attemptId)

        return NextResponse.json({
            attempt: {
                id: attempt.id,
                quizId: attempt.quizId,
                currentQuestionIndex: attempt.currentQuestionIndex,
                startedAt: attempt.startedAt,
                lastActivityAt: attempt.lastActivityAt,
                totalActiveSeconds: attempt.totalActiveSeconds,
                isCompleted: attempt.isCompleted
            },
            responses
        })

    } catch (error) {
        console.error('Error fetching quiz attempt:', error)
        return NextResponse.json(
            { error: 'Failed to fetch attempt' },
            { status: 500 }
        )
    }
}
