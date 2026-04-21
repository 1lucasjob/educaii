
UPDATE public.plan_settings SET benefits = '["Resumos e Simulado Fácil por 30 dias", "Chat com Professor Saraiva por 15 dias", "Simulado Difícil por 15 dias", "Análise de Desempenho com IA por 30 dias", "Extração de Trechos-Chave NÃO incluída (admin pode liberar 30d)", "Não participa do ranking", "Sem renovação"]'::jsonb WHERE plan = 'free';

UPDATE public.plan_settings SET benefits = '["Tudo do Plano 30 DAYS", "60 dias de acesso", "Simulado Difícil nos primeiros 10 dias", "Chat com Professor Saraiva nos primeiros 15 dias", "Análise de Desempenho com IA ilimitada (Difícil e Expert)", "Extração de Trechos-Chave (Pegar Nota) ilimitada", "Sem Simulado Expert"]'::jsonb WHERE plan = 'days_60';

UPDATE public.plan_settings SET benefits = '["Tudo do Plano 30 DAYS", "90 dias de acesso", "Simulado Difícil ilimitado", "Chat com Professor Saraiva ilimitado", "Análise de Desempenho com IA ilimitada (Difícil e Expert)", "Extração de Trechos-Chave (Pegar Nota) ilimitada", "Simulado Expert nos primeiros 10 dias", "Ranking e progresso completos"]'::jsonb WHERE plan = 'days_90';

UPDATE public.plan_settings SET benefits = '["Acesso por 180 dias", "Chat com Professor Saraiva ilimitado", "Simulados Fácil, Difícil e Expert ilimitados", "Análise de Desempenho com IA ilimitada", "Extração de Trechos-Chave (Pegar Nota) ilimitada", "Inclui um convite extra do Plano 30 DAYS"]'::jsonb WHERE plan = 'days_180';

UPDATE public.plan_settings SET benefits = '["1 ano de acesso", "Tudo dos planos anteriores", "Chat com Professor Saraiva ilimitado", "Simulado Expert ilimitado", "Análise de Desempenho com IA ilimitada", "Extração de Trechos-Chave (Pegar Nota) ilimitada", "Inclui um convite extra do Plano 60 DAYS", "Prioridade em novos recursos"]'::jsonb WHERE plan = 'premium';
