-- 1. Enum de planos
CREATE TYPE public.access_plan AS ENUM ('free', 'days_30', 'days_90', 'premium');

-- 2. Coluna plan + expires_at em invites
ALTER TABLE public.invites
  ADD COLUMN plan public.access_plan NOT NULL DEFAULT 'free',
  ADD COLUMN access_expires_at timestamptz;

-- 3. Coluna plan + access_expires_at em profiles
ALTER TABLE public.profiles
  ADD COLUMN plan public.access_plan NOT NULL DEFAULT 'free',
  ADD COLUMN access_expires_at timestamptz;

-- 4. Backfill: profiles existentes viram FREE com 30 dias a partir de agora
UPDATE public.profiles
SET plan = 'free',
    access_expires_at = now() + interval '30 days'
WHERE access_expires_at IS NULL;

-- 5. Função helper que devolve a duração de cada plano
CREATE OR REPLACE FUNCTION public.plan_duration(_plan public.access_plan)
RETURNS interval
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN interval '30 days'
    WHEN 'days_30' THEN interval '30 days'
    WHEN 'days_90' THEN interval '90 days'
    WHEN 'premium' THEN interval '366 days'
  END
$$;

-- 6. Atualizar handle_new_user para herdar plan/expires do convite usado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan public.access_plan := 'free';
  v_expires timestamptz := now() + interval '30 days';
  v_token text;
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

  INSERT INTO public.profiles (id, email, secret_question, secret_answer_hash, reserve_code_hash, plan, access_expires_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'secret_question',
    NEW.raw_user_meta_data ->> 'secret_answer_hash',
    NEW.raw_user_meta_data ->> 'reserve_code_hash',
    COALESCE(v_plan, 'free'),
    COALESCE(v_expires, now() + interval '30 days')
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
$$;

-- 7. Garantir trigger no auth.users (caso não exista)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Permitir admin renovar/atualizar plano do aluno (já existe policy de UPDATE para admin)
-- 9. Função para o aluno renovar (apenas admin pode chamar via UI):
CREATE OR REPLACE FUNCTION public.admin_renew_user(_user_id uuid, _plan public.access_plan)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode renovar acesso';
  END IF;
  UPDATE public.profiles
  SET plan = _plan,
      access_expires_at = now() + public.plan_duration(_plan)
  WHERE id = _user_id;
END;
$$;