-- Messages between admin and students
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject      TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  read         BOOLEAN     NOT NULL DEFAULT false,
  deleted_by_sender    BOOLEAN NOT NULL DEFAULT false,
  deleted_by_recipient BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx    ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx    ON public.messages(recipient_id, read) WHERE read = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own messages" ON public.messages
  FOR SELECT USING (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "users send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users update own messages" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "admin full access" ON public.messages
  FOR ALL USING (public.is_admin());
