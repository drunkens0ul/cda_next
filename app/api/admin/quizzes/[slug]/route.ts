import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import {
    getQuizBySlug,
    updateQuiz as updateQuizLib,
    deleteQuiz as deleteQuizLib,
} from '@/lib/quiz'
import { logAdminAction } from '@/lib/audit'
import type { UpdateQuizData, QuizWithQuestions } from '@/lib/types/quiz'

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

    return NextResponse.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body: UpdateQuizData = await request.json()

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

    const quiz = await updateQuizLib(slug, body)

    // Log admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'quiz.update',
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
      message: 'Quiz updated successfully',
    })
  } catch (error) {
    console.error('Update quiz error:', error)
    if (error instanceof Error && error.message.includes('Quiz not found')) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      )
    }
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, message: 'A quiz with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const existingQuiz = await getQuizBySlug(slug)

    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      )
    }

    const deleted = await deleteQuizLib(slug)

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete quiz' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'quiz.delete',
      'quiz',
      {
        targetType: 'quiz',
        targetId: existingQuiz.id,
        targetIdentifier: existingQuiz.slug,
        details: {
          quizTitle: existingQuiz.title,
          quizSlug: existingQuiz.slug,
        } as Record<string, unknown>,
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
