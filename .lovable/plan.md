

## Objetivo

Após o resultado final dos simulados **Difícil** e **Expert**, adicionar uma opção **"Análise de Desempenho"** que gera, via IA, uma análise personalizada do desempenho do aluno na tentativa (acertos, erros, padrões, recomendações de estudo).

**Regras de acesso:**
- Liberado para planos **60 DAYS, 90 DAYS, 180 DAYS e PREMIUM** (sempre).
- Incluso no plano **FREE pelos primeiros 30 dias** após o cadastro.
- **ADMIN** sempre tem acesso.
- Plano **30 DAYS** não inclui (precisa fazer upgrade).

---

## Parte 1 — Lógica de acesso (`src/lib/freeTrial.ts`)

Nova função `performanceAnalysisActive`:

```ts
export function performanceAnalysisActive(opts: {
  plan: AccessPlan | null | undefined;
  createdAt: string | null | undefined;
  isAdmin?: boolean;
}): boolean {
  if (opts.isAdmin) return true;
  if (opts.plan && ["days_60", "days_90", "days_180", "premium"].includes(opts.plan)) return true;
  // FREE: primeiros 30 dias
  if (opts.plan === "free" && opts.createdAt) {
    const days = Math.floor((Date.now() - new Date(opts.createdAt).getTime()) / 86_400_000);
    return days < 30;
  }
  return false;
}
```

---

## Parte 2 — Edge Function `analyze-performance`

Nova função `supabase/functions/analyze-performance/index.ts`:

- **Input** (POST JSON): `{ topic, difficulty, score, total_points, time_spent_seconds, questions, answers }`
- **Modelo**: `google/gemini-2.5-flash` via Lovable AI Gateway (`LOVABLE_API_KEY`).
- **System prompt**: texto plano (sem markdown), responde em PT-BR, estruturado em seções claras:
  1. **Resumo geral** (1-2 parágrafos)
  2. **Pontos fortes** (o que acertou e por quê)
  3. **Pontos a melhorar** (padrões de erro, conceitos a revisar)
  4. **Plano de estudo recomendado** (3-5 passos práticos)
- Aplica `stripMarkdown` no servidor para garantir saída limpa.
- `verify_jwt = true` (precisa autenticação).
- Trata 429 e 402 com mensagem amigável (mesmo padrão de outras funções).

`supabase/config.toml`: adiciona bloco para `analyze-performance` se necessário (default já é `verify_jwt = true`, então provavelmente sem config).

---

## Parte 3 — UI no `src/pages/Simulado.tsx`

Apenas no estado **finalizado** (após `submit`), e apenas para `difficulty` em `["hard", "expert"]`:

- Importar `performanceAnalysisActive` e usar com `profile.plan`, `profile.created_at`, `isAdmin`.
- Novo card abaixo do resultado: **"Análise de Desempenho com IA"**.
  - Se **liberado**: botão "Gerar Análise" → chama edge function → exibe resultado em `<div className="whitespace-pre-line leading-relaxed space-y-3">`. Inclui botão "Copiar análise".
  - Se **bloqueado**: card com cadeado, texto explicativo ("Disponível a partir do plano 60 DAYS — incluso 30 dias grátis no FREE") e botão "Fazer upgrade" → `/app/planos`.
- Estados: `analysisLoading`, `analysisText`, `analysisError`.
- Não persiste no banco nesta primeira versão (geração sob demanda; pode ser regenerada).

---

## Arquivos afetados

### Novos
- `supabase/functions/analyze-performance/index.ts` — IA + system prompt em texto plano.

### Editados
- `src/lib/freeTrial.ts` — adiciona `performanceAnalysisActive`.
- `src/pages/Simulado.tsx` — novo card "Análise de Desempenho" no resultado final (hard/expert), com gating.

### Banco
- Sem migrações.

