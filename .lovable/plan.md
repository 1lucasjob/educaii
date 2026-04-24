## 🎨 Recriação dos 13 avatares (1024×1024 PNG)

Estilo unificado: ilustração 3D estilo Memoji/Notion, cabeça+ombros centralizados com folga (sem precisar de recorte), fundo gradiente temático, iluminação consistente. Gerados via `google/gemini-3-pro-image-preview` para qualidade máxima.

**8 humanos (livres para todos):**
1. Homem negro · 2. Mulher negra · 3. Homem japonês · 4. Mulher japonesa
5. Homem branco sem barba · 6. Homem branco com barba · 7. Mulher branca · 8. Alienígena humanoide

**4 de conquista (ocultos até desbloquear, com borda dourada+glow):**
- 🦉 Coruja → `secret_night_owl`
- 👽 Alienígena cósmico → `ultra_omniscient`
- 🤖 Robô → `ultra_time_mage`
- 🏴‍☠️ Pirata → `secret_phoenix`

**1 admin (borda platina + coroa, só visível se `isAdmin`):**
- 👑 Avatar de admin

## 📁 Arquivos

**Criar (13 PNGs):**
- Sobrescrever `src/assets/avatars/preset-1` … `preset-8` com nova qualidade
- Novos: `achievement-coruja.png`, `achievement-alienigena-cosmico.png`, `achievement-robo.png`, `achievement-pirata.png`, `admin-coroa.png`

**Criar componente:**
- `src/components/UserAvatar.tsx` — wrapper de `<Avatar>` que detecta se a `src` é um preset especial e aplica `borderClass`/glow correspondente. Props: `avatarUrl`, `displayName`, `size` (sm/md/lg/xl), `className`.

**Editar:**
- `src/lib/presetAvatars.ts` — nova interface:
  ```ts
  interface PresetAvatar {
    id: string;
    label: string;
    src: string;
    category: "human" | "achievement" | "admin";
    requiresAchievement?: string;
    requiresAdmin?: boolean;
    borderClass?: string; // tailwind ring/glow classes
  }
  ```
- `src/pages/Configuracoes.tsx`:
  - Carregar `quiz_attempts` do usuário e calcular `computeAchievements`
  - Filtrar: humanos sempre visíveis; conquista só se `unlocked`; admin só se `isAdmin`
  - Renderizar até 3 seções: "Avatares humanos", "Avatares de conquista" (se houver desbloqueado), "Exclusivo Admin" (se isAdmin)
- Trocar `<Avatar>` por `<UserAvatar>` em:
  - `src/layouts/AppLayout.tsx` (header)
  - `src/pages/Ranking.tsx` (linhas do leaderboard)
  - `src/pages/Admin.tsx` (lista de alunos e pendentes)
  - `src/pages/Configuracoes.tsx` (preview principal)

## 🔒 Visibilidade — OCULTOS até desbloquear
Avatares de conquista não aparecem na grade até serem desbloqueados (efeito surpresa). Sem cadeado, sem hint.

## 🌟 Bordas exclusivas (client-side, via `borderClass`)
- Conquista: `ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]`
- Admin: `ring-4 ring-slate-300 shadow-[0_0_24px_rgba(203,213,225,0.7)]` + ícone coroa absoluta no canto

## 🛠️ Sem mudanças no banco
Continua usando `profiles.avatar_url`. Tudo é lookup client-side.