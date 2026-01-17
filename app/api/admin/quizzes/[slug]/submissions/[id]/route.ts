import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import { getSubmissionDetails, getQuizBySlug } from '@/lib/quiz'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
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

    const { id: submissionId } = await params
    const submission = await getSubmissionDetails(submissionId)

    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      submission,
    })
  } catch (error) {
    console.error('Get submission details error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch submission details' },
      { status: 500 }
    )
  }
}
