import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import { getQuizSubmissions, getQuizBySlug } from '@/lib/quiz'
import type { GetSubmissionsParams } from '@/lib/types/quiz'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUser = await getUserById(authUser.id)
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const quiz = await getQuizBySlug(slug)

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const submissionParams: GetSubmissionsParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }

    const result = await getQuizSubmissions(quiz.id, submissionParams)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Get quiz submissions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
