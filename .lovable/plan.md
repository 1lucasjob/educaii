

## Objetivo

Remover marcadores Markdown (`#`, `*`, `**`, `_`, etc.) do **resumo gerado** na área de estudos, deixando o texto limpo para leitura por IA de TTS (text-to-speech), e melhorar o espaçamento entre seções para que não fiquem visualmente colados.

---

## Diagnóstico

O resumo é gerado pela edge function `supabase/functions/generate-summary/index.ts`, que instrui o modelo a responder em **Markdown** com `**negrito**`, `#` títulos e bullets `-`. Esse texto é depois renderizado em `Estudar.tsx` (provavelmente via `whitespace-pre-wrap` ou um renderer Markdown) e também é o mesmo texto que o usuário copia/escuta na IA de leitura — daí a poluição com `#` e `*`.

---

## Mudanças

### 1. `supabase/functions/generate-summary/index.ts`
Reescrever o `SYSTEM_PROMPT` para produzir **texto plano estruturado**, sem qualquer sintaxe Markdown:
- Proibir explicitamente `#`, `*`, `**`, `_`, `` ` ``, `>`, tabelas e bullets `-`/`•`.
- Substituir títulos de seção por linhas em CAIXA ALTA seguidas de dois-pontos (ex.: `VISÃO GERAL DO TEMA:`).
- Itens de lista viram parágrafos curtos numerados (`1) …`, `2) …`) ou frases independentes — sem marcadores.
- Exigir **uma linha em branco entre cada seção** e entre cada item, garantindo respiro visual e pausas naturais na leitura por TTS.
- Manter a mesma estrutura pedagógica (Visão geral, Conceitos-chave, Aplicação prática, Riscos, Pontos críticos, NRs aplicáveis, Observações do Professor).

### 2. `src/pages/Estudar.tsx` — sanitização defensiva
Mesmo com o prompt novo, modelos LLM eventualmente "vazam" Markdown. Adicionar um sanitizador aplicado ao `summary` antes de exibir e antes de enviar para a IA de leitura:

```ts
function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "")          // # títulos
    .replace(/\*\*(.+?)\*\*/g, "$1")      // **negrito**
    .replace(/\*(.+?)\*/g, "$1")          // *itálico*
    .replace(/__(.+?)__/g, "$1")          // __negrito__
    .replace(/_(.+?)_/g, "$1")            // _itálico_
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")// `código`
    .replace(/^\s*[-*•]\s+/gm, "")        // bullets
    .replace(/^\s*>\s?/gm, "")            // blockquote
    .replace(/\n{3,}/g, "\n\n")           // colapsa quebras excessivas
    .replace(/[ \t]+\n/g, "\n")           // trim por linha
    .trim();
}
```

- Aplicar `stripMarkdown(summary)` no momento da exibição e ao copiar/enviar para TTS.
- Renderizar com `whitespace-pre-line` (ou `pre-wrap`) e `leading-relaxed` + `space-y-3` no container para garantir espaçamento confortável entre parágrafos.

---

## Arquivos afetados

- **Editado**: `supabase/functions/generate-summary/index.ts` — novo `SYSTEM_PROMPT` em texto plano com regras explícitas de espaçamento.
- **Editado**: `src/pages/Estudar.tsx` — função `stripMarkdown` + aplicação no render do resumo e nas ações de cópia/leitura por IA, ajuste de classes de espaçamento (`whitespace-pre-line leading-relaxed`).

