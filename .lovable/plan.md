## Plano: corrigir layout mobile em "Meu Progresso" e "Gestão de Cadastros"

### Mudanças

**1. `src/layouts/AppLayout.tsx`**
- No `<main>`, adicionar `min-w-0 overflow-x-hidden` para impedir que qualquer filho force scroll horizontal global no mobile.

**2. `src/pages/Progresso.tsx`**
- Padronizar container para `max-w-4xl` (igualando às demais páginas que estão OK).
- Adicionar `min-w-0` nos wrappers de grid/flex que contêm os gráficos.
- Envolver cada `ChartContainer` (Recharts) em `div className="w-full min-w-0 overflow-hidden"` para que o SVG respeite a largura do pai no mobile (causa principal do "zoom").
- Garantir que cards de KPIs usem grid responsivo (`grid-cols-2 md:grid-cols-4`) sem larguras fixas.

**3. `src/pages/Admin.tsx`**
- Padronizar container para `max-w-4xl` com `min-w-0`.
- Tabelas largas (alunos, logs): envolver `<Table>` em `div className="w-full overflow-x-auto"` para que o scroll fique apenas na tabela, não na página.
- Revisar grids de cards (slots, alunos) para colunas responsivas (`grid-cols-1 md:grid-cols-2`) sem `min-w` fixo.

### Não muda
- Lógica de dados, queries Supabase, ações administrativas, cálculo de progresso/conquistas.
- Outras páginas que já estão OK no mobile.

### Verificação
Conferir em viewport ~390px que não há scroll horizontal global nas duas páginas e que gráficos/tabelas se ajustam corretamente.