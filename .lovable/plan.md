

## Objetivo

Quando o aluno clicar em **"Usar [Modelo] no Estudar"** dentro da aba **Modelos de Estudo**, a página `/app/estudar` deve **ignorar todos os bloqueios de plano** (FREE expirado, sem chat, sem highlights etc.) **apenas para essa sessão de uso do modelo**. Os bloqueios continuam valendo normalmente para o uso direto do Estudar.

---

## Como vai funcionar

1. Em `src/pages/Modelos.tsx`, o botão **"Usar [X] no Estudar"** já navega para `/app/estudar?framework=ID`. Vamos manter esse comportamento (o próprio query param `framework` é o "passe livre").

2. Em `src/pages/Estudar.tsx`:
   - Detectar se a entrada veio de um modelo (`searchParams.get("framework")` presente **OU** uma flag de sessão `estudar:from-framework` setada).
   - Quando vier de modelo: definir `fromFramework = true` em estado local **e** gravar `sessionStorage.setItem("estudar:from-framework", "1")` para manter o bypass mesmo após o `setSearchParams` limpar a URL e durante a geração.
   - Em **todos os checks de bloqueio** da página (cadeado de FREE expirado, gating de resumos/highlights, banners de upgrade que impedem clicar em "Gerar"), adicionar a condição: `if (fromFramework) ignorar bloqueio`.
   - A flag é limpa quando: o usuário troca o tema manualmente para algo que não corresponde mais ao template do framework **OU** ao desmontar a página **OU** ao clicar num botão "Sair do modo modelo" (pequeno aviso no topo: "Você está usando o modelo 5W2H — bloqueios temporariamente liberados").

3. **Importante — apenas a UI da página Estudar é liberada**. As edge functions (`generate-summary`, `extract-highlights`) continuam com sua própria validação de plano no servidor. Para que o bypass funcione de ponta a ponta, vamos:
   - Passar uma flag `from_framework: true` no payload das chamadas a `generate-summary` (e `extract-highlights` se aplicável) **quando** `fromFramework === true`.
   - Atualizar essas edge functions para aceitar `from_framework` e, quando `true`, pular a checagem de plano (mantendo apenas autenticação JWT, rate limiting natural e o conteúdo restrito ao template do framework — validamos no servidor que o `topic` começa com um marcador conhecido de framework para evitar abuso).

4. **Marcador de validação no servidor**: cada template em `studyFrameworks.ts` já começa com um cabeçalho único (ex.: `"# Modelo 5W2H\n"`). A edge function checa se o `topic` recebido começa com um desses cabeçalhos conhecidos antes de aceitar `from_framework: true`. Caso contrário, ignora a flag e aplica gating normal.

---

## Arquivos afetados

### Editados
- `src/pages/Estudar.tsx` — detectar origem do framework (query param + sessionStorage), bypass dos bloqueios da UI, banner "modo modelo ativo", passar `from_framework` no payload das chamadas IA.
- `src/lib/studyFrameworks.ts` — exportar lista de cabeçalhos/marcadores únicos por framework para validação servidor (`FRAMEWORK_TEMPLATE_MARKERS`).
- `supabase/functions/generate-summary/index.ts` — aceitar `from_framework`; validar que o `topic` inicia com um marcador conhecido; quando válido, pular checagem de plano.
- `supabase/functions/extract-highlights/index.ts` — mesma lógica de bypass condicional (caso o aluno queira extrair trechos do resumo gerado pelo modelo).

### Novos
- Nenhum.

### Banco
- Sem migrações.

---

## Acesso

- Bypass aplica-se a **qualquer plano** (incluindo FREE expirado), mas **somente** quando a entrada vier de um modelo da página Modelos de Estudo (validado por marcador no template).
- Admin continua com acesso total como hoje.
- Nenhum outro fluxo do Estudar é afetado.

