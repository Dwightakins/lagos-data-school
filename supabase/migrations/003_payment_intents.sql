-- ============================================================
-- Payment intents
-- Stores the server-created payment expectation before Paystack opens.
-- Verification must match Paystack's paid amount against expected_amount.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text        NOT NULL UNIQUE,
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id       uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name     text        NOT NULL,
  payment_type    text        NOT NULL CHECK (payment_type IN ('full', 'scholarship')),
  expected_amount integer     NOT NULL,
  email           text        NOT NULL,
  full_name       text        NOT NULL DEFAULT '',
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON public.payment_intents(status);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_intents: student reads own"
  ON public.payment_intents FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payment_intents: admin full access"
  ON public.payment_intents FOR ALL
  USING (public.is_admin());
