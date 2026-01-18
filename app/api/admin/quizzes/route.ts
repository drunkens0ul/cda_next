import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import {
    getAllQuizzesForAdmin,
    createQuiz as createQuizLib,
} from '@/lib/quiz'
import { logAdminAction } from '@/lib/audit'
import type { CreateQuizData, QuizListItem } from '@/lib/types/quiz'

export async function GET() {
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

    const quizzes = await getAllQuizzesForAdmin()

    return NextResponse.json({
      success: true,
      quizzes,
    })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body: CreateQuizData = await request.json()

    // Validate required fields
    if (!body.title || !body.titleAr) {
      return NextResponse.json(
        { success: false, message: 'Title and Arabic title are required' },
        { status: 400 }
      )
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Validate multiple choice questions have at least 2 answers
    for (const question of body.questions) {
      if (question.questionType === 'multiple_choice') {
        if (!question.answers || question.answers.length < 2) {
          return NextResponse.json(
            { success: false, message: 'Multiple choice questions must have at least 2 answers' },
            { status: 400 }
          )
        }
      }
    }

    const quiz = await createQuizLib(body)

    // Log admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'quiz.create',
      'quiz',
      {
        targetType: 'quiz',
        targetId: quiz.id,
        targetIdentifier: quiz.slug,
        details: {
          quizTitle: quiz.title,
          quizSlug: quiz.slug,
          questionCount: body.questions.length,
        } as Record<string, unknown>,
      }
    )

    return NextResponse.json({
      success: true,
      quiz,
      message: 'Quiz created successfully',
    })
  } catch (error) {
    console.error('Create quiz error:', error)
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, message: 'A quiz with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}
