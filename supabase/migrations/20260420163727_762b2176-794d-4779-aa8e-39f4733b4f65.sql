ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expert_unlocked_until timestamptz NULL;

CREATE OR REPLACE FUNCTION public.admin_unlock_expert(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_email text;
  v_student_email text;
  v_prev_topic text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode liberar Expert';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();
  SELECT email, current_topic INTO v_student_email, v_prev_topic
  FROM public.profiles WHERE id = _user_id;

  IF v_student_email IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  UPDATE public.profiles
    SET expert_unlocked_until = now() + interval '1 day'
    WHERE id = _user_id;

  INSERT INTO public.study_unlock_logs (admin_id, admin_email, student_id, student_email, previous_topic, action)
  VALUES (auth.uid(), v_admin_email, _user_id, v_student_email, v_prev_topic, 'expert_unlock_24h');
END;
$function$;