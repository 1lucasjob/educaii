

## Plano: Ícones temáticos para todas as NRs

### Objetivo
Atribuir um ícone `lucide-react` adequado a cada uma das 36 NRs, exibindo-o tanto nos chips da seção "Demais NRs" quanto no cabeçalho do painel aberto.

### Mudanças (`src/pages/Normas.tsx`)

**1. Expandir o mapa `NR_ICONS`** com todas as NRs além das 10 principais já mapeadas:

| NR | Ícone | Tema |
|---|---|---|
| NR-02 | `Archive` | Inspeção prévia (revogada) |
| NR-03 | `Ban` | Embargo e interdição |
| NR-04 | `Briefcase` | SESMT |
| NR-08 | `Building2` | Edificações |
| NR-11 | `Truck` | Transporte/movimentação |
| NR-13 | `Gauge` | Caldeiras/vasos de pressão |
| NR-14 | `Flame` | Fornos |
| NR-16 | `AlertTriangle` | Periculosidade |
| NR-18 | `Construction` | Construção civil |
| NR-19 | `Bomb` | Explosivos |
| NR-20 | `Fuel` | Inflamáveis/combustíveis |
| NR-21 | `Sun` | Trabalho a céu aberto |
| NR-22 | `Pickaxe` | Mineração |
| NR-23 | `FlameKindling` | Proteção contra incêndios |
| NR-24 | `Bath` | Sanitários/conforto |
| NR-25 | `Trash2` | Resíduos industriais |
| NR-26 | `Palette` | Sinalização (cores) |
| NR-27 | `IdCard` | Registro TST (revogada) |
| NR-28 | `Scale` | Fiscalização/penalidades |
| NR-29 | `Anchor` | Trabalho portuário |
| NR-30 | `Ship` | Aquaviário |
| NR-31 | `Tractor` | Agricultura |
| NR-32 | `HeartPulse` | Serviços de saúde |
| NR-33 | `Box` | Espaços confinados |
| NR-34 | `Wrench` | Indústria naval |
| NR-36 | `Beef` | Frigoríficos |
| NR-37 | `Droplet` | Plataformas de petróleo |
| NR-38 | `Recycle` | Limpeza urbana/resíduos |

**2. Atualizar imports** do `lucide-react` para incluir todos os novos ícones.

**3. Renderizar o ícone também nos chips de "Demais NRs"** — `renderChip(id, true)` para ambas as listas (principais e demais), garantindo consistência visual. Os chips das demais ficam com o mesmo estilo compacto (ícone pequeno acima do código).

**4. Ajuste de grid das "Demais NRs"** para acomodar o ícone:
- `grid grid-cols-5 sm:grid-cols-8 md:grid-cols-13 gap-2` (ou `flex flex-wrap` mantendo `min-w` consistente). Vai usar o mesmo grid layout dos principais para uniformidade.

### Sem mudanças
- `NRS_RAW`, lógica de busca, painel de conteúdo e mini-cards permanecem iguais.
- Função `getIcon` já tem fallback `FileText` — continua válido caso falte algum mapeamento.

### Arquivos
- **Editar**: `src/pages/Normas.tsx`.

