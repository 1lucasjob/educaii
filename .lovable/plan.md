

## Plano: Adicionar todas as Normas Regulamentadoras

### Objetivo
Expandir a página `/app/normas` para incluir **todas as 38 NRs** vigentes no Brasil (NR-01 a NR-38), mantendo as que já existem e adicionando as faltantes com título oficial e descrição clara.

### Mudança única

**Editar `src/pages/Normas.tsx`** — expandir o array `NRS` para conter todas as normas:

- **Já existem** (manter como estão): NR-01, NR-02, NR-03, NR-04, NR-05, NR-06, NR-07, NR-08, NR-09, NR-10, NR-11, NR-12, NR-13, NR-14, NR-15, NR-20, NR-35.
- **Adicionar**:
  - NR-16 — Atividades e Operações Perigosas (adicional 30%)
  - NR-17 — Ergonomia
  - NR-18 — Segurança e Saúde no Trabalho na Indústria da Construção
  - NR-19 — Explosivos
  - NR-21 — Trabalho a Céu Aberto
  - NR-22 — Segurança e Saúde Ocupacional na Mineração
  - NR-23 — Proteção Contra Incêndios
  - NR-24 — Condições Sanitárias e de Conforto nos Locais de Trabalho
  - NR-25 — Resíduos Industriais
  - NR-26 — Sinalização de Segurança
  - NR-27 — Registro Profissional do TST (revogada — referência histórica)
  - NR-28 — Fiscalização e Penalidades
  - NR-29 — Trabalho Portuário
  - NR-30 — Trabalho Aquaviário
  - NR-31 — Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura
  - NR-32 — Segurança e Saúde no Trabalho em Serviços de Saúde
  - NR-33 — Segurança e Saúde nos Trabalhos em Espaços Confinados
  - NR-34 — Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval
  - NR-36 — Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados
  - NR-37 — Segurança e Saúde em Plataformas de Petróleo
  - NR-38 — Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos

Cada item segue o formato existente `{ id, title, body }` com descrição de 2-4 frases cobrindo escopo, principais exigências e aplicação.

### Sobre o acesso ADMIN

O acesso de admin já é isento de qualquer gating de plano em todo o app (verificado em `AuthContext`, `AppLayout`, `Simulado`, `ChatProfessor`, etc.). Nenhuma alteração necessária — admins já visualizam tudo sem restrição.

### Arquivos
- **Editar**: `src/pages/Normas.tsx` (apenas o array `NRS`; UI/busca/tabs continuam iguais e já são responsivas).

