-- Update plan_duration
CREATE OR REPLACE FUNCTION public.plan_duration(_plan access_plan)
 RETURNS interval
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _plan
    WHEN 'free' THEN interval '30 days'
    WHEN 'days_30' THEN interval '30 days'
    WHEN 'days_60' THEN interval '60 days'
    WHEN 'days_90' THEN interval '90 days'
    WHEN 'days_180' THEN interval '180 days'
    WHEN 'premium' THEN interval '366 days'
  END
$function$;

-- expert_pack_settings table
CREATE TABLE IF NOT EXISTS public.expert_pack_settings (
  id integer PRIMARY KEY DEFAULT 1,
  price text NOT NULL DEFAULT 'R$ 20',
  old_price text,
  duration_days integer NOT NULL DEFAULT 30,
  duration_label text NOT NULL DEFAULT '30 dias',
  benefits jsonb NOT NULL DEFAULT '["Libera modo Expert do Simulado por 30 dias", "Não altera seu plano principal", "Acesso imediato após confirmação"]'::jsonb,
  highlight text,
  locked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT expert_pack_singleton CHECK (id = 1)
);

ALTER TABLE public.expert_pack_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read expert pack settings"
  ON public.expert_pack_settings FOR SELECT USING (true);

CREATE POLICY "Admin insert expert pack settings"
  ON public.expert_pack_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update expert pack settings"
  ON public.expert_pack_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.expert_pack_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- purchase_expert_pack RPC
CREATE OR REPLACE FUNCTION public.purchase_expert_pack(_user_id uuid, _days integer DEFAULT 30)
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
    RAISE EXCEPTION 'Apenas admin pode liberar Pacote Expert';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();
  SELECT email, expert_unlocked_until INTO v_student_email, v_current
    FROM public.profiles WHERE id = _user_id;

  IF v_student_email IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  v_base := GREATEST(COALESCE(v_current, now()), now());

  UPDATE public.profiles
    SET expert_unlocked_until = v_base + (_days || ' days')::interval
    WHERE id = _user_id;

  INSERT INTO public.study_unlock_logs (admin_id, admin_email, student_id, student_email, action)
  VALUES (auth.uid(), v_admin_email, _user_id, v_student_email, 'expert_pack_' || _days || 'd');
END;
$function$;

-- Insert plan_settings row for days_180
INSERT INTO public.plan_settings (plan, price, duration_label, benefits, locked)
VALUES (
  'days_180'::access_plan,
  'R$ 100',
  '180 dias renováveis',
  '["Acesso completo por 180 dias", "Chat com Professor IA", "Simulados ilimitados", "Modo Expert disponível"]'::jsonb,
  false
)
ON CONFLICT (plan) DO NOTHING;