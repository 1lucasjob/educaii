

## Plano: Adicionar campo de título do tema de estudo

### Objetivo
Separar o **título curto** do tema (ex: "NR-35 Trabalho em Altura") do **descritivo longo** (mínimo 1000 caracteres) na página `/app/estudar`. Hoje o textarea acumula as duas funções, o que dificulta identificar o tema atual e exibe textos truncados feios em "Tema atual: …".

### Mudanças em `src/pages/Estudar.tsx`

1. **Novo estado `title`** (string), além do já existente `topic` (descrição longa).
2. **Novo `<Input>` "Título do tema"** acima do `<Textarea>`:
   - Label: "Título do tema de estudo"
   - Placeholder: "Ex: NR-35 — Trabalho em Altura"
   - Obrigatório, mínimo 5 e máximo 80 caracteres
   - Desabilitado quando `!unlocked || loadingSummary`
3. **Textarea atual** vira "Descrição detalhada do tema" (mantém regra dos 1000 caracteres).
4. **Validação no `generate()`**:
   - Bloqueia se título vazio/curto com toast explicativo
   - Envia `{ title, topic }` para a edge function `generate-summary` (campo extra opcional, não quebra)
   - Persiste `current_topic = title` no profile (curto e legível) e mantém a descrição completa em `study_sessions.topic` para histórico
5. **Exibição "Tema atual"**: passa a usar o título curto, sem truncamento feio.
6. **Reset**: ao gerar novo resumo com sucesso, limpa título e descrição.

### Mudanças em `supabase/functions/generate-summary/index.ts`

- Aceitar `title` opcional no body. Se presente, incluir no prompt do usuário como cabeçalho ("Título: …\n\nDescrição: …") para guiar melhor o modelo. Mantém compatibilidade com chamadas antigas que mandam só `topic`.

### Sem mudanças de banco

- Reutiliza `profiles.current_topic` (já existe) para guardar o título curto.
- `study_sessions.topic` continua armazenando a descrição longa (histórico/auditoria).
- Sem migrações.

### Arquivos a editar

- `src/pages/Estudar.tsx` — novo Input + lógica de validação/persistência
- `supabase/functions/generate-summary/index.ts` — aceitar campo `title` opcional no prompt

