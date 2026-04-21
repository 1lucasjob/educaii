

## Objetivo

Adicionar dois novos produtos vendáveis na plataforma:

1. **Plano 180 DAYS** — R$ 100, acesso completo por 180 dias (renovável, igual aos demais planos).
2. **Pacote Simulados Expert 30 dias** — R$ 20, libera o modo Expert do Simulado por 30 dias sem mudar o plano principal do aluno.

---

## Mudanças no banco

### 1. Novo valor no enum `access_plan`
- Adicionar `'days_180'` ao enum `access_plan`.
- Atualizar a função `plan_duration` para retornar `180` quando o plano for `days_180`.
- Inserir uma linha em `plan_settings` para `days_180` (preço R$ 100, "180 dias renováveis", benefícios padrão, `locked = false`).

### 2. Suporte ao "Pacote Expert 30 dias"
A coluna `expert_unlocked_until` já existe em `profiles` e já é usada pelo Simulado para liberar o modo Expert. Vamos reaproveitá-la.

- Criar nova função RPC `purchase_expert_pack(_user_id uuid, _days int)` (security definer) que estende `expert_unlocked_until` em N dias (a partir de `now()` ou da data atual se ainda válida). Isso permite ao admin liberar manualmente após o PIX.
- Criar tabela `expert_pack_settings` (linha única) com `price text`, `old_price text`, `duration_days int`, `duration_label text`, `benefits jsonb`, `locked boolean`. Editável pelo admin (mesmo padrão de `plan_settings`).
- RLS: leitura pública autenticada; update apenas admin.

---

## Mudanças no código

### `src/contexts/AuthContext.tsx`
- Adicionar `"days_180"` ao tipo `AccessPlan`.

### `src/lib/plans.ts`
- Adicionar `{ id: "days_180", label: "180 DAYS", days: 180, description: "180 dias · renovável" }` em `PLANS`.

### `src/components/PlanBadge.tsx`
- Adicionar estilo para `days_180` (sugestão: gradiente azul/ciano, ícone `Star`) — diferente dos demais para destacar o "intermediário longo".

### `src/pages/Planos.tsx`
- Incluir `"days_180"` em `PLAN_ORDER` (entre `days_90` e `premium`).
- Adicionar nova seção abaixo do grid de planos: **"Pacotes adicionais"** exibindo um card único do "Pacote Simulados Expert — 30 dias".
  - Card mostra preço (R$ 20), duração, benefícios (libera modo Expert do Simulado por 30 dias), botão "Pagar com PIX" (reaproveita `PixPaymentDialog`) e botão "Solicitar por e-mail".
  - Admin vê botão "Editar" (preço, duração, benefícios, locked) e "Visualizar PIX (modo teste)", igual aos planos.

### `src/lib/plans.ts` (novo helper)
- `buildExpertPackPurchaseMailto({ userEmail })` — assunto/corpo dedicados ao pacote.

### `supabase/functions/create-invite/index.ts`
- Adicionar `"days_180"` em `VALID_PLANS` e ajustar `planDays` para retornar `180`.

### `src/pages/Admin.tsx`
- Incluir opção "180 DAYS" nos seletores de plano (criar convite e renovar plano).
- Adicionar nova seção **"Liberar Pacote Expert (30d)"** no painel de cada aluno: botão que chama `purchase_expert_pack` para estender `expert_unlocked_until` em 30 dias. Loga em `study_unlock_logs` (ou tabela equivalente) para histórico.

---

## Fluxo do usuário

**Plano 180 dias:** aparece como mais um card na página Planos, com mesmo fluxo PIX → e-mail → admin libera via `admin_renew_user` escolhendo "180 DAYS".

**Pacote Expert 30 dias:** aluno paga via PIX (R$ 20), envia comprovante, admin abre Admin → aluno → "Liberar Pacote Expert (30d)". O Simulado passa a permitir dificuldade Expert por 30 dias sem alterar o plano vigente.

---

## Arquivos afetados

- Migração SQL (enum, `plan_settings` insert, tabela `expert_pack_settings`, função `purchase_expert_pack`, RLS).
- `src/contexts/AuthContext.tsx`
- `src/lib/plans.ts`
- `src/components/PlanBadge.tsx`
- `src/pages/Planos.tsx`
- `src/pages/Admin.tsx`
- `supabase/functions/create-invite/index.ts`

