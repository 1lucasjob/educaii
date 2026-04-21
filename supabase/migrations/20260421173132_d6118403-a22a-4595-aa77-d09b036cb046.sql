
-- Parte 1: Adicionar colunas de moderação de avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_pending_url text,
  ADD COLUMN IF NOT EXISTS avatar_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS avatar_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_reviewed_by uuid;

-- Constraint de valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_avatar_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_status_check
      CHECK (avatar_status IN ('none','pending','approved','rejected'));
  END IF;
END$$;

-- Parte 2: Atualizar handle_new_user (chat para days_60, expert 10 dias para days_90)
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

  -- Chat liberado para days_60, days_90, days_180 e premium
  v_chat_unlocked := v_plan IN ('days_60', 'days_90', 'days_180', 'premium');

  -- Expert: days_180/premium = todo o acesso; days_90 = primeiros 10 dias
  IF v_plan IN ('days_180', 'premium') THEN
    v_expert_until := v_expires;
  ELSIF v_plan = 'days_90' THEN
    v_expert_until := now() + interval '10 days';
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

-- Parte 3: Atualizar admin_renew_user
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
        WHEN _plan IN ('days_60', 'days_90', 'days_180', 'premium') THEN true
        WHEN _plan = 'free' THEN chat_unlocked
        ELSE chat_unlocked
      END,
      expert_unlocked_until = CASE
        WHEN _plan IN ('days_180', 'premium') THEN GREATEST(COALESCE(expert_unlocked_until, v_new_expires), v_new_expires)
        WHEN _plan = 'days_90' THEN GREATEST(COALESCE(expert_unlocked_until, now() + interval '10 days'), now() + interval '10 days')
        ELSE expert_unlocked_until
      END,
      days_30_renewals_count = CASE
        WHEN _plan = 'days_30' THEN days_30_renewals_count + 1
        ELSE days_30_renewals_count
      END
  WHERE id = _user_id;
END;
$function$;

-- Parte 4: RPCs de moderação de avatar
CREATE OR REPLACE FUNCTION public.admin_approve_avatar(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode aprovar imagens';
  END IF;

  SELECT avatar_pending_url INTO v_pending FROM public.profiles WHERE id = _user_id;
  IF v_pending IS NULL THEN
    RAISE EXCEPTION 'Nenhuma imagem pendente para este usuário';
  END IF;

  UPDATE public.profiles
    SET avatar_url = v_pending,
        avatar_pending_url = NULL,
        avatar_status = 'approved',
        avatar_reviewed_at = now(),
        avatar_reviewed_by = auth.uid()
    WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_reject_avatar(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode rejeitar imagens';
  END IF;

  UPDATE public.profiles
    SET avatar_pending_url = NULL,
        avatar_status = 'rejected',
        avatar_reviewed_at = now(),
        avatar_reviewed_by = auth.uid()
    WHERE id = _user_id;
END;
$function$;
