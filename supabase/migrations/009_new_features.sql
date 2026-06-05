-- ============================================================
-- Lagos Data School — New Features Migration
-- Run AFTER all previous migrations (001–008)
-- ============================================================

-- ── 1. Extend users ──────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS notification_prefs  jsonb NOT NULL DEFAULT '{
    "new_lessons": true,
    "course_updates": true,
    "assignment_deadlines": true,
    "scholarship_updates": true,
    "weekly_report": true,
    "marketing": false
  }'::jsonb;

-- ── 2. Extend lessons ────────────────────────────────────────
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;

-- ── 3. Extend lesson_progress (watch position) ───────────────
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS watch_position  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_watched_at timestamptz;

-- ── 4. Notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  message    text        NOT NULL,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: user reads own"   ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications: user updates own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications: user deletes own" ON public.notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "notifications: admin insert"     ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- ── 5. Lesson bookmarks ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_bookmarks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id  uuid        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS lesson_bookmarks_user_id_idx ON public.lesson_bookmarks(user_id);
ALTER TABLE public.lesson_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks: user reads own"   ON public.lesson_bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bookmarks: user inserts own" ON public.lesson_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks: user deletes own" ON public.lesson_bookmarks FOR DELETE USING (user_id = auth.uid());

-- ── 6. Course notes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_notes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id       uuid        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  note_text       text        NOT NULL,
  video_timestamp integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_notes_user_id_idx  ON public.course_notes(user_id);
CREATE INDEX IF NOT EXISTS course_notes_lesson_id_idx ON public.course_notes(lesson_id);
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes: user reads own"   ON public.course_notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notes: user inserts own" ON public.course_notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes: user updates own" ON public.course_notes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes: user deletes own" ON public.course_notes FOR DELETE USING (user_id = auth.uid());

-- ── 7. Lesson materials ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_materials (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  uuid    REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id  uuid    REFERENCES public.courses(id) ON DELETE CASCADE,
  file_name  text    NOT NULL,
  file_url   text    NOT NULL,
  file_type  text    NOT NULL DEFAULT 'pdf',
  file_size  integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_materials_lesson_id_idx ON public.lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_materials_course_id_idx ON public.lesson_materials(course_id);
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
-- Enrolled students can read materials for their courses
CREATE POLICY "materials: enrolled students read" ON public.lesson_materials FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = lesson_materials.course_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );
CREATE POLICY "materials: admin full access" ON public.lesson_materials FOR ALL USING (public.is_admin());

-- ── 8. Lesson comments (discussion) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id    uuid        REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  comment_text text        NOT NULL,
  upvotes      integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_comments_lesson_id_idx ON public.lesson_comments(lesson_id);
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments: enrolled students read" ON public.lesson_comments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.enrollments e ON e.course_id = m.course_id
      WHERE l.id = lesson_comments.lesson_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );
CREATE POLICY "comments: enrolled students insert" ON public.lesson_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.enrollments e ON e.course_id = m.course_id
      WHERE l.id = lesson_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );
CREATE POLICY "comments: owner deletes own" ON public.lesson_comments FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- ── 9. Support tickets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id  uuid        REFERENCES public.courses(id),
  subject    text        NOT NULL,
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets: user reads own"    ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tickets: user inserts own"  ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tickets: admin full access" ON public.support_tickets FOR ALL USING (public.is_admin());

-- ── 10. Coupons ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text        NOT NULL UNIQUE,
  discount_type  text        NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric     NOT NULL,
  max_uses       integer,
  used_count     integer     NOT NULL DEFAULT 0,
  applies_to     text        NOT NULL DEFAULT 'all',
  course_id      uuid        REFERENCES public.courses(id),
  expires_at     timestamptz,
  active         boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons: admin full access"   ON public.coupons FOR ALL USING (public.is_admin());
CREATE POLICY "coupons: anyone reads active" ON public.coupons FOR SELECT USING (active = true AND auth.uid() IS NOT NULL);

-- ── 11. Coupon redemptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coupon_id   uuid        NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  payment_id  uuid        REFERENCES public.payments(id),
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions: user reads own"   ON public.coupon_redemptions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "redemptions: admin full access" ON public.coupon_redemptions FOR ALL USING (public.is_admin());

