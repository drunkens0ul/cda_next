-- Quiz System Migration
-- Add support for quizzes with bilingual questions and answers
-- Created: 2026-01-17

-- ============================================================================
-- QUIZZES TABLE
-- Stores quiz metadata with bilingual support
-- ============================================================================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    description TEXT,
    description_ar TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT TRUE,
    allow_multiple_submissions BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_slug ON quizzes(slug);
CREATE INDEX idx_quizzes_event_id ON quizzes(event_id);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX idx_quizzes_is_deleted ON quizzes(is_deleted);

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE quizzes IS 'Quiz definitions with bilingual support';
COMMENT ON COLUMN quizzes.event_id IS 'Optional link to an event (e.g., post-event feedback)';
COMMENT ON COLUMN quizzes.requires_auth IS 'Whether user must be logged in to take quiz';
COMMENT ON COLUMN quizzes.allow_multiple_submissions IS 'Whether user can submit quiz multiple times';

-- ============================================================================
-- QUIZ QUESTIONS TABLE
-- Stores questions with bilingual support
-- ============================================================================
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text VARCHAR(1000) NOT NULL,
    question_text_ar VARCHAR(1000) NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'rating', 'text')),
    is_required BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, question_order)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, question_order);
CREATE INDEX idx_quiz_questions_is_deleted ON quiz_questions(is_deleted);

CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE quiz_questions IS 'Questions for quizzes with bilingual support';
COMMENT ON COLUMN quiz_questions.question_order IS 'Display order of questions (1-indexed)';

-- ============================================================================
-- QUIZ ANSWERS TABLE
-- Stores answer options with bilingual support
-- ============================================================================
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_order INTEGER NOT NULL,
    answer_text VARCHAR(500) NOT NULL,
    answer_text_ar VARCHAR(500) NOT NULL,
    answer_value INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, answer_order)
);

CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_order ON quiz_answers(question_id, answer_order);
CREATE INDEX idx_quiz_answers_is_deleted ON quiz_answers(is_deleted);

CREATE TRIGGER update_quiz_answers_updated_at
    BEFORE UPDATE ON quiz_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE quiz_answers IS 'Answer options for quiz questions with bilingual support';
COMMENT ON COLUMN quiz_answers.answer_order IS 'Display order of answers (1-indexed)';
COMMENT ON COLUMN quiz_answers.answer_value IS 'Optional numeric value for scoring/analysis';

-- ============================================================================
-- QUIZ SUBMISSIONS TABLE
-- Stores completed quiz submissions
-- ============================================================================
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    session_duration_seconds INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX idx_quiz_submissions_user_id ON quiz_submissions(user_id);
CREATE INDEX idx_quiz_submissions_event_id ON quiz_submissions(event_id);
CREATE INDEX idx_quiz_submissions_submitted_at ON quiz_submissions(submitted_at);
CREATE INDEX idx_quiz_submissions_is_deleted ON quiz_submissions(is_deleted);

COMMENT ON TABLE quiz_submissions IS 'Completed quiz submissions by users';
COMMENT ON COLUMN quiz_submissions.user_id IS 'NULL if anonymous submission allowed';
COMMENT ON COLUMN quiz_submissions.session_duration_seconds IS 'Time taken to complete quiz';

-- ============================================================================
-- QUIZ RESPONSES TABLE
-- Stores individual question responses
-- ============================================================================
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES quiz_answers(id) ON DELETE SET NULL,
    response_text TEXT,
    response_value INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

CREATE INDEX idx_quiz_responses_submission_id ON quiz_responses(submission_id);
CREATE INDEX idx_quiz_responses_question_id ON quiz_responses(question_id);
CREATE INDEX idx_quiz_responses_answer_id ON quiz_responses(answer_id);
CREATE INDEX idx_quiz_responses_is_deleted ON quiz_responses(is_deleted);

COMMENT ON TABLE quiz_responses IS 'Individual responses to quiz questions';
COMMENT ON COLUMN quiz_responses.answer_id IS 'For multiple choice questions';
COMMENT ON COLUMN quiz_responses.response_text IS 'For text-based questions';
COMMENT ON COLUMN quiz_responses.response_value IS 'Copied from answer_value for easier analysis';

-- ============================================================================
-- SEED DATA: Event Feedback Quiz
-- ============================================================================
DO $$
DECLARE
    quiz_uuid UUID;
    q1_uuid UUID;
    q2_uuid UUID;
    q3_uuid UUID;
    q4_uuid UUID;
    q5_uuid UUID;
