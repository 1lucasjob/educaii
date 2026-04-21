

## Objetivo

1. **Auditar e alinhar benefícios dos planos** com o que a aplicação realmente entrega (gating real no código), corrigindo discrepâncias entre o texto exibido em `Planos.tsx` / cadastro e o comportamento real do app.
2. **Auditar regras do Simulado** (Fácil/Difícil/Expert) e fechar lacunas detectadas.
3. **Moderação de avatar pelo admin** — a foto enviada só aparece publicamente após aprovação.

---

## Parte 1 — Auditoria e correção de planos

### Discrepâncias detectadas (banco × código)

| Plano | Texto atual no banco | O que o código realmente entrega |
|---|---|---|
| **free** | "Chat por 15 dias" + "Difícil por 15 dias" | ✅ correto (`computeFreeTrial`) — Chat depende de `chat_unlocked`, que é `false` para free. **BUG**: chat free nunca abre porque `handle_new_user` não setou `chat_unlocked=true` para free; o `ChatProfessor` precisa permitir free dentro de 15 dias mesmo com `chat_unlocked=false`. |
| **days_30** | "Simulados Facil liberado" | ✅ Apenas Fácil. Difícil só após **2 renovações** (`planAllowsHard` em `Simulado.tsx`). Texto está incompleto — falta deixar explícito. |
| **days_60** | "10 dias Difícil + 15 dias Chat" | ✅ janela de plano (`computePlanWindows`) entrega isso, **MAS** `handle_new_user` não marca `chat_unlocked=true` para days_60 — chat fica bloqueado. **BUG real.** |
| **days_90** | "Chat por 20 dias" + "Expert por 10 dias" | ❌ Código entrega **chat ilimitado durante todo o plano** (`chat_unlocked=true` no trigger) e **Expert NÃO é liberado** (só 180/premium). Texto promete o que não existe. |
| **days_180** | "Simulados ilimitados Expert" + "Chat IA" | ✅ trigger libera chat e expert até `access_expires_at`. OK. |
| **premium** | "Expert liberado" + "Chat liberado" | ✅ OK. |

### Ações

**A. Corrigir `handle_new_user` e `admin_renew_user`** (migração SQL):
- `chat_unlocked = true` também para `days_60` (gating fino fica por conta de `computePlanWindows`).
- Definir política do `days_90`:
  - **Opção escolhida no plano**: alinhar **código → texto comercial** (mais generoso para o aluno):
    - days_90 mantém chat ilimitado (já é hoje).
    - days_90 ganha **Expert por 10 dias** a partir da ativação → setar `expert_unlocked_until = now() + 10 days` no trigger e na renovação.

**B. Atualizar `plan_settings` (UPDATE) com redação padronizada e fiel ao código real:**
- `days_30`: "Resumos e Simulado Fácil ilimitados durante o plano · Simulado Difícil libera após 2 renovações consecutivas · Ranking e progresso · Sem Chat e sem Expert"
- `days_60`: "Tudo do 30 DAYS · 60 dias de acesso · Simulado Difícil nos primeiros 10 dias · Chat com Professor Saraiva nos primeiros 15 dias · Sem Expert"
- `days_90`: "Tudo do 30 DAYS · 90 dias de acesso · Simulado Difícil ilimitado · Chat com Professor Saraiva ilimitado · Simulado Expert nos primeiros 10 dias · Ranking e progresso completos"
- `days_180`: "Acesso por 180 dias · Chat ilimitado · Simulados Fácil, Difícil e Expert ilimitados · Inclui um convite extra do Plano 30 DAYS"
- `premium`: "1 ano de acesso · Tudo dos planos anteriores · Chat ilimitado · Simulado Expert ilimitado · Inclui um convite extra do Plano 60 DAYS · Prioridade em novos recursos"
- `free`: deixar como está (já está correto).

**C. Frontend `ChatProfessor.tsx`**: ajustar a condição `unlocked` para permitir **free** durante a janela de 15 dias (`trial.freeChatActive`) mesmo com `chat_unlocked=false`. Hoje a página depende só de `chat_unlocked` em alguns trechos — confirmar e corrigir se necessário.

---

## Parte 2 — Auditoria do Simulado

### Regras esperadas vs. implementação atual em `Simulado.tsx`

