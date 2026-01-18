import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { submitQuizAnswer } from '@/lib/quiz'

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
        const { attemptId, questionId, answerId } = body

        if (!attemptId || !questionId || !answerId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await submitQuizAnswer(attemptId, questionId, answerId)

        return NextResponse.json({
            success: true,
            nextQuestionIndex: result.nextQuestionIndex,
            isComplete: result.isComplete
        })

    } catch (error) {
        console.error('Error submitting quiz answer:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer'

        // Return 409 Conflict for "Question already answered"
        if (errorMessage === 'Question already answered') {
            return NextResponse.json(
                { error: 'questionAlreadyAnswered' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
