

## Plano: Empilhar EDUCA.I e Academy

### Sidebar (`src/layouts/AppLayout.tsx`)
- Reestruturar o bloco do header da sidebar (linhas 61-69):
  - `EDUCA.I` em cima, grande e em negrito (`font-bold leading-tight`).
  - `Academy` em uma nova linha logo abaixo, em texto pequeno e discreto (`text-xs text-muted-foreground leading-tight`).
  - O `PlanBadge` sai de junto do "Academy" e passa para uma terceira linha (mantendo a tag visível sem poluir o nome).

### Login (`src/pages/Login.tsx`)
- Substituir o `<h1>EDUCA.I Academy</h1>` (linha 50) por dois elementos centralizados:
  - `EDUCA.I` em `<h1>` grande e negrito.
  - `Academy` logo abaixo em `<p>` menor e em `text-muted-foreground`.

### Header superior (`src/layouts/AppLayout.tsx` linha 161)
- Manter o texto "EDUCA.I Academy" como está (é uma linha discreta no topbar, não faz sentido empilhar ali).

### Sem mudanças
- `index.html`, `Termos.tsx`, `TermsGate.tsx`, `Planos.tsx` — referências textuais continuam como "EDUCA.I Academy" em frases corridas.

### Arquivos
- **Editar**: `src/layouts/AppLayout.tsx`, `src/pages/Login.tsx`.

