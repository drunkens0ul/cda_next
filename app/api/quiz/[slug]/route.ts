import { NextRequest, NextResponse } from 'next/server'
import { getQuizBySlug } from '@/lib/quiz'

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

        return NextResponse.json(quiz)

    } catch (error) {
        console.error('Error fetching quiz:', error)
        return NextResponse.json(
            { error: 'Failed to fetch quiz' },
            { status: 500 }
        )
    }
}
