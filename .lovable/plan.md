

## Objetivo

1. **Perfil editável** por aluno com **nick (display name)** e **imagem de avatar**, usado no ranking e no cabeçalho.
2. Novo componente **`LoyaltyProgram`** — timeline gamificada de fidelidade que mostra títulos/cristais desbloqueados conforme os meses de permanência do usuário (baseado em `profiles.created_at`).

---

## Parte 1 — Perfil editável (nick + avatar)

### Banco de dados (migração)

- Adicionar em `public.profiles`:
  - `display_name text` (nullable; fallback continua sendo a parte antes do `@` do email).
  - `avatar_url text` (nullable).
- Criar **storage bucket** `avatars` (público), com RLS em `storage.objects`:
  - SELECT público.
  - INSERT/UPDATE/DELETE permitidos apenas quando o nome do arquivo começar com `auth.uid()/` (cada usuário só mexe na sua pasta).
- Atualizar a RPC `get_leaderboard` para retornar também `display_name` (usando `COALESCE(p.display_name, split_part(p.email,'@',1))`) e `avatar_url`.

### Frontend

- **`src/contexts/AuthContext.tsx`**: incluir `display_name` e `avatar_url` no tipo `Profile` e no `select`.
- **`src/pages/Configuracoes.tsx`** — nova seção **"Meu Perfil"** no topo:
  - Avatar grande (`Avatar` do shadcn) com botão "Trocar imagem" → upload para bucket `avatars/{user_id}/avatar.{ext}`, salva `avatar_url` no profile.
  - Campo de texto "Apelido" (máx. 24 caracteres, sanitizado) + botão "Salvar".
  - Botão "Remover imagem" quando houver avatar.
  - Validação: imagem até 2 MB, tipos `image/png|jpeg|webp`.
- **`src/layouts/AppLayout.tsx`**: mostrar avatar + nick no header (substituindo/complementando o email).
- **`src/pages/Ranking.tsx`**: usar `display_name` e `avatar_url` vindos da RPC; renderizar `Avatar` ao lado do nome em cada linha do leaderboard e no dialog de detalhes.

---

## Parte 2 — Componente `LoyaltyProgram`

### Arquivo novo: `src/components/LoyaltyProgram.tsx`

- Props: `{ startDate: string | Date; className?: string }`. Calcula `userMonths` internamente com base em `startDate` (usa `profile.created_at`). Exporta também uma constante `LOYALTY_TIERS` para reaproveitamento.
- **Dados** (array `LOYALTY_TIERS`): 1, 2, 3, 4, 6, 8, 10, 12, 15, 18, 21, 24 meses com título, ícone `lucide-react` e classes Tailwind conforme a especificação do usuário:
  - 1 `Hexagon` cinza chumbo · 2 `Hexagon` branco borda cinza · 3 `Gem` esmeralda · 4 `Triangle` amarelo · 6 `Diamond` azul safira · 8 `Diamond` rubi · 10 `Gem` roxo · 12 `Shield` esmeralda com `drop-shadow-lg` · 15 `Crown` ouro · 18 `Star` ciano diamante · 21 `Sparkles` multicolor (`bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent`) · 24 `Cpu`+`Shield` holográfico com `animate-pulse` e glow azul/verde neon.
- **Layout**:
  - Wrapper com fundo escuro local (`bg-slate-950/60 rounded-xl p-6`) para destacar brilho, independente do tema.
  - **Barra de progresso** no topo: mostra progresso (%) até o próximo marco não alcançado, com label "Faltam X meses para {próximo título}" ou "Você atingiu o nível máximo" quando `userMonths >= 24`.
  - **Timeline vertical** (linha central) em desktop / lista empilhada em mobile. Cada tier é um card com:
    - Ícone estilizado (gradiente + `drop-shadow` + `animate-pulse` para o 24) dentro de um círculo.
    - Título + "X meses".
    - Badge "Desbloqueado" / "Bloqueado".
  - **Níveis desbloqueados** (`tier.months <= userMonths`): cores vibrantes + glow + `shadow-[0_0_20px_...]`.
  - **Níveis bloqueados**: `opacity-50 grayscale` + overlay com ícone `Lock` pequeno sobreposto no canto do cristal.
- Responsivo, acessível (`aria-label` em cada tier), sem libs extras.

### Integração

- **`src/pages/Progresso.tsx`**: adicionar seção "Programa de Fidelidade" renderizando `<LoyaltyProgram startDate={profile.created_at} />` acima das conquistas.
- **`src/pages/Configuracoes.tsx`**: prévia compacta opcional do tier atual ao lado do plano (apenas ícone + título atual). *(opcional, mantém o componente principal na página de Progresso.)*

---

## Arquivos afetados

- Migração SQL: colunas `display_name`/`avatar_url`, bucket `avatars` + policies, update em `get_leaderboard`.
- `src/integrations/supabase/types.ts` (auto-gerado).
- `src/contexts/AuthContext.tsx` — tipo `Profile` estendido.
- `src/pages/Configuracoes.tsx` — seção "Meu Perfil" (upload + nick).
- `src/layouts/AppLayout.tsx` — avatar + nick no header.
- `src/pages/Ranking.tsx` — render avatar/nick.
- `src/components/LoyaltyProgram.tsx` — componente novo.
- `src/pages/Progresso.tsx` — integra `LoyaltyProgram`.