BEGIN
    -- Create the quiz
    INSERT INTO quizzes (slug, title, title_ar, description, description_ar, is_active, requires_auth)
    VALUES (
        'event-feedback',
        'Event Feedback Quiz',
        'استبيان تقييم الفعالية',
        'Your feedback helps us improve future events',
        'ملاحظاتك تساعدنا على تحسين الفعاليات المستقبلية',
        TRUE,
        TRUE
    )
    RETURNING id INTO quiz_uuid;

    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_order, question_text, question_text_ar, question_type)
    VALUES (
        quiz_uuid,
        1,
        'How would you rate your overall experience at the event?',
        'كيف تقيّم تجربتك الشاملة في الفعالية؟',
        'multiple_choice'
    )
    RETURNING id INTO q1_uuid;

    INSERT INTO quiz_answers (question_id, answer_order, answer_text, answer_text_ar, answer_value)
    VALUES
        (q1_uuid, 1, 'Excellent', 'ممتاز', 5),
        (q1_uuid, 2, 'Good', 'جيد', 4),
        (q1_uuid, 3, 'Average', 'متوسط', 3),
        (q1_uuid, 4, 'Below Average', 'أقل من المتوسط', 2),
        (q1_uuid, 5, 'Poor', 'ضعيف', 1);

    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_order, question_text, question_text_ar, question_type)
    VALUES (
        quiz_uuid,
        2,
        'How would you rate the quality of the content presented?',
        'كيف تقيّم جودة المحتوى المقدم؟',
        'multiple_choice'
    )
    RETURNING id INTO q2_uuid;

    INSERT INTO quiz_answers (question_id, answer_order, answer_text, answer_text_ar, answer_value)
    VALUES
        (q2_uuid, 1, 'Excellent', 'ممتاز', 5),
        (q2_uuid, 2, 'Good', 'جيد', 4),
        (q2_uuid, 3, 'Average', 'متوسط', 3),
        (q2_uuid, 4, 'Below Average', 'أقل من المتوسط', 2),
        (q2_uuid, 5, 'Poor', 'ضعيف', 1);

    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_order, question_text, question_text_ar, question_type)
    VALUES (
        quiz_uuid,
        3,
        'How would you rate the speakers and presenters?',
        'كيف تقيّم المتحدثين والمقدمين؟',
        'multiple_choice'
    )
    RETURNING id INTO q3_uuid;

    INSERT INTO quiz_answers (question_id, answer_order, answer_text, answer_text_ar, answer_value)
    VALUES
        (q3_uuid, 1, 'Excellent', 'ممتاز', 5),
        (q3_uuid, 2, 'Good', 'جيد', 4),
        (q3_uuid, 3, 'Average', 'متوسط', 3),
        (q3_uuid, 4, 'Below Average', 'أقل من المتوسط', 2),
        (q3_uuid, 5, 'Poor', 'ضعيف', 1);

    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_order, question_text, question_text_ar, question_type)
    VALUES (
        quiz_uuid,
        4,
        'How likely are you to recommend this event to others?',
        'ما مدى احتمالية توصيتك بهذه الفعالية للآخرين؟',
        'multiple_choice'
    )
    RETURNING id INTO q4_uuid;

    INSERT INTO quiz_answers (question_id, answer_order, answer_text, answer_text_ar, answer_value)
    VALUES
        (q4_uuid, 1, 'Very Likely', 'محتمل جداً', 5),
        (q4_uuid, 2, 'Likely', 'محتمل', 4),
        (q4_uuid, 3, 'Neutral', 'محايد', 3),
        (q4_uuid, 4, 'Unlikely', 'غير محتمل', 2),
        (q4_uuid, 5, 'Very Unlikely', 'غير محتمل إطلاقاً', 1);

    -- Question 5
    INSERT INTO quiz_questions (quiz_id, question_order, question_text, question_text_ar, question_type)
    VALUES (
        quiz_uuid,
        5,
        'How would you rate the event organization and logistics?',
        'كيف تقيّم تنظيم الفعالية والترتيبات اللوجستية؟',
        'multiple_choice'
    )
    RETURNING id INTO q5_uuid;

    INSERT INTO quiz_answers (question_id, answer_order, answer_text, answer_text_ar, answer_value)
    VALUES
        (q5_uuid, 1, 'Excellent', 'ممتاز', 5),
        (q5_uuid, 2, 'Good', 'جيد', 4),
        (q5_uuid, 3, 'Average', 'متوسط', 3),
        (q5_uuid, 4, 'Below Average', 'أقل من المتوسط', 2),
        (q5_uuid, 5, 'Poor', 'ضعيف', 1);

END $$;
