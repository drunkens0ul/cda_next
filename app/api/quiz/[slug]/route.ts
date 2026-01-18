import { NextRequest, NextResponse } from 'next/server'
import { getQuizBySlug, hasUserSubmittedQuiz, getQuizAttemptByUserAndQuiz, getAttemptResponses } from '@/lib/quiz'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const quiz = await getQuizBySlug(slug)

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        // Check user submission status if authenticated
        const authUser = await getCurrentUser()
        let userStatus = null
        let attemptInfo = null

        if (authUser) {
            const hasSubmitted = await hasUserSubmittedQuiz(authUser.id, quiz.id)
            userStatus = {
                hasSubmitted,
                allowMultipleSubmissions: quiz.allowMultipleSubmissions
            }

            // Check for existing incomplete attempt
            const attempt = await getQuizAttemptByUserAndQuiz(authUser.id, quiz.id)
            if (attempt) {
                const responses = await getAttemptResponses(attempt.id)
                attemptInfo = {
                    attemptId: attempt.id,
                    currentQuestionIndex: attempt.currentQuestionIndex,
                    startedAt: attempt.startedAt,
                    totalActiveSeconds: attempt.totalActiveSeconds,
                    responses
                }
            }
        }

        return NextResponse.json({ ...quiz, userStatus, attemptInfo })

    } catch (error) {
        console.error('Error fetching quiz:', error)
        return NextResponse.json(
            { error: 'Failed to fetch quiz' },
            { status: 500 }
        )
    }
}
