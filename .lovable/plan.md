

## Plano: Adicionar plano 60 DAYS + recolorir badges

### Resumo
Criar um quarto plano pago `days_60` com 60 dias de acesso, R$ 25, mesmos benefícios do 30 DAYS, mas com **10 dias de Simulado Difícil** e **15 dias de Chat Professor Saraiva** (ambos contados a partir da ativação). Recolorir os badges: 30 DAYS = **cobre**, 60 DAYS = **prateado**.

### 1. Banco de dados (migração)

- `ALTER TYPE public.access_plan ADD VALUE 'days_60';` (entre `days_30` e `days_90`).
- Atualizar `public.plan_duration` para incluir `WHEN 'days_60' THEN interval '60 days'`.
- Atualizar `public.handle_new_user` (linha do `chat_unlocked`): manter como está — `chat_unlocked` só inicia `true` para `days_90`/`premium`. Para `days_60` o chat será liberado pela janela de 15 dias controlada via `access_expires_at` (ver passo 5).
- `INSERT` em `plan_settings` para `days_60`:
  - price `R$ 25`, old_price `R$ 50`, duration_label `60 dias renováveis`, highlight `null`,
  - benefits: `["Tudo do plano 30 DAYS","60 dias de acesso contínuo","10 dias de Simulado Difícil","15 dias de Chat com Professor Saraiva"]`, locked `false`.

### 2. Tipos e constantes

- `src/contexts/AuthContext.tsx`: `AccessPlan = "free" | "days_30" | "days_60" | "days_90" | "premium"`.
- `src/lib/plans.ts`: adicionar entrada `{ id: "days_60", label: "60 DAYS", days: 60, description: "60 dias · renovável" }` entre 30 e 90.
- `supabase/functions/create-invite/index.ts`: adicionar `"days_60"` em `VALID_PLANS` e ajustar `planDays` para retornar 60.

### 3. Badges (`src/components/PlanBadge.tsx`)

- **30 DAYS → cobre**: gradient âmbar/laranja queimado (`from-orange-300 to-amber-600 text-amber-950 border-amber-700`).
- **60 DAYS → prateado**: gradient zinc claro (`from-zinc-200 to-zinc-400 text-zinc-800 border-zinc-400`) — visual atual de 30 DAYS.
- 90 DAYS continua dourado, PREMIUM continua roxo.
- Ícone do 60 DAYS: `Clock` (igual 30 DAYS).

### 4. Página Planos (`src/pages/Planos.tsx`)

- Atualizar `PLAN_ORDER = ["days_30", "days_60", "days_90", "premium"]`.
- Trocar grid para `md:grid-cols-4` para acomodar 4 cards.

### 5. Gating de Chat e Simulado Difícil para `days_60`

Novo cálculo baseado em `access_expires_at` (que é `start + 60 dias`), então `start = access_expires_at - 60 dias`:

- **`src/lib/freeTrial.ts`**: criar nova função auxiliar `computePlanWindows({ plan, accessExpiresAt })` que retorna `{ chatDaysLeft, hardDaysLeft, chatActive, hardActive }`. Para `days_60`: chat = 15 dias a partir do início, hard = 10 dias a partir do início. Para outros planos: `chatActive`/`hardActive` permanecem `true` se já desbloqueados pela lógica atual.
- **`src/pages/ChatProfessor.tsx`**: `unlocked = isAdmin || trial.freeChatActive || (plan === "days_60" ? planWindow.chatActive : profile?.chat_unlocked)`.
- **`src/pages/Simulado.tsx`**: `planAllowsHard` ganha condição `(plan === "days_60" && planWindow.hardActive)`.
- **`src/layouts/AppLayout.tsx`**: ajustar `chatLocked` para considerar `planWindow.chatActive` quando `plan === "days_60"`.

Observação: para `days_60` o campo `chat_unlocked` no profile **não** é usado para liberação — a janela de 15 dias é calculada dinamicamente. Não é preciso job para "fechar" o chat.

### 6. Renovação

`admin_renew_user` já cobre qualquer plano via `plan_duration`. Funciona automaticamente após adicionar `days_60` ao enum e à função `plan_duration`. Sem mudança adicional.

### Arquivos
- **Nova migração**: enum `days_60`, atualizar `plan_duration`, seed em `plan_settings`.
- **Editar**: `src/contexts/AuthContext.tsx`, `src/lib/plans.ts`, `src/components/PlanBadge.tsx`, `src/pages/Planos.tsx`, `src/lib/freeTrial.ts`, `src/pages/ChatProfessor.tsx`, `src/pages/Simulado.tsx`, `src/layouts/AppLayout.tsx`, `supabase/functions/create-invite/index.ts`.

