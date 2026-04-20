

## Plano: Página de Planos com preços promocionais

### Nova rota `/app/planos`

Criar `src/pages/Planos.tsx` com 3 cards lado a lado (responsivo: 1 coluna mobile, 3 colunas desktop), cada um usando o `PlanBadge` já existente no topo.

**Conteúdo de cada card:**

| Plano | Preço | Duração | Destaque |
|---|---|---|---|
| 30 DAYS (prata) | R$ 10,00 | 30 dias renováveis | — |
| 90 DAYS (dourado) | R$ 25,00 | 90 dias renováveis + Chat com Professor Saraiva | "Mais escolhido" |
| PREMIUM (roxo) | R$ 100,00 | 366 dias renováveis + Chat liberado | "Melhor custo-benefício" |

**Elementos visuais:**
- Banner no topo: *"🎉 Preços promocionais por tempo limitado"* (Alert amarelo/destaque).
- Cada card mostra: badge do plano, preço grande riscado opcional + preço promo, lista de benefícios com `Check` icons, botão **"Quero este plano"** que abre `mailto:` (reaproveitando padrão de `buildRenewalMailto` em `src/lib/plans.ts`) com assunto "Quero contratar o plano X".
- Card do plano atual do aluno ganha borda destacada e label "Seu plano atual" (esconde botão).
- Para admin: aviso "Você possui acesso vitalício de administrador" no topo, sem CTA.

### Integração na navegação

- **Sidebar (`src/layouts/AppLayout.tsx`)**: novo item no grupo "Aluno" — *"Planos"* com ícone `Sparkles`, antes de "Configurações" não, manter no grupo Aluno após "Ranking".
- **Configurações (`src/pages/Configuracoes.tsx`)**: o botão "Renovar agora" existente ganha um link adicional discreto *"Ver todos os planos"* que leva para `/app/planos`.
- **RenewalBanner**: adicionar link *"Ver planos"* ao lado do CTA atual.

### Arquivos

- **Novo:** `src/pages/Planos.tsx`
- **Editar:** `src/App.tsx` (registrar rota `/app/planos`)
- **Editar:** `src/layouts/AppLayout.tsx` (item no menu)
- **Editar:** `src/lib/plans.ts` (exportar helper `buildPurchaseMailto({plan, userEmail})` reutilizando o padrão do mailto de renovação, com assunto "Quero contratar")
- **Editar:** `src/pages/Configuracoes.tsx` e `src/components/RenewalBanner.tsx` (link "Ver planos")

### Observações

- Sem mudanças de banco/edge functions — é página informativa + CTA por email para o admin processar manualmente (mesmo fluxo da renovação atual).
- Preços ficam centralizados em uma constante no topo de `Planos.tsx` para facilitar ajuste futuro.

