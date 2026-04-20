-- Plan settings table: editable plan data (price, benefits, highlight)
CREATE TABLE public.plan_settings (
  plan public.access_plan PRIMARY KEY,
  price text NOT NULL DEFAULT '',
  old_price text,
  duration_label text NOT NULL DEFAULT '',
  highlight text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (even logged out) can read plan settings (public pricing)
CREATE POLICY "Anyone read plan settings"
ON public.plan_settings FOR SELECT
USING (true);

-- Only admins can insert/update
CREATE POLICY "Admin insert plan settings"
ON public.plan_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update plan settings"
ON public.plan_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_plan_settings_updated_at
BEFORE UPDATE ON public.plan_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.plan_settings (plan, price, old_price, duration_label, highlight, benefits) VALUES
('days_30', 'R$ 10', 'R$ 20', '30 dias renováveis', NULL,
  '["Acesso completo aos estudos","Quizzes ilimitados (fácil e difícil)","Simulados oficiais","Ranking e progresso","Renovação flexível"]'::jsonb),
('days_90', 'R$ 25', 'R$ 60', '90 dias renováveis', 'Mais escolhido',
  '["Tudo do plano 30 DAYS","3 meses de acesso contínuo","Melhor custo por dia","Chat com Professor Saraiva (sob liberação)"]'::jsonb),
('premium', 'R$ 100', 'R$ 240', '366 dias renováveis', 'Melhor custo-benefício',
  '["Tudo dos planos anteriores","1 ano completo de acesso","Chat com Professor Saraiva liberado","Prioridade em novos recursos","Acesso antecipado a simulados"]'::jsonb);