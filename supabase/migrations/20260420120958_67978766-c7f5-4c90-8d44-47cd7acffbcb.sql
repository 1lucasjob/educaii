-- 1. Add chat_unlocked flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS chat_unlocked boolean NOT NULL DEFAULT false;

-- 2. Update admin_renew_user to also unlock chat
CREATE OR REPLACE FUNCTION public.admin_renew_user(_user_id uuid, _plan access_plan)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode renovar acesso';
  END IF;
  UPDATE public.profiles
  SET plan = _plan,
      access_expires_at = now() + public.plan_duration(_plan),
      chat_unlocked = CASE WHEN _plan = 'free' THEN chat_unlocked ELSE true END
  WHERE id = _user_id;
END;
$function$;

-- 3. Backfill: 90 DAYS and PREMIUM users get chat unlocked by default
UPDATE public.profiles SET chat_unlocked = true WHERE plan IN ('days_90', 'premium');

-- 4. Update handle_new_user so 90/PREMIUM new signups start with chat unlocked
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

  INSERT INTO public.profiles (id, email, secret_question, secret_answer_hash, reserve_code_hash, plan, access_expires_at, chat_unlocked)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'secret_question',
    NEW.raw_user_meta_data ->> 'secret_answer_hash',
    NEW.raw_user_meta_data ->> 'reserve_code_hash',
    COALESCE(v_plan, 'free'),
    COALESCE(v_expires, now() + interval '30 days'),
    CASE WHEN COALESCE(v_plan, 'free') IN ('days_90', 'premium') THEN true ELSE false END
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

-- 5. Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own chat"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own chat"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own chat"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);