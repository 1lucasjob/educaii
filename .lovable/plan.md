

## Plano: Reorganizar Normas em layout horizontal compacto + ícones temáticos

### Objetivo
- Remover a barra lateral com rolagem.
- Destacar 10 NRs principais (NR-01, 05, 06, 07, 09, 10, 12, 15, 17, 35) em uma faixa horizontal de acesso direto.
- Demais NRs ficam acessíveis num segundo nível, sem competir visualmente.
- Cada NR aberta exibe um ícone temático ao lado do título.

### 1. Nova estrutura visual (`src/pages/Normas.tsx`)

**Topo — busca** (mantida).

**Faixa horizontal de NRs principais** (substitui a `TabsList` vertical):
- Grid responsivo: `grid-cols-5` no mobile (2 linhas de 5) e `md:grid-cols-10` no desktop (1 linha) — sem scroll.
- Cada item é um botão-cartão pequeno com:
  - Ícone temático (topo)
  - Código da NR (ex.: "NR-35")
  - Sem título completo aqui (mantém compacto)
- Estado ativo: gradiente primário + texto branco.

**Demais NRs** (não-principais):
- Linha abaixo, em `flex flex-wrap gap-2` com botões pequenos tipo "chip" mostrando só o código (ex.: `NR-08`, `NR-11`...). Inclui as revogadas no fim com estilo esmaecido (`opacity-60`).
- Sem necessidade de scroll na maioria das telas; quebra naturalmente em linhas.

**Painel de conteúdo** (abaixo das duas faixas):
- Card único que renderiza a NR selecionada (estado controlado via `useState` em vez de `Tabs` do Radix, para simplificar o layout horizontal duplo).
- Mostra: ícone grande temático + `NR-XX — Título` + corpo + os 3 mini-cards (Aplicação / Responsabilidade / Penalidades) já existentes.

### 2. Ícones temáticos por NR

Mapa `NR_ICONS: Record<string, LucideIcon>` usando `lucide-react`:

| NR | Ícone | Razão |
|---|---|---|
| NR-01 | `BookOpen` | Disposições gerais / GRO |
| NR-05 | `Users` | CIPA (comissão) |
| NR-06 | `HardHat` | EPI |
| NR-07 | `Stethoscope` | PCMSO (saúde) |
| NR-09 | `Activity` | Agentes físicos/químicos |
| NR-10 | `Zap` | Eletricidade |
| NR-12 | `Cog` | Máquinas e equipamentos |
| NR-15 | `FlaskConical` | Insalubridade |
| NR-17 | `Armchair` | Ergonomia |
| NR-35 | `MoveUp` | Trabalho em altura |
| Outras | `FileText` (default) | — |

Uso: ícone aparece (a) no botão da faixa principal (tamanho ~20px) e (b) ao lado do título no painel aberto (tamanho ~28px, cor primária).

### 3. Constantes

- `MAIN_NRS = ["NR-01","NR-05","NR-06","NR-07","NR-09","NR-10","NR-12","NR-15","NR-17","NR-35"]`
- A lista existente `NR_ORDER` é reaproveitada para gerar o conjunto "outras" (filtrando as principais).
- Estado: `const [active, setActive] = useState<string>("NR-01")`.
- Filtro de busca: quando há texto, mostra todas as correspondências em uma única faixa horizontal e oculta a divisão principais/outras.

### 4. Sem mudanças
- `NRS_RAW` permanece igual (mesmo conteúdo).
- Nenhuma outra página é afetada.
- Sem mudanças em backend/banco.

### Arquivos
- **Editar**: `src/pages/Normas.tsx` (substituir `Tabs` por estado próprio + grid horizontal + mapa de ícones).

