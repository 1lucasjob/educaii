-- Atualiza handle_new_user para liberar chat e expert para os planos que prometem
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.access_plan := 'free';
  v_expires timestamptz := now() + interval '30 days';
  v_token text;
  v_chat_unlocked boolean;
  v_expert_until timestamptz;
BEGIN
  v_token := NEW.raw_user_meta_data ->> 'invite_token';

  IF v_token IS NOT NULL THEN
    SELECT plan,
           COALESCE(access_expires_at, now() + public.plan_duration(plan))
      INTO v_plan, v_expires
    FROM public.invites
    WHERE token = v_token
    LIMIT 1;
  END IF;

  v_plan := COALESCE(v_plan, 'free');
  v_expires := COALESCE(v_expires, now() + interval '30 days');

  -- Chat liberado para days_90, days_180 e premium
  v_chat_unlocked := v_plan IN ('days_90', 'days_180', 'premium');

  -- Modo Expert liberado para days_180 e premium (durante todo o acesso)
  IF v_plan IN ('days_180', 'premium') THEN
    v_expert_until := v_expires;
  ELSE
    v_expert_until := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, secret_question, secret_answer_hash, reserve_code_hash, plan, access_expires_at, chat_unlocked, expert_unlocked_until)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'secret_question',
    NEW.raw_user_meta_data ->> 'secret_answer_hash',
    NEW.raw_user_meta_data ->> 'reserve_code_hash',
    v_plan,
    v_expires,
    v_chat_unlocked,
    v_expert_until
  );

  IF NEW.email = '1lucasjob@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Atualiza admin_renew_user para também liberar expert no days_180/premium
CREATE OR REPLACE FUNCTION public.admin_renew_user(_user_id uuid, _plan access_plan)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_expires timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode renovar acesso';
  END IF;

  v_new_expires := now() + public.plan_duration(_plan);

  UPDATE public.profiles
  SET plan = _plan,
      access_expires_at = v_new_expires,
      chat_unlocked = CASE
        WHEN _plan IN ('days_90', 'days_180', 'premium') THEN true
        WHEN _plan = 'free' THEN chat_unlocked
        ELSE chat_unlocked
      END,
      expert_unlocked_until = CASE
        WHEN _plan IN ('days_180', 'premium') THEN GREATEST(COALESCE(expert_unlocked_until, v_new_expires), v_new_expires)
        ELSE expert_unlocked_until
      END,
      days_30_renewals_count = CASE
        WHEN _plan = 'days_30' THEN days_30_renewals_count + 1
        ELSE days_30_renewals_count
      END
  WHERE id = _user_id;
END;
$function$;

-- Backfill: corrige usuários atuais com plano days_180 que não receberam os benefícios
UPDATE public.profiles
SET chat_unlocked = true,
    expert_unlocked_until = GREATEST(COALESCE(expert_unlocked_until, access_expires_at), COALESCE(access_expires_at, now()))
WHERE plan = 'days_180';