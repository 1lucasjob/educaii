
-- 1. Add column to profiles for admin-granted access window
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS saved_studies_unlocked_until timestamptz;

-- 2. Saved studies table
CREATE TABLE IF NOT EXISTS public.saved_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  summary text NOT NULL,
  saved_by_admin boolean NOT NULL DEFAULT false,
  saved_by_admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_studies_user ON public.saved_studies(user_id, created_at DESC);

ALTER TABLE public.saved_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved studies"
  ON public.saved_studies FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own saved studies"
  ON public.saved_studies FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own saved studies"
  ON public.saved_studies FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Limit-enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_saved_studies_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
  v_count int;
  v_is_admin boolean;
  v_plan public.access_plan;
BEGIN
  -- Admin-saved entries (saved by an admin into someone else's vault) don't count toward owner's limit
  -- but do count toward the admin's own vault when saved for himself.
  v_is_admin := public.has_role(NEW.user_id, 'admin');
  IF v_is_admin THEN
    v_limit := 7;
  ELSE
    SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
    IF v_plan = 'free' THEN
      v_limit := 3;
    ELSE
      v_limit := 5;
    END IF;
  END IF;

  SELECT count(*) INTO v_count
    FROM public.saved_studies
    WHERE user_id = NEW.user_id
      AND (NOT saved_by_admin OR v_is_admin);

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de estudos guardados atingido (% de %)', v_count, v_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_studies_limit ON public.saved_studies;
CREATE TRIGGER trg_saved_studies_limit
  BEFORE INSERT ON public.saved_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_saved_studies_limit();

-- 4. Admin unlock for 30 days
CREATE OR REPLACE FUNCTION public.admin_unlock_saved_studies(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email text;
  v_student_email text;
  v_current timestamptz;
  v_base timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode liberar Guardar Estudo';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();
  SELECT email, saved_studies_unlocked_until INTO v_student_email, v_current
    FROM public.profiles WHERE id = _user_id;

  IF v_student_email IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  v_base := GREATEST(COALESCE(v_current, now()), now());

  UPDATE public.profiles
    SET saved_studies_unlocked_until = v_base + interval '30 days'
    WHERE id = _user_id;

  INSERT INTO public.study_unlock_logs (admin_id, admin_email, student_id, student_email, action)
  VALUES (auth.uid(), v_admin_email, _user_id, v_student_email, 'saved_studies_unlock_30d');
END;
$$;

-- 5. Admin save into a student's vault
CREATE OR REPLACE FUNCTION public.admin_save_study_for_user(
  _user_id uuid, _title text, _body text, _summary text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode guardar estudo para um aluno';
  END IF;

  INSERT INTO public.saved_studies (user_id, title, body, summary, saved_by_admin, saved_by_admin_id)
  VALUES (_user_id, _title, _body, _summary, true, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
