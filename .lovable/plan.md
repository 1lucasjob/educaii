

## Plano: Badge ADMIN + visibilidade de planos para o admin

### 1. Novo badge ADMIN (dourado com bordas roxas)

Atualizar `src/components/PlanBadge.tsx` para aceitar um modo especial `"admin"`:
- Fundo: gradiente dourado (`from-amber-300 to-amber-500`)
- Borda: roxa grossa (`border-2 border-purple-600`)
- Texto: roxo escuro (`text-purple-900`)
- Ícone: `Crown` (lucide)
- Label: **ADMIN**

Como `AccessPlan` é um tipo fechado (`free | days_30 | days_90 | premium`), vou estender o componente com uma prop separada `isAdmin?: boolean` que, quando `true`, ignora o `plan` e renderiza o badge ADMIN. Isso evita mexer no enum do banco.

### 2. Admin vitalício (sem renovação)

**Lógica visual** (frontend apenas — não precisa migration):
- Em `src/lib/plans.ts`, ajustar `shouldShowRenewal(plan, expiresAt, isAdmin?)` para retornar `false` quando `isAdmin === true`.
- Em `src/components/RenewalBanner.tsx` e `src/pages/Configuracoes.tsx`: passar `isAdmin` do `useAuth()` e ocultar banner/CTA de renovação para admin.
- Em `src/pages/Configuracoes.tsx`: no card do plano, se `isAdmin`, mostrar "Acesso vitalício de administrador" em vez de data de expiração.

### 3. Badges visíveis para o admin em cada cadastro

Em `src/pages/Admin.tsx`, na tabela "Alunos cadastrados":
- Substituir o `<Badge variant="outline">{planLabel(s.plan)}</Badge>` atual pelo `<PlanBadge plan={s.plan} size="sm" />` (badges coloridos reais: branco/prata/dourado/roxo).
- Para cada linha, verificar se o aluno é admin (via consulta extra à `user_roles`) e mostrar o badge ADMIN no lugar.

**Detecção de admin na lista:** carregar uma vez `select user_id from user_roles where role = 'admin'` e cruzar com a lista de profiles. Marcar `isAdmin: boolean` em cada `StudentRow`.

### 4. Sidebar e topbar do próprio admin

Em `src/layouts/AppLayout.tsx`:
- Onde hoje aparece `<PlanBadge plan={profile.plan} />` na sidebar e na topbar, trocar para `<PlanBadge plan={profile.plan} isAdmin={isAdmin} />` para que o admin veja seu próprio badge dourado/roxo.

### Arquivos a alterar

- `src/components/PlanBadge.tsx` — adicionar prop `isAdmin` e estilo ADMIN.
- `src/lib/plans.ts` — `shouldShowRenewal` aceita `isAdmin` e retorna false para admin.
- `src/components/RenewalBanner.tsx` — não exibir para admin.
- `src/pages/Configuracoes.tsx` — card do plano mostra "vitalício" para admin; sem CTA de renovação.
- `src/pages/Admin.tsx` — listar `user_roles` admins, render `PlanBadge` colorido por linha (com flag admin).
- `src/layouts/AppLayout.tsx` — passar `isAdmin` ao `PlanBadge` da sidebar/topbar.

### Observações

- Não há mudança de schema. Admin já é identificado via `user_roles` + `has_role()`.
- O badge ADMIN substitui o badge de plano apenas visualmente; o `plan` real do admin no banco continua existindo (provavelmente `premium`), mas não é exibido nem cobrado por renovação.