-- ── 12. Announcements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  message      text        NOT NULL,
  target       text        NOT NULL DEFAULT 'all',
  course_id    uuid        REFERENCES public.courses(id),
  send_email   boolean     NOT NULL DEFAULT false,
  send_notif   boolean     NOT NULL DEFAULT true,
  scheduled_at timestamptz,
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements: admin full access" ON public.announcements FOR ALL USING (public.is_admin());
CREATE POLICY "announcements: students read"     ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 13. Quizzes (module-level) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     uuid    REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id     uuid    NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title         text    NOT NULL,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit    integer,   -- minutes, null = unlimited
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quizzes_module_id_idx ON public.quizzes(module_id);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes: admin full access" ON public.quizzes FOR ALL USING (public.is_admin());
CREATE POLICY "quizzes: enrolled students read" ON public.quizzes FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = quizzes.course_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );

-- ── 14. Quiz questions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         uuid    NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text   text    NOT NULL,
  question_type   text    NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options         jsonb,  -- [{text, correct}]
  correct_answer  text,   -- for short_answer
  points          integer NOT NULL DEFAULT 1,
  order_index     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_questions: admin full access" ON public.quiz_questions FOR ALL USING (public.is_admin());
CREATE POLICY "quiz_questions: enrolled students read" ON public.quiz_questions FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.enrollments e ON e.course_id = q.course_id
      WHERE q.id = quiz_questions.quiz_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );

-- ── 15. Quiz attempts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     uuid    NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id     uuid    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answers     jsonb   NOT NULL DEFAULT '[]'::jsonb,
  score       integer,
  passed      boolean,
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON public.quiz_attempts(user_id);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_attempts: user reads own" ON public.quiz_attempts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "quiz_attempts: user inserts own" ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── 16. Assignments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid    NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id       uuid    REFERENCES public.lessons(id) ON DELETE SET NULL,
  module_id       uuid    REFERENCES public.modules(id) ON DELETE SET NULL,
  title           text    NOT NULL,
  instructions    text    NOT NULL DEFAULT '',
  due_date        timestamptz,
  points_possible integer NOT NULL DEFAULT 100,
  submission_type text    NOT NULL DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'url')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assignments_course_id_idx ON public.assignments(course_id);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments: admin full access" ON public.assignments FOR ALL USING (public.is_admin());
CREATE POLICY "assignments: enrolled students read" ON public.assignments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = assignments.course_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'paid'
    )
  );

-- ── 17. Assignment submissions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid    NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id         uuid    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url        text,
  text_content    text,
  url_content     text,
  score           integer,
  feedback        text,
  graded_at       timestamptz,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);
CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON public.submissions(user_id);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions: user reads own" ON public.submissions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "submissions: user inserts own" ON public.submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions: user updates own" ON public.submissions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions: admin full access" ON public.submissions FOR ALL USING (public.is_admin());

-- ── 18. Email templates ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text  NOT NULL UNIQUE,
  subject      text  NOT NULL,
  html_body    text  NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates: admin full access" ON public.email_templates FOR ALL USING (public.is_admin());

-- ── 19. Seed default email templates ─────────────────────────
INSERT INTO public.email_templates (template_key, subject, html_body) VALUES
('welcome',              'Welcome to Lagos Data School!',           '<p>Hello {{student_name}}, welcome to Lagos Data School Limited!</p>'),
('enrollment',           'Enrollment Confirmed — {{course_name}}',  '<p>Hello {{student_name}}, you are now enrolled in {{course_name}}.</p>'),
('certificate_earned',   'Certificate Earned — {{course_name}}',    '<p>Congratulations {{student_name}}! Your certificate for {{course_name}} is ready.</p>'),
('scholarship_approved', 'Scholarship Approved!',                   '<p>Hello {{student_name}}, your scholarship application has been approved!</p>'),
('scholarship_rejected', 'Scholarship Application Update',          '<p>Hello {{student_name}}, unfortunately your scholarship application was not approved at this time.</p>'),
('assignment_graded',    'Assignment Graded — {{assignment_title}}', '<p>Hello {{student_name}}, your assignment {{assignment_title}} has been graded. Score: {{score}}/{{total}}.</p>')
ON CONFLICT (template_key) DO NOTHING;
