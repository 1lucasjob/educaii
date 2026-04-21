

## Objetivo

Criar a **Creuza**, agente de suporte da plataforma, com chat dedicado e botão flutuante acessível em qualquer página do app. Ela ajuda com dúvidas sobre planos, navegação e problemas técnicos — separada da IA tutora (Professor Saraiva), que continua responsável pelo conteúdo de SST.

---

## Como vai funcionar

### 1. Botão flutuante de suporte (FAB)
- Pequeno botão circular fixo no canto inferior direito de **todas as páginas dentro de `/app/*`** (renderizado no `AppLayout`).
- Ícone `Headset` ou `LifeBuoy` com cor de destaque (roxo/rosa) e tooltip "Falar com a Creuza".
- Ao clicar: abre um **drawer lateral** (componente `Sheet` do shadcn, lado direito) com o chat da Creuza embutido.
- Não aparece para visitantes não autenticados (já que está dentro do `AppLayout`).
- Esconde automaticamente quando o usuário já está em `/app/suporte` (rota dedicada) para evitar duplicidade.

### 2. Página dedicada `/app/suporte`
- Para quem prefere uma tela cheia (ex.: histórico mais longo, mobile).
- Mesmo componente de chat reaproveitado (`<CreuzaChat />`), só que em layout de página.
- Acessível pelo menu lateral em "Conta" → **"Suporte (Creuza)"** com ícone `Headset`.

### 3. Componente `CreuzaChat`
- Reaproveita o padrão visual e técnico do `ChatProfessor.tsx` (streaming, markdown, scroll automático, textarea com Enter para enviar).
- **Diferenças**:
  - Mensagem de boas-vindas automática na primeira abertura: *"Olá! Eu sou a Creuza, sua assistente de suporte da plataforma de IA para Saúde e Segurança do Trabalho. Como posso ajudar nos seus estudos hoje?"*
  - **Sem persistência no banco** nesta primeira versão — histórico só vive na sessão (estado local + `sessionStorage` para sobreviver a refresh dentro da mesma aba). Isso evita custo de migração e simplifica o gating (suporte é livre para todos, inclusive FREE expirado).
  - **Acesso liberado para qualquer plano** (FREE, expirado, admin) — suporte sempre disponível.
  - Botão "Limpar conversa" e botão "Enviar e-mail ao suporte humano" (abre `mailto:1lucasjob@gmail.com`) sempre visíveis no rodapé do chat.

### 4. Edge function `creuza-support`
- Nova função em `supabase/functions/creuza-support/index.ts`.
- Modelo: `google/gemini-2.5-flash` via Lovable AI Gateway (rápido, barato, bom para suporte).
- **Streaming SSE** (mesmo padrão do `chat-professor`).
- `verify_jwt = true` (default) — só usuários logados conversam com a Creuza.
- **System prompt** já definido pelo usuário, com pequenos ajustes de formatação:
  - Personalidade: Creuza, suporte, acolhedora, didática, paciente.
  - Conhecimento: planos (FREE, 30, 60, 90, 180 dias, 1 ano = PREMIUM), funcionalidades principais da plataforma (Estudar, Modelos de Estudo 5W2H/SWOT, Simulado fácil/médio/difícil/expert, Análise de Desempenho IA, Ranking, Progresso, Chat com Professor Saraiva).
  - Regras: sempre se apresentar na primeira mensagem, nunca inventar (alucinação), escalonar problemas técnicos/financeiros/cancelamento para `1lucasjob@gmail.com`.
  - SOPs: dúvidas técnicas de SST → redirecionar ao **Chat com Professor Saraiva**; login/acesso → cache + email; escolha de planos → perguntar necessidade e recomendar (180 dias / 1 ano para graduação).
  - Formato: respostas curtas em PT-BR, com markdown leve (negrito em termos-chave, listas curtas), sem títulos longos.
- Recebe contexto do usuário no payload: `{ messages, userContext: { plan, planLabel, accessExpiresAt, isFree, isExpired } }` para a Creuza personalizar respostas (ex.: "Você está no plano FREE — para desbloquear X, considere o plano 90 DAYS").
- Trata 429 (rate limit) e 402 (créditos esgotados) com mensagem amigável.

### 5. Item no menu lateral
- Em `AppLayout.tsx`, adicionar no grupo **"Conta"** (acima de Configurações):
  - **"Suporte (Creuza)"** → `/app/suporte`, ícone `Headset`.

### 6. Rota
- Em `App.tsx`, registrar `<Route path="suporte" element={<Suporte />} />` dentro de `/app`.

---

## Arquivos afetados

### Novos
- `src/components/CreuzaChat.tsx` — componente reutilizável de chat (usado no FAB e na página).
- `src/components/CreuzaFab.tsx` — botão flutuante + drawer com `<CreuzaChat />`.
- `src/pages/Suporte.tsx` — página dedicada `/app/suporte` que renderiza `<CreuzaChat />` em layout cheio.
- `supabase/functions/creuza-support/index.ts` — edge function com system prompt + streaming.

### Editados
- `src/App.tsx` — registrar rota `/app/suporte`.
- `src/layouts/AppLayout.tsx` — montar `<CreuzaFab />` no shell e adicionar item de menu "Suporte (Creuza)" em "Conta".

### Banco
- Sem migrações (histórico só em sessão; sem persistência nesta versão).

---

## Acesso

- **Liberado para todos os planos** (incluindo FREE expirado e visitantes recém-cadastrados) — suporte deve estar sempre disponível.
- Admin enxerga normalmente; nenhum gating extra.

