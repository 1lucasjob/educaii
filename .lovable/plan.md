

## Objetivo

Tirar os cards 5W2H e SWOT da área principal de estudo e mover para uma **página dedicada** ("Modelos de Estudo"), onde cada framework tem:

1. **Resumo explicativo** do que é, para que serve e quando usar.
2. **Exemplo prático** preenchido (caso real).
3. **Modo de treino interativo** — o aluno preenche cada campo do framework e a IA dá feedback.
4. **Botão "Usar este modelo no Estudar"** — leva para `/app/estudar` com o template já carregado (mantém o vínculo).

---

## Parte 1 — Nova rota `/app/modelos`

### Novo arquivo `src/pages/Modelos.tsx`
- Lista os frameworks de `studyFrameworks.ts` em cards coloridos (mesmo visual atual do `FrameworkPicker`).
- Ao clicar num card, abre a **visão detalhada** do framework (mesma página, troca de seção via state — sem nova rota).

### Visão detalhada do framework
Estrutura em 3 abas (`Tabs` do shadcn):

**Aba 1 — "O que é"**
- Título grande com cor do framework + ícone.
- Texto explicativo (2-3 parágrafos): origem, para que serve, quando aplicar, benefícios.
- Exemplo prático curto já preenchido (ex.: 5W2H aplicado a "Implantar EPI no canteiro").

**Aba 2 — "Treinar"**
- Campo "Tema do exercício" (input curto) — ex.: "Reduzir acidentes na obra X".
- Para cada item do framework (What, Why, etc. ou Forças, Fraquezas, etc.) um `Textarea` separado com label colorida e placeholder de ajuda.
- Botão **"Receber feedback da IA"** → chama edge function `framework-feedback` (nova) → exibe análise em texto plano abaixo, no padrão atual (sem markdown).
- Botão **"Limpar"** zera os campos.

**Aba 3 — "Usar no Estudar"**
- Texto curto: "Quer gerar um resumo completo usando este modelo?"
- Botão grande → navega para `/app/estudar?framework=5w2h` (ou `swot`) e a página Estudar lê o query param e auto-aplica o template.

### Novo arquivo `supabase/functions/framework-feedback/index.ts`
- Input: `{ frameworkId: "5w2h" | "swot", topic: string, fields: Record<string, string> }`.
- Modelo: `google/gemini-2.5-flash` via Lovable AI Gateway.
- System prompt em PT-BR, texto plano (sem markdown), avalia cada campo: o que está bom, o que falta, sugestões de melhoria, e dá uma nota geral de 0 a 10 sobre a qualidade do preenchimento.
- `verify_jwt = true` (default).
- Trata 429 e 402 com mensagem amigável.

---

## Parte 2 — Atualizar áreas existentes

### `src/lib/studyFrameworks.ts`
- Adicionar dois novos campos por framework:
  - `explanation: string` — texto longo explicando o que é.
  - `example: string` — exemplo prático preenchido.
  - `fields: { key: string; label: string; placeholder: string }[]` — definição estruturada dos campos para o modo treino (substitui o template plano para a UI de treino, mas o `template` continua existindo para uso no Estudar).

### `src/pages/Estudar.tsx`
- **Remover** o componente `FrameworkPicker` da página (não fica mais junto com a área de estudo).
- **Adicionar** suporte a query param `?framework=5w2h|swot`: ao detectar, busca o framework, aplica `setTitle` + `setTopic` (mesma lógica atual do `handlePickFramework`) e limpa o param da URL.
- **Adicionar** um link discreto acima do form: "Conheça os Modelos de Estudo (5W2H, SWOT)" → `/app/modelos`.

### `src/components/FrameworkPicker.tsx`
- Mantido (será reutilizado dentro de `Modelos.tsx` como a grid inicial de seleção).

### `src/layouts/AppLayout.tsx`
- Adicionar item de menu **"Modelos de Estudo"** (ícone `Sparkles` ou `BookOpen`) no grupo "Aluno", logo abaixo de "Estudar".

### `src/App.tsx`
- Registrar nova rota `<Route path="modelos" element={<Modelos />} />` dentro de `/app`.

---

## Acesso

- Liberado para **todos os planos** (incluindo FREE) — é material educativo introdutório.
- Modo de treino com IA também livre (consumo baixo, conteúdo educativo).

---

## Arquivos afetados

### Novos
- `src/pages/Modelos.tsx` — página com lista + detalhe + abas (O que é / Treinar / Usar no Estudar).
- `supabase/functions/framework-feedback/index.ts` — IA para feedback do treino.

### Editados
- `src/lib/studyFrameworks.ts` — adiciona `explanation`, `example`, `fields[]`.
- `src/pages/Estudar.tsx` — remove `FrameworkPicker`, adiciona query param + link para `/app/modelos`.
- `src/layouts/AppLayout.tsx` — novo item "Modelos de Estudo" no menu.
- `src/App.tsx` — nova rota.

### Banco
- Sem migrações.

