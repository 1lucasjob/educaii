

## Plano: Novos limites de caracteres e quantidade de questões

### Novo comportamento por caracteres

| Caracteres | Gera resumo? | Salva sessão? | Simulado Fácil? | Simulado Difícil? |
|---|---|---|---|---|
| < 500 | Não | — | — | — |
| 500–1500 | Sim | Sim | ✅ Liberado | ❌ Bloqueado |
| 1501+ | Sim | Sim | ✅ Liberado | ✅ Liberado |

Removido o "modo rascunho" — agora todo resumo gerado é salvo. O que muda é qual simulado fica disponível.

### Mudanças em `src/pages/Estudar.tsx`

1. Substituir constantes:
   - `MIN_CHARS_EASY = 500` (mínimo para gerar e liberar Fácil)
   - `MIN_CHARS_HARD = 1501` (libera Difícil)
   - Remover `MIN_CHARS_DRAFT` e `MIN_CHARS`.
2. Flags:
   - `meetsEasy = topicLength >= 500`
   - `meetsHard = topicLength >= 1501`
3. Botão "Gerar Estudo" habilitado quando `meetsEasy && titleValid`.
4. Em `generate()`:
   - Bloqueia se `!meetsEasy` (toast: "Mínimo 500 caracteres").
   - Sempre salva em `study_sessions` e atualiza `profiles.current_topic` (trava o tema até concluir simulado difícil ≥80, igual hoje).
   - Guardar `hardUnlocked = meetsHard` em estado para controlar o botão na tela de resumo.
5. Card de resumo:
   - Sempre mostra o botão **Simulado Fácil**.
   - Botão **Simulado Difícil** aparece habilitado só se `hardUnlocked`; caso contrário aparece desabilitado com tooltip/legenda: "Escreva 1501+ caracteres para liberar o Simulado Difícil".
6. Contador embaixo do textarea com 3 estados:
   - `< 500`: cinza, "X/500 (mínimo para gerar)"
   - `500–1500`: azul, "X/1501 ✓ libera Simulado Fácil"
   - `≥ 1501`: verde, "X/1501 ✓ libera Fácil + Difícil"
7. Barra de progresso passa a ser sobre 1501.
8. Atualizar `placeholder` do textarea mencionando os dois patamares.
9. Remover toda lógica e UI de `summaryIsDraft` / alerta de rascunho.

### Mudanças em `supabase/functions/generate-quiz/index.ts`

Atualizar a faixa de quantidade de questões para **5 a 10** em ambos os modos:

- `easy`: `"entre 5 e 10 questões"` (era 10–25).
- `hard`: `"entre 5 e 10 questões de NÍVEL EXAMINADOR..."` (era 8–15).

Pontuação total continua = 100, distribuída entre as questões (lógica de normalização já existente cobre isso).

### Sem mudanças

- Banco de dados: nenhuma migração.
- Edge function `generate-summary`: continua igual.
- `src/pages/Simulado.tsx`: nada muda — aceita qualquer quantidade que vier do edge function.
- Ranking, Progresso, gating de plano, admin: sem alteração.

### Arquivos
- **Editar**: `src/pages/Estudar.tsx`, `supabase/functions/generate-quiz/index.ts`

