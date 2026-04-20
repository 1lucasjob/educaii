

## Plano: Auditoria de liberações + Professor Saraiva com retenção de 3 dias

### 1. Histórico de liberações manuais (auditoria)

**Nova tabela `study_unlock_logs`:**
- `id`, `created_at`, `admin_id` (uuid), `student_id` (uuid), `student_email` (text), `previous_topic` (text), `action` (text: 'unlock' | 'save')
- RLS: apenas admin pode SELECT/INSERT.

**Função RPC `admin_unlock_study(_user_id uuid)`** (SECURITY DEFINER):
- Verifica `has_role(auth.uid(), 'admin')`.
- Atualiza `profiles.current_topic_unlocked = true` para qualquer aluno (já é possível via RLS, mas centralizamos para logar).
- Insere registro em `study_unlock_logs` com `admin_id = auth.uid()`.

**UI no Admin (`src/pages/Admin.tsx`):**
- O botão "Liberar estudo" já existe na linha de cada aluno — trocar para chamar a RPC `admin_unlock_study` (em vez do update direto). Isso garante log automático para qualquer aluno.
- Nova aba/seção "Histórico de liberações" com tabela: Data | Admin | Aluno (email) | Tópico anterior.

### 2. Chat com Professor Saraiva + retenção de 3 dias

**Renomear persona** (`supabase/functions/chat-professor/index.ts`):
- System prompt passa a apresentar-se como **"Professor Saraiva"**, professor universitário experiente em NRs e engenharia. Mantém o estilo atual.

**Retenção de 3 dias:**
- Adicionar coluna `pinned` (boolean, default false) em `chat_messages`.
- Job de limpeza: como não temos cron, fazemos limpeza **on-read** dentro do `ChatProfessor.tsx` ao carregar histórico:
  ```ts
  await supabase.from('chat_messages')
    .delete()
    .eq('user_id', profile.id)
    .eq('pinned', false)
    .lt('created_at', new Date(Date.now() - 3*24*60*60*1000).toISOString());
  ```
- Carregar apenas mensagens não expiradas + as fixadas (`pinned = true`).

**UI do chat (`src/pages/ChatProfessor.tsx`):**
- Trocar título para "Chat com Professor Saraiva" (header + saudação).
- Aviso visível no topo do card (Alert amarelo): *"As mensagens são apagadas automaticamente após 3 dias. Use 'Salvar por mais 3 dias' nas respostas que quiser manter."*
- Botão **"Salvar por +3 dias"** (ícone Bookmark) abaixo de cada mensagem do assistente:
  - Atualiza `pinned = true` e estende a "vida" daquela mensagem por mais 3 dias (na prática: setar `created_at = now()` ou adicionar coluna `expires_at`. Vou usar **`expires_at timestamptz`** para clareza — default `now() + interval '3 days'`; ao salvar, `expires_at = now() + interval '3 days'` novamente; pinned vira indicador visual).
  - Visualmente o card da mensagem ganha borda dourada + ícone de bookmark preenchido.

### Arquivos a alterar

- **Migration nova** (schema):
  - `CREATE TABLE study_unlock_logs` + RLS (admin-only).
  - `ALTER TABLE chat_messages ADD COLUMN expires_at timestamptz NOT NULL DEFAULT now() + interval '3 days', ADD COLUMN pinned boolean NOT NULL DEFAULT false;`
  - `CREATE FUNCTION admin_unlock_study(_user_id uuid)`.
- `src/pages/Admin.tsx` — trocar handler de "Liberar estudo" para RPC; adicionar seção "Histórico de liberações".
- `src/pages/ChatProfessor.tsx` — título "Professor Saraiva", aviso de retenção, botão salvar, query com filtro de expiração + limpeza on-read.
- `supabase/functions/chat-professor/index.ts` — atualizar SYSTEM_PROMPT para Professor Saraiva.

### Notas técnicas

- O update de `current_topic_unlocked` continuará funcionando para o próprio admin via RLS, mas centralizar via RPC garante auditoria de **toda** liberação.
- A limpeza on-read é suficiente porque o histórico só é consultado quando o usuário abre o chat — não há acúmulo silencioso problemático para o tamanho esperado.
- Mensagens "salvas" renovam por +3 dias a cada clique (não são permanentes), mantendo a regra de retenção curta.

