

## Plano: Termos de Uso + aviso no Chat + formatação melhor das respostas do Professor

### 1. Termos de Uso (aceite obrigatório)

**Página nova `/termos`** (`src/pages/Termos.tsx`) — leitura pública, conteúdo completo dos termos. Inclui regras como:

- **Reembolso por indisponibilidade**: se o app ficar fora do ar ou deixar de funcionar de forma definitiva, o aluno recebe de volta o valor proporcional aos meses restantes do plano, em até **20 dias corridos** após a confirmação.
- **Conteúdo gerado por IA**: respostas são apoio ao estudo, não substituem o texto oficial das NRs nem orientação profissional. O aluno deve sempre conferir a norma vigente.
- **Uso individual**: conta é pessoal e intransferível; compartilhamento de login pode causar suspensão sem reembolso.
- **Conduta**: proibido ofensa, spam, scraping, engenharia reversa ou tentar burlar limites de plano.
- **Limites de uso justo**: chat e geração de resumos/simulados têm limites razoáveis para evitar abuso.
- **Manutenções programadas**: paradas curtas para manutenção/atualização não geram reembolso.
- **Privacidade**: dados tratados conforme LGPD; e-mail só usado para login, comunicação do serviço e cobrança.
- **Cancelamento**: aluno pode pedir cancelamento por e-mail; valor já consumido não é devolvido, exceto na regra de indisponibilidade acima.
- **Alterações**: termos podem ser atualizados; mudanças relevantes pedem novo aceite.
- **Foro / contato**: e-mail oficial de suporte e foro da comarca do responsável pelo app.

**Aceite no cadastro** (`src/pages/Cadastro.tsx`):
- Checkbox obrigatório "Li e aceito os [Termos de Uso](/termos)" antes de habilitar o botão de cadastrar.
- Sem aceite ⇒ botão desabilitado + toast explicativo.

**Aceite para usuários já existentes**:
- Migração SQL: adicionar `terms_accepted_at timestamptz` na tabela `profiles`.
- Componente `TermsGate` em `AppLayout`: se `profile.terms_accepted_at` é null, abre `Dialog` modal bloqueante com resumo + link para os termos completos + botão "Aceito". Ao aceitar, grava `terms_accepted_at = now()`.
- Link permanente para `/termos` no rodapé do sidebar.

### 2. Aviso no Chat com Professor

Em `src/pages/ChatProfessor.tsx`, logo abaixo do alerta amarelo de "3 dias", adicionar um novo `Alert` informativo (azul/info) com ícone `Wrench`:

> "O Chat está em atualização para ficar mais rápido e preciso. Algumas respostas podem demorar mais que o normal — obrigado pela paciência!"

Mostrado sempre que o chat está desbloqueado.

### 3. Respostas do Professor Saraiva mais organizadas + destaques amarelos

**Edge function `supabase/functions/chat-professor/index.ts`** — atualizar o `SYSTEM_PROMPT` para impor formatação clara:

- Sempre usar títulos `##` para seções e `###` para subseções.
- **Linha em branco entre cada parágrafo, lista e título** (sem texto colado).
- Listas com `-` curtas (máx ~2 linhas por item).
- Usar **negrito** apenas em termos-chave, números de NR, valores e conceitos importantes — não em frases inteiras.
- Estrutura sugerida: `## Resposta direta` → `## Detalhes` → `## Exemplo prático` → `### 🎓 Observação do Professor`.
- Proibido emendar 3+ frases num parágrafo só; quebrar em parágrafos curtos.

**Renderização no front (`ChatProfessor.tsx`)**:
- Manter `ReactMarkdown`, mas customizar componentes:
  - `strong`: classe `text-yellow-400 font-semibold` (destaques amarelos pedidos).
  - `h2`: `text-base font-bold mt-4 mb-2 text-primary`.
  - `h3`: `text-sm font-semibold mt-3 mb-1.5`.
  - `p`: `my-2 leading-relaxed`.
  - `ul` / `ol`: `my-2 space-y-1.5 pl-5`.
  - `li`: `leading-relaxed`.
- Aumentar respiro do balão do assistente: `space-y-2` no container, `prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-li:my-1`.

### Arquivos

- **Novo**: `src/pages/Termos.tsx`, `src/components/TermsGate.tsx`
- **Editar**: `src/App.tsx` (rota `/termos`), `src/pages/Cadastro.tsx` (checkbox), `src/layouts/AppLayout.tsx` (montar `TermsGate` + link no sidebar), `src/pages/ChatProfessor.tsx` (alerta + componentes do markdown), `supabase/functions/chat-professor/index.ts` (prompt)
- **Migração**: adicionar coluna `terms_accepted_at` em `profiles`

