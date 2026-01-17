import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import { getDetailedQuizAnalytics, getQuizBySlug } from '@/lib/quiz'

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
    const searchParams = request.nextUrl.searchParams

    // Parse date range from query params
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get quiz by slug
    const quiz = await getQuizBySlug(slug)
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      )
    }

    const analytics = await getDetailedQuizAnalytics(quiz.id)

    // Filter submissions by date if provided
    let filteredSubmissionsByDate = analytics.submissionsByDate
    if (startDate) {
      filteredSubmissionsByDate = filteredSubmissionsByDate.filter(d => d.date >= startDate)
    }
    if (endDate) {
      filteredSubmissionsByDate = filteredSubmissionsByDate.filter(d => d.date <= endDate)
    }

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        submissionsByDate: filteredSubmissionsByDate,
      },
    })
  } catch (error) {
    console.error('Get quiz analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
