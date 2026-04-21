

## Objetivo

Garantir que **admins** tenham acesso completo a todas as funcionalidades, independentemente do plano (ou falta dele). Atualmente as funções `expertActive()` e `highlightsActive()` só verificam o plano e liberações temporárias, ignorando o status de admin.

---

## Mudanças

### 1. `src/lib/freeTrial.ts` — ignorados de acesso para admin

Adicionar parâmetro `isAdmin?: boolean` (default `false`) em ambas as funções de verificação:

```ts
export function expertActive(opts: {
  plan: AccessPlan | null | undefined;
  expertUnlockedUntil: string | null | undefined;
  isAdmin?: boolean;
}): boolean {
  if (opts.isAdmin) return true;
  // ... resto existente
}

export function highlightsActive(opts: {
  plan: AccessPlan | null | undefined;
  highlightsUnlockedUntil: string | null | undefined;
  isAdmin?: boolean;
}): boolean {
  if (opts.isAdmin) return true;
  // ... resto existente
}
```

### 2. `src/pages/Estudar.tsx` e `src/pages/Simulado.tsx`

Atualizar as chamadas para incluir `isAdmin`:

```ts
const userHasExpertAccess = expertActive({
  plan: profile?.plan,
  expertUnlockedUntil: profile?.expert_unlocked_until,
  isAdmin         // novo
});

const canExtractHighlights = highlightsActive({
  plan: profile?.plan,
  highlightsUnlockedUntil: profile?.highlights_unlocked_until,
  isAdmin         // novo
});
```

No `Estudar.tsx`, linhas 88-89 e uso do `highlightsViaAdmin` (linhas 90-96) também deve ser ajustado: se `isAdmin`, não mostrar o badge "Liberado pelo admin" porque é o acesso nativo da função.

### 3. `src/pages/Admin.tsx` (opcional/consistência)

O painel admin **não precisa** dessas verificações (já vê tudo), mas para consistência pode ser bom passar `isAdmin: true` nas chamadas onde o contexto faz gating.

---

## Arquivos afetados

- `src/lib/freeTrial.ts` — adicionar `isAdmin` nas funções `expertActive` e `highlightsActive`.
- `src/pages/Estudar.tsx` — passar `isAdmin` nas chamadas + ajuste no badge condicional.
- `src/pages/Simulado.tsx` — passar `isAdmin` na verificação de Expert.

