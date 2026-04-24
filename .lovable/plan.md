
## 🎯 Objetivos da entrega

1. **Bordas exclusivas:** mostrar apenas **uma opção por tipo/cor** de borda (não repetir a mesma borda em vários avatares).
2. **Pares M/F:** garantir que todo avatar pronto tenha versão masculina e feminina equivalente.
3. **Admin:** criar **2 novos avatares de admin** focados em tecnologia/IA, com **mais zoom no rosto** (e regerar o existente no mesmo padrão para coerência).

---

## 1) Borda exclusiva — uma por tipo/cor

**Arquivo:** `src/lib/presetAvatars.ts` (função `availableBorderPresets`)

Hoje a função retorna **todos** os presets que têm `borderClass`, então a seção "Borda exclusiva" em Configurações lista a mesma borda dourada várias vezes (uma por avatar de conquista M e F + cada conquista diferente também usa `ACHIEVEMENT_BORDER`). 

**Mudança:** após filtrar por elegibilidade, **deduplicar pelo valor de `borderClass`**, mantendo apenas o primeiro preset de cada classe. Resultado em Configurações:
- 1 borda dourada (ACHIEVEMENT_BORDER) — se o usuário tiver qualquer conquista comum desbloqueada
- 1 borda laranja Fênix (PHOENIX_BORDER) — se desbloqueou Fênix
- 1 borda roxa do plano (PLAN_PURPLE_BORDER) — se plano ≥ 90 dias
- 1 borda platina admin (ADMIN_BORDER) — só admin

Sem alterar a lógica de **avatares de conquista** (essa seção continua mostrando todos os personagens individualmente — só a seção "Borda exclusiva" fica deduplicada).

Também ajustar o texto explicativo da seção "Borda exclusiva" em `src/pages/Configuracoes.tsx` (linhas ~492-494) para refletir "uma borda por categoria conquistada".

---

## 2) Pares masculino/feminino dos avatares

Inventário atual em `src/assets/avatars/`:

| Categoria | Atual | Status |
|---|---|---|
| Humanos negros | preset-1 (M) + preset-2 (F) | ✅ par |
| Humanos japoneses | preset-3 (M) + preset-4 (F) | ✅ par |
| Brancos sem barba | preset-5 (M) + preset-7 (F mulher branca) | ✅ par |
| **Branco com barba** | preset-6 (M) | ❌ **sem par feminino** |
| Loiros | preset-9 (M) + preset-10 (F) | ✅ par |
| Alienígena humanoide neutro | preset-8 | ❌ **órfão** (não bate com másculo/feminina) |
| Alienígena estilo "másculo/feminina" | preset-11 (M) + preset-12 (F) | ✅ par |
| Conquistas (5 tipos) | todas têm versão M e F | ✅ |
| **Plano (alien humanoide)** | plan-alien-masculino | ❌ **sem par feminino** |
| Admin | admin-coroa (1 só) | será expandido (item 3) |

**Ações:**

**a)** Gerar `preset-13-mulher-branca-cabelo-cacheado.png` (1024×1024) como par de `preset-6` (homem branco com barba). Mesmo estilo 3D Memoji/Notion, gradiente de fundo coerente, cabeça+ombros centralizados.

**b)** Gerar `plan-alien-feminina.png` (1024×1024) — alienígena humanoide feminina, mesmo estilo do `plan-alien-masculino.png`, com gradiente roxo. Adicionar ao array `PRESET_AVATARS` com `category: "plan"`, `requiresPlanIn: PURPLE_PLAN_TIERS`, `borderClass: PLAN_PURPLE_BORDER`.

**c)** `preset-8-alienigena.png` — manter como está (alienígena "neutro/clássico" — usuários antigos podem já tê-lo selecionado, então não removo). Apenas documentar em comentário no array que é o alienígena "neutro" e o par M/F formal é preset-11/12.

**d)** Atualizar `src/lib/presetAvatars.ts`:
- Importar `preset13` e `planAlienFem`
- Adicionar entradas correspondentes na lista `PRESET_AVATARS`

---

## 3) Avatares de admin focados em tecnologia/IA (3 no total)

Hoje só existe `admin-coroa.png`. Vou:

**a) Regerar `admin-coroa.png`** com **mais zoom no rosto** (enquadramento "head-and-shoulders" mais apertado, ~70% da imagem é a cabeça) e tema tech/IA: figura masculina com sutis elementos cibernéticos (ex.: iluminação ciano/dourada, padrão circuito ao fundo), coroa estilizada de "imperador da IA".

**b) Criar `admin-ia-neural.png`** — avatar masculino estilo "engenheiro/cientista de IA", traços neurais brilhantes ao redor do rosto, óculos high-tech, fundo com gradiente azul-elétrico/violeta.

**c) Criar `admin-ia-cyber.png`** — avatar masculino "ciborgue benevolente": metade do rosto com detalhes de placa-mãe luminosa, olhos com HUD sutil, fundo gradiente preto/dourado (mantendo a identidade "platina+ouro" do admin).

Todos: 1024×1024 PNG, **enquadramento com mais zoom no rosto** que os atuais presets, gerados com `google/gemini-3-pro-image-preview`. Todos masculinos (atendendo regra anterior do usuário: "todo avatar de admin é do sexo masculino"). Todos com `borderClass: ADMIN_BORDER` (a borda platina) → aparecem só para `isAdmin` e contam como **1 borda exclusiva** depois da deduplicação do item 1.

Atualizar `src/lib/presetAvatars.ts`:
```ts
import adminCoroa from "@/assets/avatars/admin-coroa.png";
import adminIaNeural from "@/assets/avatars/admin-ia-neural.png";
import adminIaCyber from "@/assets/avatars/admin-ia-cyber.png";

// ...
{ id: "admin-coroa", label: "Imperador da IA", src: adminCoroa, category: "admin", requiresAdmin: true, borderClass: ADMIN_BORDER },
{ id: "admin-ia-neural", label: "Arquiteto Neural", src: adminIaNeural, category: "admin", requiresAdmin: true, borderClass: ADMIN_BORDER },
{ id: "admin-ia-cyber", label: "Ciborgue Mestre", src: adminIaCyber, category: "admin", requiresAdmin: true, borderClass: ADMIN_BORDER },
```

A grade "Exclusivo Admin" em `Configuracoes.tsx` (linhas 443-484) já é dinâmica e renderizará os 3 automaticamente.

---

## 📁 Arquivos afetados

**Criar (PNGs):**
- `src/assets/avatars/preset-13-mulher-branca-cabelo-cacheado.png`
- `src/assets/avatars/plan-alien-feminina.png`
- `src/assets/avatars/admin-ia-neural.png`
- `src/assets/avatars/admin-ia-cyber.png`

**Sobrescrever:**
- `src/assets/avatars/admin-coroa.png` (mais zoom no rosto + tema tech)

**Editar:**
- `src/lib/presetAvatars.ts` — novos imports, novas entradas em `PRESET_AVATARS`, deduplicação por `borderClass` em `availableBorderPresets`
- `src/pages/Configuracoes.tsx` — pequeno ajuste no texto explicativo da seção "Borda exclusiva" (linhas ~492-494)

**Sem mudanças:**
- Banco de dados (continua usando `profiles.avatar_url` + `profiles.avatar_border`)
- `UserAvatar`, `AppLayout`, `Ranking`, `Admin`, `Progresso` — já consomem via lookup automático
