
## Objetivo

Modificar a aba **Modelos de Estudo** para que os cards **5W2H** e **SWOT** não tenham mais a opção **“Usar no Estudar”**. No lugar, cada modelo terá uma área **“Gerar Simulado”**, com escolha entre:

- **Fácil**
- **Difícil**
- **Expert**

Esses simulados serão gerados diretamente a partir do modelo escolhido, com **mínimo de 10 questões**.

## Regras de acesso

### Simulado Fácil dos Modelos
Liberado quando:

- usuário é admin; ou
- plano **FREE** dentro dos primeiros **30 dias**; ou
- plano **60 DAYS, 90 DAYS, 180 DAYS ou 1 ANO/PREMIUM**; ou
- admin liberou o recurso por **30 dias** para aquele cadastro.

### Simulado Difícil e Expert dos Modelos
Liberados quando:

- usuário é admin; ou
- plano **90 DAYS, 180 DAYS ou 1 ANO/PREMIUM**; ou
- admin liberou o recurso por **30 dias** para aquele cadastro.

### Bloqueio
Quando o aluno não tiver acesso:

- o botão ficará bloqueado/desabilitado;
- aparecerá texto explicando o plano necessário;
- haverá link para a página de planos.

## Mudanças na interface

### `src/pages/Modelos.tsx`

Vou trocar a aba:

- de **“Usar no Estudar”**
- para **“Gerar Simulado”**

Dentro dela haverá:

1. Card explicando que o simulado será baseado no modelo escolhido.
2. Seletor de dificuldade: **Fácil / Difícil / Expert**.
3. Botão principal: **“Gerar Simulado 5W2H”** ou **“Gerar Simulado SWOT”**.
4. Mensagem de acesso conforme o plano do usuário.
5. Redirecionamento para `/app/simulado` com parâmetros indicando:
   - modelo escolhido;
   - dificuldade;
   - tema do simulado.

Exemplo técnico de rota:

```text
/app/simulado?topic=Simulado sobre o modelo 5W2H aplicado à Segurança do Trabalho&difficulty=easy&framework=5w2h
```

## Mudanças no Simulado

### `src/pages/Simulado.tsx`

Vou ajustar a lógica para reconhecer quando o simulado veio da aba **Modelos de Estudo** usando o parâmetro `framework`.

Quando `framework=5w2h` ou `framework=swot`:

1. Aplicar as novas regras específicas de acesso dos modelos.
2. Bloquear fácil se:
   - FREE passou dos 30 dias;
   - plano menor que 60 DAYS;
   - sem liberação admin ativa.
3. Bloquear difícil/expert se:
   - plano menor que 90 DAYS;
   - sem liberação admin ativa.
4. Atualizar mensagens de bloqueio para explicar:
   - Fácil: exige FREE ativo, 60 DAYS ou liberação admin.
   - Difícil/Expert: exige 90 DAYS ou superior, ou liberação admin.

Os simulados normais do Módulo de Estudos não serão misturados com esse novo fluxo, a menos que já usem a mesma página de execução.

## Mínimo de 10 questões

### `supabase/functions/generate-quiz/index.ts`

Vou alterar o prompt da geração de simulados para exigir:

- **mínimo de 10 questões**;
- preferencialmente entre **10 e 12 questões**;
- pontuação total continuando em **100 pontos**.

Também adicionarei uma validação após a resposta da IA:

- se vierem menos de 10 questões, a função retornará erro amigável pedindo nova tentativa, ou tentará reforçar a regra no prompt de geração.

## Liberação admin por 30 dias

Será necessário criar uma liberação própria para os simulados dos modelos, porque ela vale para **qualquer dificuldade dos modelos**, não apenas para Expert.

### Banco

Adicionar coluna em `profiles`:

```text
model_quiz_unlocked_until timestamptz
```

Criar função administrativa:

```text
admin_unlock_model_quiz(_user_id uuid)
```

Ela fará:

- validar se quem chamou é admin;
- liberar o recurso por 30 dias;
- registrar a ação no histórico `study_unlock_logs`.

## Painel Admin

### `src/pages/Admin.tsx`

Vou adicionar na Gestão de Cadastros:

- status: **Simulados dos Modelos**
- botão: **“Liberar Modelos 30d”**
- se já estiver ativo, mostrar data de expiração.

Essa liberação permitirá que qualquer cadastro use os simulados dos modelos por 30 dias, mesmo que o plano atual não cumpra o requisito.

## Auth/Profile

### `src/contexts/AuthContext.tsx`

Vou incluir o novo campo no perfil:

```text
model_quiz_unlocked_until
```

Assim a interface poderá saber se o usuário tem liberação admin ativa.

## Helpers de acesso

### `src/lib/freeTrial.ts`

Vou adicionar funções auxiliares para centralizar a regra:

```text
modelQuizEasyActive(...)
modelQuizAdvancedActive(...)
```

Regras:

- Fácil:
  - admin;
  - FREE nos primeiros 30 dias;
  - plano 60/90/180/premium;
  - liberação admin ativa.

- Difícil/Expert:
  - admin;
  - plano 90/180/premium;
  - liberação admin ativa.

## Limpeza do fluxo antigo

Como a opção **“Usar no Estudar”** será removida dos Modelos:

- o botão antigo será excluído;
- o texto “aplicar no Módulo de Estudos” será removido;
- a aba passará a focar apenas em simulados;
- o vínculo com a área de estudo continua por usar o mesmo motor de simulado e a mesma página `/app/simulado`.

## Arquivos afetados

### Editados

- `src/pages/Modelos.tsx`
- `src/pages/Simulado.tsx`
- `src/pages/Admin.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/freeTrial.ts`
- `supabase/functions/generate-quiz/index.ts`

### Banco

Nova migração para:

- adicionar `profiles.model_quiz_unlocked_until`;
- criar `admin_unlock_model_quiz`;
- registrar liberação no histórico administrativo.

