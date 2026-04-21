

## Objetivo

1. **Programa de Fidelidade** — simplificar visual e mover para **abaixo das Conquistas** em `Progresso.tsx`.
2. **Badge de fidelidade inline** — aparecer **ao lado do nick** do usuário no header, no Ranking (lista + dialog) e no card "Meu Perfil" das Configurações.
3. **Pegar Nota (Trechos-Chave)** — nova área no **Módulo de Estudos** que extrai os trechos mais importantes **do texto colado, sem qualquer modificação** (verbatim).

---

## Parte 1 — Simplificar `LoyaltyProgram` e reposicionar

### `src/components/LoyaltyProgram.tsx`
- Manter o array `LOYALTY_TIERS` e a lógica de `userMonths`.
- Trocar a timeline grande por um **layout compacto**:
  - Cabeçalho enxuto: ícone + "Programa de Fidelidade" + barra fina de progresso até o próximo tier + label "Faltam X meses para {próximo}".
  - **Grid horizontal scrollável** (ou wrap em desktop) com cristais pequenos (~48px), título curto abaixo e badge "X m". Desbloqueados com glow; bloqueados com `opacity-40 grayscale` + `Lock` mini.
- Remover o fundo "tela cheia" escuro: usar `Card` padrão para combinar com o resto da página.

### `src/pages/Progresso.tsx`
- Remover render atual acima das estatísticas.
- Renderizar `<LoyaltyProgram />` **abaixo** da seção "Conquistas Secretas" (e abaixo de "Conquistas" quando não houver secretas), antes dos gráficos.

---

## Parte 2 — Badge de fidelidade ao lado do nick

### Novo: `src/components/LoyaltyBadge.tsx`
- Props: `{ startDate?: string | Date | null; size?: "xs" | "sm" }`.
- Reaproveita `LOYALTY_TIERS` para encontrar o **tier mais alto desbloqueado**.
- Renderiza um `Tooltip` com um chip pequeno (ícone do tier + cores/glow do tier) + opcional título curto. Sem texto longo.
- Se `userMonths < 1`, retorna `null`.

### Integrações
- **`src/layouts/AppLayout.tsx`** (header): inserir `<LoyaltyBadge startDate={profile?.created_at} size="xs" />` imediatamente ao lado do `display_name`.
- **`src/pages/Ranking.tsx`**:
  - Lista: ao lado de `r.display_name` na linha do leaderboard.
  - Dialog: ao lado do `sel.display_name` no `DialogTitle`.
  - Para isso, expor `created_at` na RPC `get_leaderboard` (migração) e adicionar ao tipo `Row`.
- **`src/pages/Configuracoes.tsx`**: badge ao lado do nick atual no card "Meu Perfil".

### Migração SQL
- Atualizar `get_leaderboard` para retornar também `created_at` do `profiles`.

---

## Parte 3 — "Pegar Nota" (Trechos-Chave verbatim)

### Edge function nova: `supabase/functions/extract-highlights/index.ts`
- Input: `{ topic: string, title?: string, count?: number (default 6, max 10) }`.
- Chama Lovable AI (`google/gemini-2.5-flash`) com system prompt rígido:
  - "Retorne APENAS um JSON `{ "highlights": string[] }` com os trechos MAIS IMPORTANTES copiados **literalmente** do texto fornecido. NUNCA reescreva, parafraseie, resuma ou corrija. Cada item deve ser uma substring exata e contígua do texto. Tamanho 1–3 frases. Sem comentários."
- **Validação verbatim no backend**: depois da resposta, normalizar (apenas trim) e **filtrar** mantendo somente strings que `topic.includes(trecho)` retorne `true`. Descartar o resto. Se sobrar 0, retornar erro amigável "Não foi possível extrair trechos verbatim — tente novamente".
- Retornar `{ highlights: string[] }`.

### `src/pages/Estudar.tsx`
- Após o card "Resumo Técnico" (quando `summary` existe), adicionar **novo Card "Trechos-Chave (Pegar Nota)"**:
  - Botão "Extrair trechos" (ou auto-disparado junto do `generate`, decidir por simplicidade: botão manual).
  - Estado `highlights: string[]`, `loadingHighlights`.
  - Lista de cards pequenos, cada um com:
    - Trecho exato em `<blockquote>` com borda lateral primary, fonte serifada/itálico, `whitespace-pre-wrap`.
    - Botão "Copiar" (clipboard) e contador `i/N`.
  - Aviso pequeno: "Trechos extraídos diretamente do seu texto, sem modificações."
- Não persiste no banco (efêmero por sessão); fica disponível enquanto o `summary` estiver visível.

---

## Arquivos afetados

- **Novo**: `src/components/LoyaltyBadge.tsx`
- **Novo**: `supabase/functions/extract-highlights/index.ts`
- **Migração SQL**: atualizar `get_leaderboard` para incluir `created_at`
- `src/components/LoyaltyProgram.tsx` — versão compacta
- `src/pages/Progresso.tsx` — mover loyalty para abaixo das conquistas
- `src/layouts/AppLayout.tsx` — badge no header
- `src/pages/Ranking.tsx` — badge na lista e no dialog + tipo `Row`
- `src/pages/Configuracoes.tsx` — badge no card "Meu Perfil"
- `src/pages/Estudar.tsx` — seção "Pegar Nota"

