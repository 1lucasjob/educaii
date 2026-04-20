-- 1. Audit table for study unlocks
CREATE TABLE public.study_unlock_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id uuid NOT NULL,
  admin_email text,
  student_id uuid NOT NULL,
  student_email text NOT NULL,
  previous_topic text,
  action text NOT NULL DEFAULT 'unlock'
);

ALTER TABLE public.study_unlock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view unlock logs"
  ON public.study_unlock_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert unlock logs"
  ON public.study_unlock_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_study_unlock_logs_created ON public.study_unlock_logs (created_at DESC);

-- 2. Chat retention columns
ALTER TABLE public.chat_messages
  ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 days'),
  ADD COLUMN pinned boolean NOT NULL DEFAULT false;

CREATE INDEX idx_chat_messages_expires ON public.chat_messages (user_id, expires_at);

-- 3. RPC to unlock study + log
CREATE OR REPLACE FUNCTION public.admin_unlock_study(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email text;
  v_student_email text;
  v_prev_topic text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode liberar estudo';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();
  SELECT email, current_topic INTO v_student_email, v_prev_topic
  FROM public.profiles WHERE id = _user_id;

  IF v_student_email IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  UPDATE public.profiles
    SET current_topic_unlocked = true
    WHERE id = _user_id;

  INSERT INTO public.study_unlock_logs (admin_id, admin_email, student_id, student_email, previous_topic, action)
  VALUES (auth.uid(), v_admin_email, _user_id, v_student_email, v_prev_topic, 'unlock');
END;
$$;