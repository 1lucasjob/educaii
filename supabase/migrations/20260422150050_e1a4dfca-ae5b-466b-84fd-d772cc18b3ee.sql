ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS model_quiz_unlocked_until timestamptz;

CREATE OR REPLACE FUNCTION public.admin_unlock_model_quiz(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_email text;
  v_student_email text;
  v_current timestamptz;
  v_base timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode liberar simulados dos modelos';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();
  SELECT email, model_quiz_unlocked_until INTO v_student_email, v_current
    FROM public.profiles WHERE id = _user_id;

  IF v_student_email IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  v_base := GREATEST(COALESCE(v_current, now()), now());

  UPDATE public.profiles
    SET model_quiz_unlocked_until = v_base + interval '30 days'
    WHERE id = _user_id;

  INSERT INTO public.study_unlock_logs (admin_id, admin_email, student_id, student_email, action)
  VALUES (auth.uid(), v_admin_email, _user_id, v_student_email, 'model_quiz_unlock_30d');
END;
$function$;