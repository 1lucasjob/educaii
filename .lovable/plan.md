

## App de Estudos — Segurança do Trabalho

App moderno em preto e amarelo (escuro por padrão) com IA real, autenticação real via Lovable Cloud, painel admin com vagas controladas e biblioteca de NRs.

---

### 1. Backend (Lovable Cloud)

**Tabelas:**
- `profiles` — id, email, secret_question, secret_answer (hash), reserve_code (5 dígitos, único, hash), theme, current_topic, current_topic_unlocked, last_score
- `user_roles` — role separada (`admin` | `student`) com função `has_role()` SECURITY DEFINER
- `invites` — token único, criado_por (admin), usado (bool), expira_em, used_by
- `available_slots` — contador global de vagas liberadas pelo admin (single row)
- `study_sessions` — user_id, topic, summary, created_at
- `quiz_attempts` — user_id, topic, difficulty (`easy`|`hard`), score, total_points, questions (jsonb), answers (jsonb)

**Edge functions (Lovable AI — Gemini):**
- `generate-summary` — retorna resumo técnico do tema (persona: professor rigoroso de Segurança do Trabalho)
- `generate-quiz` — retorna questões + gabarito + pontos por questão (fácil: 10–25q; difícil: 5–15q; total 100 pts)
- `create-invite` — valida PIN admin "1631", gera token único, incrementa vagas, retorna link `/cadastro?token=...`

**Auth:**
- Email + senha nativos do Supabase
- Confirmação de email **desligada** para facilitar login
- "Esqueci a senha" → reset por email real (magic link)
- Admin `1lucasjob@gmail.com` é semeado com role `admin` no primeiro setup

---

### 2. Telas de Autenticação

- **Login** (`/login`) — email + senha, link "Esqueci senha" e "Esqueci email"
- **Cadastro por convite** (`/cadastro?token=xxx`) — valida token; se válido, formulário com email, senha, código reserva 5 dígitos, pergunta secreta + resposta. Marca convite como usado.
- **Esqueci senha** (`/recuperar-senha`) — email → envia magic link real
- **Esqueci email** (`/recuperar-email`) — input código reserva 5 dígitos → mostra pergunta secreta → resposta correta revela o email mascarado

---

### 3. Layout principal (após login)

Sidebar shadcn colapsável (preto + destaques amarelos) com:
- 📚 **Estudar** (módulo IA)
- 📖 **Normas Principais** (NR-01 a NR-15)
- 📊 **Meu Progresso** (histórico de simulados)
- 🛡️ **Gestão de Cadastros** (apenas admin)
- ⚙️ **Configurações** (troca de tema)
- 🚪 Logout

Header fixo com nome do usuário + badge "Admin" se aplicável.

---

### 4. Módulo de Estudos (fluxo principal)

**Tela com card central:**
1. Input grande "Sobre qual tema quer estudar?" com botão amarelo "Gerar Estudo"
2. Visual de **cadeado**: 🔒 amarelo travado se há tema ativo não dominado, 🔓 verde se desbloqueado
3. Barra de progresso mostrando última nota / 80
4. Após enviar tema → IA gera **resumo técnico** (renderizado com markdown)
5. Dois botões grandes: **Simulado Fácil** (amarelo claro) e **Simulado Difícil** (amarelo escuro)
6. Tela de quiz: uma questão por vez, navegação, timer opcional, submit final
7. Tela de resultado: nota /100, gabarito comentado, e:
   - Se difícil ≥ 80 → desbloqueia novo tema (cadeado abre, animação)
   - Caso contrário → botão "Tentar de novo" / "Estudar mais"

**Bloqueio:** input de novo tema fica `disabled` com tooltip explicando a regra até passar no difícil ≥ 80.

---

### 5. Painel do Admin — Gestão de Cadastros

- Card grande: **"Vagas disponíveis: N"**
- Botão amarelo **"Liberar +1 acesso"** → modal pede PIN (campo de 4 dígitos)
- PIN "1631" correto → edge function gera token, incrementa vagas, retorna link
- Lista de **convites ativos**: link copiável, status (não usado / usado por X / expirado)
- Tabela de **alunos cadastrados** com email, último acesso, última nota

---

### 6. Biblioteca de NRs

- Layout com **abas verticais** (NR-01 … NR-15) à esquerda
- Painel direito mostra título completo + conteúdo estruturado (resumo, aplicação, principais artigos) usando texto placeholder técnico
- Busca rápida no topo
- Ícone de capacete/escudo em cada NR

---

### 7. Sistema de Temas

Página de Configurações com 4 cards de tema clicáveis:
- 🌑 Preto + Amarelo (padrão)
- ☀️ Branco + Azul
- 🌿 Branco + Verde
- 🍊 Branco + Laranja

Implementado via tokens HSL em `index.css` + classes `theme-*` no `<html>`. Preferência salva no `profiles.theme` e em localStorage para carregar instantaneamente.

---

### 8. Design System

- Fundo: preto profundo `#0A0A0A` / superfícies `#161616`
- Destaque: amarelo vibrante `#FACC15`
- Tipografia: Inter (já presente)
- Componentes shadcn customizados via tokens semânticos
- Ícones lucide: `Lock`, `Unlock`, `GraduationCap`, `ShieldCheck`, `HardHat`, `BookOpen`, `Brain`, `Trophy`, `KeyRound`

---

### 9. Segurança

- Roles em tabela separada (`user_roles`) — nunca em profiles
- RLS em todas as tabelas (aluno só vê o próprio; admin vê tudo via `has_role`)
- PIN "1631" validado em edge function (não no client)
- Código reserva e resposta secreta armazenados com hash
- Convites de uso único com expiração

---

### 10. Ordem de implementação

1. Habilitar Lovable Cloud + tabelas + RLS + roles + seed admin
2. Design system (tokens + 4 temas) + layout com sidebar
3. Auth: login, cadastro por convite, recuperação de senha/email
4. Painel admin + edge function de convites
5. Módulo de estudo + edge functions de IA + lógica de bloqueio
6. Biblioteca de NRs
7. Configurações (troca de tema) + polimentos finais