| Regra | Status |
|---|---|
| Tempo: Fácil 15 min, Difícil 10 min, Expert 20 min | ✅ |
| Difícil/Expert: sem voltar, sem alterar resposta | ✅ |
| Anti-cheat: ≥ 120s e máx. 3 tentativas válidas/tema/dia | ✅ |
| Difícil ≥ 80 pts libera novo tema | ✅ |
| Gating Free: Fácil 30d, Difícil 15d | ✅ |
| Gating Difícil para planos pagos | ⚠️ days_30 precisa de **2 renovações** (`days_30_renewals_count >= 2`). OK no código. |
| Gating Expert | ⚠️ Hoje só `premium`/`days_90`/ADM. **Bug do plano**: o banco diz que `days_180` tem Expert mas `expertActive()` em `freeTrial.ts` NÃO inclui `days_180`. **Corrigir `expertActive` para incluir `days_180`**. |
| Mín. caracteres para liberar dificuldade no Estudar | ✅ 500 / 1501 / 5000 |

### Ações
- `src/lib/freeTrial.ts` → `expertActive()`: incluir `days_180` na lista de planos com Expert sempre ativo.
- `src/pages/Simulado.tsx`: revisar `planAllowsHard` para refletir a nova política do days_90 (já allowed) e days_60 (já allowed via janela).
- Mensagem de bloqueio do Expert: atualizar para "exclusivo dos planos PREMIUM, 180 DAYS e 90 DAYS (10 dias iniciais)".

---

## Parte 3 — Moderação de avatar pelo admin

### Banco (migração)
- Adicionar em `public.profiles`:
  - `avatar_pending_url text` — última imagem enviada aguardando revisão.
  - `avatar_status text` default `'none'` com values: `none` | `pending` | `approved` | `rejected`.
  - `avatar_reviewed_at timestamptz`, `avatar_reviewed_by uuid`.
- Manter `avatar_url` apenas com a versão **aprovada** (única que aparece publicamente).
- RPCs `SECURITY DEFINER`:
  - `admin_approve_avatar(_user_id uuid)` → copia `avatar_pending_url` para `avatar_url`, marca `approved`.
  - `admin_reject_avatar(_user_id uuid)` → limpa `avatar_pending_url`, marca `rejected`. Mantém `avatar_url` antigo (se existia).
- Atualizar `get_leaderboard` para continuar usando `avatar_url` (já é o aprovado).

### Frontend
- **`src/pages/Configuracoes.tsx`**:
  - Upload agora salva em `avatar_pending_url` (não em `avatar_url`) e marca `avatar_status='pending'`.
  - Mostrar bandeira: "Imagem em análise pelo administrador" / "Imagem rejeitada — envie outra" / "Imagem aprovada".
  - Pré-visualização local do `avatar_pending_url` apenas para o próprio usuário; `Avatar` público usa `avatar_url`.
- **`src/contexts/AuthContext.tsx`**: incluir os novos campos no tipo `Profile` e no `select`.
- **`src/pages/Admin.tsx`**: nova seção **"Imagens de perfil pendentes"** com lista (email, prévia da imagem, botões "Aprovar" / "Rejeitar"). Carrega `profiles` onde `avatar_status='pending'`.
- **Header (`AppLayout.tsx`)** e **Ranking**: continuam usando `avatar_url` (aprovada) — nada quebra.

### Bypass para admin
- Uploads feitos por usuários com role `admin` são auto-aprovados (RPC `admin_approve_avatar` é chamado logo após o upload no próprio Configurações quando `isAdmin === true`).

---

## Arquivos afetados

### Banco
- Migração: alterar `handle_new_user` (chat_unlocked + expert para days_60/days_90), alterar `admin_renew_user`, adicionar colunas `avatar_pending_url` / `avatar_status` / `avatar_reviewed_at` / `avatar_reviewed_by` em `profiles`, criar RPCs `admin_approve_avatar` e `admin_reject_avatar`.
- INSERT/UPDATE em `plan_settings.benefits` com a redação nova.

### Código
- `src/lib/freeTrial.ts` — `expertActive()` inclui `days_180`.
- `src/pages/Simulado.tsx` — mensagem de bloqueio do Expert.
- `src/pages/ChatProfessor.tsx` — condição `unlocked` cobrindo free dentro da janela de 15d.
- `src/contexts/AuthContext.tsx` — novos campos de avatar.
- `src/pages/Configuracoes.tsx` — fluxo de upload pendente + status.
- `src/pages/Admin.tsx` — fila de moderação de avatares.

