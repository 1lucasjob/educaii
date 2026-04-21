

## Objetivo

Adicionar uma opção **"Retomar Simulado"** na página **Módulo de Estudos** (`Estudar.tsx`) para que o aluno consiga voltar ao simulado em andamento caso ele "suma" (saída acidental, refresh, troca de aba, navegação por engano).

Hoje o `Simulado.tsx` mantém estado apenas em memória (`useState`). Qualquer saída da rota descarta tudo — daí a sensação de que o simulado "desaparece".

---

## Como vai funcionar

1. Ao iniciar/avançar um simulado, o `Simulado.tsx` **persiste o progresso em `localStorage`** (chave por usuário) automaticamente.
2. A `Estudar.tsx` lê essa chave ao montar; se houver um simulado **não finalizado e não expirado**, mostra um **card de destaque "Retomar Simulado"** logo abaixo do cabeçalho com:
   - Tema, dificuldade (badge colorido), questão atual (`3/10`), tempo restante e botão **"Retomar"** + botão secundário **"Descartar"**.
3. Ao clicar em **Retomar**, navega para `/app/simulado?...&resume=1`. O `Simulado.tsx` detecta `resume=1`, restaura `questions/answers/current/timeLeft/timeSpent` da `localStorage` em vez de gerar um novo.
4. Quando o simulado é **finalizado** (submit) ou **descartado**, a chave é apagada.
5. **Expiração**: se `timeLeft` calculado já zerou (ex.: usuário voltou 1 dia depois), o card não aparece e a chave é limpa.

---

## Detalhes técnicos

### Persistência (`localStorage`)

- Chave: `quiz_in_progress:${profile.id}` (um simulado ativo por usuário).
- Payload:
  ```ts
  type SavedQuiz = {
    topic: string;
    difficulty: "easy" | "hard" | "expert";
    questions: Question[];
    answers: number[];
    current: number;
    timeLeft: number;       // segundos restantes salvos
    timeSpent: number;
    savedAt: number;        // Date.now() — usado para descontar tempo passado
    timeLimit: number;      // limite original (para validar não-expirado)
  };
  ```
- Helpers em **novo arquivo** `src/lib/quizPersistence.ts`: `saveQuiz`, `loadQuiz`, `clearQuiz`, `getResumableQuiz` (descarta automaticamente expirados).

### `src/pages/Simulado.tsx`

- Após carregar as questões (e após cada `select`/tick do timer), chamar `saveQuiz(...)` com debounce simples (gravar a cada mudança de resposta e a cada ~5s do timer para não martelar o storage).
- No `useEffect` inicial: se `params.get("resume") === "1"` e `loadQuiz()` retornar um payload válido para o mesmo `topic` + `difficulty`, restaurar todos os estados (incluindo `timeLeft` ajustado por `savedAt`) **em vez de** chamar `generate-quiz`.
- No `submit()` e ao "voltar" pelo botão existente: chamar `clearQuiz()`.

### `src/pages/Estudar.tsx`

- Novo componente inline (ou hook) que lê `getResumableQuiz()` no mount e em `focus` da janela.
- Renderizar, **acima** do card "Pronto para um novo tema", um `Card` chamativo (border `primary`, ícone `RotateCcw`):
  - Título "Simulado em andamento"
  - Linha: badge da dificuldade · `Tema: …` · `Questão {current+1}/{total}` · `Tempo restante: mm:ss`
  - Botões: **Retomar** (`gradient-primary`) → `navigate(`/app/simulado?topic=…&difficulty=…&resume=1`)` · **Descartar** (variant `ghost`) → `clearQuiz()` + re-render.
- Se nada resumível, não renderiza nada (sem ruído).

### Edge cases tratados
- Quiz expirado por tempo → auto-descarta na leitura.
- Trocou de usuário → chave por `profile.id` evita vazamento entre contas.
- Storage cheio/desabilitado → todos os acessos em `try/catch` (silencioso).
- Modos `hard`/`expert` continuam com auto-advance e bloqueio de troca de resposta — a persistência apenas reflete o estado salvo, sem afrouxar regras anti-fraude (o tempo já gasto é preservado).

---

## Arquivos afetados

- **Novo**: `src/lib/quizPersistence.ts` — helpers de save/load/clear.
- **Editado**: `src/pages/Simulado.tsx` — salvar progresso, restaurar quando `?resume=1`, limpar ao finalizar.
- **Editado**: `src/pages/Estudar.tsx` — card "Retomar Simulado" no topo quando houver um em andamento.

