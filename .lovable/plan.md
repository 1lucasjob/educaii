

## Plano: Simulado Difícil baseado no texto + novo Simulado Expert

### 1. Simulado Difícil — usar APENAS o texto enviado

Hoje o `generate-quiz` recebe só o `topic` (que no fluxo atual é o **título** quando vem do botão). Precisa também receber o **corpo do texto** para que o difícil seja 100% ancorado nele.

- **`src/pages/Estudar.tsx`**: ao salvar a sessão, gravar `topic` no formato `"<título>\n\n<corpo>"` (já é feito) e ao chamar `startQuiz`, passar via state/URL o conteúdo. Vamos persistir o último `topic_body` no `localStorage` por `activeTopic` (chave `study_body:<title>`) para o Simulado recuperar sem inflar a URL.
- **`src/pages/Simulado.tsx`**: ao montar, ler `localStorage.getItem("study_body:<topic>")` e passar como `sourceText` no `invoke("generate-quiz", { body: { topic, difficulty, sourceText } })`.
- **`supabase/functions/generate-quiz/index.ts`**: aceitar `sourceText` opcional. Quando `difficulty === "hard"` ou `"expert"` E `sourceText` presente, adicionar regra obrigatória no prompt: *"Use EXCLUSIVAMENTE o texto base abaixo como fonte. Não invente itens de NR fora dele. Toda questão deve ser respondível a partir do texto."* e injetar o texto delimitado por `<<TEXTO_BASE>> ... <</TEXTO_BASE>>`.

### 2. Novo nível: Simulado Expert (acadêmico)

Terceiro nível além de easy/hard. Exige **5000+ caracteres** no texto descritivo e gating por plano.

#### Edge function
- Adicionar `"expert"` aos valores válidos em `generate-quiz`.
- Modelo: `google/gemini-3.1-pro-preview` com `reasoning: { effort: "high" }`.
- Prompt: estilo prova acadêmica/pós-graduação — questões longas com estudo de caso, exigem cálculos quando aplicável, múltiplas NRs combinadas, distratores quase idênticos. Mesma quantidade (5–10) e total 100 pts.
- Igualmente vinculado ao `sourceText`.

#### Frontend Estudar (`src/pages/Estudar.tsx`)
- Nova constante `MIN_CHARS_EXPERT = 5000`. Adicionar terceiro card de simulado quando `topicLength >= 5000` E o usuário tiver acesso (ver gating abaixo).
- Texto de ajuda do textarea atualizado: "500+ libera Fácil; 1501+ libera Difícil; 5000+ libera Expert (Premium / 90 DAYS)".
- Layout dos botões passa a `sm:grid-cols-3` quando expert disponível.

#### Frontend Simulado (`src/pages/Simulado.tsx`)
- Tipo `difficulty` aceita `"expert"`.
- `TIME_LIMIT` para expert: 20 min. `lockNavigation = true` (igual hard).
- Gating expert:
  - Liberado para: `plan === "premium"`, `plan === "days_90"`, ou se houver **liberação ADM temporária ativa** (`expert_unlocked_until > now()`).
  - Bloqueado: dialog igual ao do hard, com mensagem específica.
- Cor/badge: nova badge "EXPERT" gradiente roxo/rosa.

### 3. Liberação ADM temporária (1 dia) por aluno

#### Banco (migração)
- Adicionar coluna `expert_unlocked_until timestamptz NULL` em `public.profiles`.
- Nova RPC `admin_unlock_expert(_user_id uuid)`:
  - SECURITY DEFINER, valida `has_role(auth.uid(), 'admin')`.
  - `UPDATE profiles SET expert_unlocked_until = now() + interval '1 day' WHERE id = _user_id`.
  - Insere registro em `study_unlock_logs` com `action = 'expert_unlock_24h'`.

#### AuthContext
- `src/contexts/AuthContext.tsx`: incluir `expert_unlocked_until` no `Profile` e no `select`.

#### Admin (`src/pages/Admin.tsx`)
- Nova coluna na tabela de alunos: botão **"Liberar Expert 24h"** chamando `supabase.rpc("admin_unlock_expert", { _user_id })`.
- Mostrar status quando `expert_unlocked_until > now()` ("Expert ativo até HH:mm de DD/MM").
- Atualizar `interface StudentRow` e o `select` em `load()`.

#### Helper de gating
- `src/lib/freeTrial.ts`: adicionar função `expertActive({ plan, expertUnlockedUntil })` retornando boolean (`plan in ['premium','days_90']` OR `expertUnlockedUntil > now`).

### 4. Sem mudanças
- Banco: nenhuma alteração além da nova coluna + RPC.
- Ranking, Progresso, Chat: sem alterações.
- Plano `days_60`: NÃO inclui expert.

### Arquivos
- **Nova migração**: coluna `expert_unlocked_until` + RPC `admin_unlock_expert`.
- **Editar**: `supabase/functions/generate-quiz/index.ts`, `src/pages/Estudar.tsx`, `src/pages/Simulado.tsx`, `src/pages/Admin.tsx`, `src/contexts/AuthContext.tsx`, `src/lib/freeTrial.ts`.

