

## Objetivo

Garantir que o botão **"Retomar Simulado"** apareça de forma confiável mesmo após refresh, troca de dispositivo ou limpeza do `localStorage`, persistindo o progresso do simulado em andamento também no **banco de dados**.

Hoje a persistência vive apenas em `localStorage` (`src/lib/quizPersistence.ts`), o que falha quando o usuário troca de navegador/dispositivo, limpa cache, ou usa modo anônimo.

---

## Parte 1 — Banco de dados

### Nova tabela `quiz_in_progress`
Uma linha por usuário (UNIQUE em `user_id`) com o progresso ativo:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid | UNIQUE, NOT NULL |
| `topic` | text | NOT NULL |
| `difficulty` | quiz_difficulty | NOT NULL |
| `questions` | jsonb | NOT NULL |
| `answers` | jsonb | NOT NULL |
| `current_index` | int | default 0 |
| `time_left` | int | segundos restantes |
| `time_spent` | int | segundos gastos |
| `time_limit` | int | total original |
| `saved_at` | timestamptz | default `now()` |
| `created_at` | timestamptz | default `now()` |

**RLS**:
- SELECT/INSERT/UPDATE/DELETE: `auth.uid() = user_id`
- Admin pode SELECT (consistente com outras tabelas).

**Trigger**: `update_updated_at_column` em `saved_at` (ou atualizar manualmente no upsert).

---

## Parte 2 — Helpers em `src/lib/quizPersistence.ts`

Adicionar versões assíncronas que usam Supabase, mantendo compatibilidade com as funções existentes (que continuam usando `localStorage` como cache rápido):

```ts
export async function saveQuizRemote(userId: string, payload: SavedQuiz): Promise<void>
export async function loadQuizRemote(userId: string): Promise<SavedQuiz | null>
export async function clearQuizRemote(userId: string): Promise<void>
export async function getResumableQuizRemote(userId: string): Promise<SavedQuiz | null>
```

Estratégia **híbrida**:
- `saveQuiz` continua salvando local (rápido, sem latência) **e** dispara `saveQuizRemote` em background (debounced ~3s para não martelar o banco).
- `getResumableQuiz` (sync) verifica local primeiro; em paralelo a página chama `getResumableQuizRemote` para hidratar quando o local estiver vazio.
- `clearQuiz` limpa ambos.

`getResumableQuizRemote` aplica a mesma lógica de ajuste de `timeLeft` por `saved_at` e descarta se zerado ou totalmente respondido.

---

## Parte 3 — `src/pages/Estudar.tsx`

- Após carregar `profile`, disparar `getResumableQuizRemote(profile.id)` em `useEffect`.
- Mesclar resultado com o que veio do `localStorage`: prioriza o **mais recente** (maior `savedAt`).
- Se houver `resumable`, mostrar o card "Retomar Simulado" (já existe na UI atual).
- Botão **"Descartar"** chama `clearQuizRemote` além do local.

---

## Parte 4 — `src/pages/Simulado.tsx`

- Quando `?resume=1`: tentar `loadQuiz` (local) → se vazio, `await loadQuizRemote`.
- A cada save (efeitos já existentes em `questions/answers/current` e a cada 5s do timer): chamar `saveQuiz` (local imediato) **+** `saveQuizRemote` (debounced).
- Em `submit()` e ao finalizar: chamar `clearQuiz` **+** `clearQuizRemote`.
- Em `blocked`: limpar remoto também (consistência).

---

## Arquivos afetados

### Banco
- **Migração**: criar tabela `quiz_in_progress` com RLS por usuário.

### Código
- **Editado**: `src/lib/quizPersistence.ts` — adicionar funções `*Remote` e debouncer para upsert.
- **Editado**: `src/pages/Estudar.tsx` — hidratar resumable do banco no mount, mesclar com local.
- **Editado**: `src/pages/Simulado.tsx` — fallback de carregamento via banco quando `?resume=1` e local estiver vazio; sincronizar saves/clears com remoto.

