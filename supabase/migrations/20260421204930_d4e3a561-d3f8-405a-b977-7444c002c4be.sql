CREATE TABLE public.quiz_in_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  topic text NOT NULL,
  difficulty public.quiz_difficulty NOT NULL,
  questions jsonb NOT NULL,
  answers jsonb NOT NULL,
  current_index integer NOT NULL DEFAULT 0,
  time_left integer NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  time_limit integer NOT NULL DEFAULT 0,
  saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_in_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quiz progress"
  ON public.quiz_in_progress FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own quiz progress"
  ON public.quiz_in_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own quiz progress"
  ON public.quiz_in_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own quiz progress"
  ON public.quiz_in_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_quiz_in_progress_user ON public.quiz_in_progress(user_id);