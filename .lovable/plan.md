

## Plano: Reduzir mínimo para 300 caracteres (sem ranking nem salvamento)

### Objetivo
Permitir gerar resumos de estudo a partir de **300 caracteres**, mas textos com menos de **1000 caracteres** não contam para o ranking e **não são salvos** (nem em `study_sessions`, nem atualizam `profiles.current_topic`).

### Comportamento

| Caracteres | Gera resumo? | Salva sessão? | Trava tema (bloqueia novos)? | Conta no ranking? |
|---|---|---|---|---|
| < 300 | Não | — | — | — |
| 300–999 | Sim (modo "rascunho") | **Não** | **Não** | **Não** |
| ≥ 1000 | Sim (modo completo) | Sim | Sim | Sim |

Como o tema não fica travado em modo rascunho, o aluno pode gerar quantos resumos curtos quiser sem precisar fazer simulado difícil para liberar.

### Mudanças em `src/pages/Estudar.tsx`

1. Adicionar constante `MIN_CHARS_DRAFT = 300` (manter `MIN_CHARS = 1000` como limite "completo").
2. Substituir `meetsMin` por dois flags:
   - `meetsDraft = topicLength >= 300`
   - `meetsFull = topicLength >= 1000`
3. Botão "Gerar Estudo" habilitado quando `meetsDraft && titleValid`.
4. Em `generate()`:
   - Bloqueia se `!meetsDraft` (toast: "Mínimo 300 caracteres").
   - Após receber o resumo: se `meetsFull`, segue fluxo atual (insert em `study_sessions`, update `profiles` travando o tema). Se só `meetsDraft`, **pula** o `insert` e o `update` — apenas exibe `summary` na tela e mostra um aviso.
5. Exibir um `Alert` discreto acima do resumo quando for rascunho:
   > "Modo rascunho: este resumo não foi salvo no histórico e não conta para o ranking. Escreva 1000+ caracteres para salvar e desbloquear simulados que valem pontos."
6. Atualizar o contador embaixo do textarea para mostrar 3 estados:
   - `< 300`: cinza, "X/300 (mínimo para gerar)"
   - `300–999`: amarelo, "X/1000 — modo rascunho (não salva, não pontua)"
   - `≥ 1000`: verde, "X/1000 ✓ válido para ranking"
7. Barra de progresso passa a ser sobre 1000 (igual hoje), mas com cor variando (cinza/amarelo/verde) conforme o estado.
8. Atualizar o `placeholder` do textarea para mencionar os dois patamares.
9. No card de resumo (modo rascunho), **ocultar** os botões "Simulado Fácil/Difícil", já que não temos `activeTopic` persistido — substituir por uma nota: "Para fazer simulado deste tema, escreva 1000+ caracteres e gere novamente."

### Sem mudanças

- Banco de dados: nenhuma migração.
- Edge function `generate-summary`: continua igual.
- Páginas Simulado, Ranking, Progresso: nada muda (rascunhos simplesmente não chegam lá).

### Arquivo
- **Editar**: `src/pages/Estudar.tsx`

