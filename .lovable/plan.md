

## Objetivo

Restringir a funcionalidade **"Pegar Nota / Extração de Trechos-Chave"** aos planos **60 DAYS, 90 DAYS, 180 DAYS e PREMIUM**. Admin pode liberar temporariamente (30 dias) para qualquer aluno cadastrado, inclusive FREE/30 DAYS.

---

## Parte 1 — Banco de dados

### Migração SQL
- Adicionar coluna `highlights_unlocked_until timestamptz` em `public.profiles` (nullable).
- Criar RPC `admin_unlock_highlights(_user_id uuid)` (SECURITY DEFINER):
  - Valida `has_role(auth.uid(), 'admin')`.
  - Seta `highlights_unlocked_until = now() + interval '30 days'`.
  - Loga em `study_unlock_logs` com `action = 'highlights_unlock_30d'`.

### Atualizar `plan_settings.benefits` (UPDATE via insert tool)
Mencionar "Extração de Trechos-Chave" nos planos elegíveis:
- `days_60`, `days_90`, `days_180`, `premium`: incluir bullet "Extração de Trechos-Chave (Pegar Nota) ilimitada".
- `free` e `days_30`: deixar explícito que **não** inclui (ou pode ser liberado pelo admin por 30 dias).

---

## Parte 2 — Lógica de gating

### `src/lib/freeTrial.ts`
Nova função:
```ts
export function highlightsActive(opts: {
  plan: AccessPlan | null | undefined;
  highlightsUnlockedUntil: string | null | undefined;
}): boolean {
  if (opts.plan && ["days_60","days_90","days_180","premium"].includes(opts.plan)) return true;
  if (opts.highlightsUnlockedUntil) {
    return new Date(opts.highlightsUnlockedUntil).getTime() > Date.now();
  }
  return false;
}
```

### `src/contexts/AuthContext.tsx`
Adicionar `highlights_unlocked_until: string | null` ao tipo `Profile` e ao `select` (já carrega tudo via `*`, só ajustar tipo).

---

## Parte 3 — Frontend

### `src/pages/Estudar.tsx`
- Importar `highlightsActive`.
- Calcular `canExtractHighlights = highlightsActive({ plan: profile?.plan, highlightsUnlockedUntil: profile?.highlights_unlocked_until })`.
- Se `false`: substituir o botão/seção "Pegar Nota" por um card bloqueado com cadeado, texto "Disponível a partir do plano 60 DAYS" e CTA "Ver planos" → `/app/planos`.
- Se `true` mas via liberação ADM: mostrar pequeno selo "Liberado pelo admin · expira em X dias".

### `src/pages/Planos.tsx`
- Já lê `benefits` direto do banco — basta atualizar os textos via SQL (Parte 1). Sem mudança de código necessária.

### `src/pages/Admin.tsx`
- Adicionar nas linhas de cada aluno (cards mobile + tabela desktop) um botão **"Liberar Trechos (30d)"** ao lado de "Liberar Expert (24h)".
- Handler `unlockHighlights(userId, email)` chama `supabase.rpc("admin_unlock_highlights", { _user_id: userId })`, mostra toast e recarrega lista.
- Mostrar coluna/info "Trechos liberados até …" quando `highlights_unlocked_until` for futuro.
- Adicionar action `highlights_unlock_30d` ao histórico de liberações já existente.

---

## Arquivos afetados

### Banco
- **Migração**: nova coluna `profiles.highlights_unlocked_until` + RPC `admin_unlock_highlights`.
- **Insert/Update**: `plan_settings.benefits` (textos atualizados para 6 planos).

### Código
- `src/lib/freeTrial.ts` — nova função `highlightsActive`.
- `src/contexts/AuthContext.tsx` — novo campo no tipo `Profile`.
- `src/pages/Estudar.tsx` — gating visual da seção "Pegar Nota".
- `src/pages/Admin.tsx` — botão "Liberar Trechos (30d)" + exibição do status.

