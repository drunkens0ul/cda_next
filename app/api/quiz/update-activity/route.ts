import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { updateQuizAttemptActivity } from '@/lib/quiz'

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
        const { attemptId } = body

        if (!attemptId) {
            return NextResponse.json(
                { error: 'Attempt ID is required' },
                { status: 400 }
            )
        }

        const totalActiveSeconds = await updateQuizAttemptActivity(attemptId)

        return NextResponse.json({
            success: true,
            totalActiveSeconds
        })

    } catch (error) {
        console.error('Error updating quiz activity:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to update activity'
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
