import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  HardHat,
  Search,
  Users,
  Stethoscope,
  Activity,
  Zap,
  Cog,
  FlaskConical,
  Armchair,
  MoveUp,
  FileText,
  Archive,
  Ban,
  Briefcase,
  Building2,
  Truck,
  Gauge,
  Flame,
  AlertTriangle,
  Construction,
  Bomb,
  Fuel,
  Sun,
  Pickaxe,
  FlameKindling,
  Bath,
  Trash2,
  Palette,
  IdCard,
  Scale,
  Anchor,
  Ship,
  Tractor,
  HeartPulse,
  Box,
  Wrench,
  Beef,
  Droplet,
  Recycle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NR_ORDER = [
  "NR-01","NR-06","NR-05","NR-04","NR-07","NR-09","NR-17","NR-35","NR-10","NR-12",
  "NR-15","NR-16","NR-33","NR-18","NR-23","NR-26","NR-08","NR-11","NR-13","NR-24",
  "NR-20","NR-32","NR-34","NR-31","NR-22","NR-29","NR-30","NR-36","NR-37","NR-38",
  "NR-14","NR-19","NR-21","NR-25","NR-28","NR-03",
  "NR-02","NR-27",
];

const MAIN_NRS = ["NR-01","NR-05","NR-06","NR-07","NR-09","NR-10","NR-12","NR-15","NR-17","NR-35"];
const REVOKED = new Set(["NR-02","NR-27"]);

const NR_ICONS: Record<string, LucideIcon> = {
  "NR-01": BookOpen,
  "NR-05": Users,
  "NR-06": HardHat,
  "NR-07": Stethoscope,
  "NR-09": Activity,
  "NR-10": Zap,
  "NR-12": Cog,
  "NR-15": FlaskConical,
  "NR-17": Armchair,
  "NR-35": MoveUp,
};
const getIcon = (id: string): LucideIcon => NR_ICONS[id] ?? FileText;

const NRS_RAW = [
  { id: "NR-01", title: "Disposições Gerais e Gerenciamento de Riscos Ocupacionais", body: "Estabelece diretrizes gerais de SST, define responsabilidades do empregador/empregado e institui o GRO (Gerenciamento de Riscos Ocupacionais) e o PGR (Programa de Gerenciamento de Riscos)." },
  { id: "NR-02", title: "Inspeção Prévia (revogada — referência histórica)", body: "Originalmente exigia inspeção prévia para início de funcionamento de estabelecimentos. Revogada em 2019; hoje a verificação ocorre via PGR e PCMSO." },
  { id: "NR-03", title: "Embargo e Interdição", body: "Define os procedimentos de embargo de obra e interdição de equipamento, setor ou estabelecimento que apresente grave e iminente risco aos trabalhadores." },
  { id: "NR-04", title: "SESMT — Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho", body: "Obriga empresas a manterem o SESMT conforme grau de risco e número de empregados; define profissionais (técnico de segurança, engenheiro, médico, enfermeiro, auxiliar)." },
  { id: "NR-05", title: "CIPA — Comissão Interna de Prevenção de Acidentes e de Assédio", body: "Comissão paritária (empregador e empregados) para prevenir acidentes e doenças. Atualização recente inclui prevenção ao assédio sexual e moral." },
  { id: "NR-06", title: "Equipamentos de Proteção Individual (EPI)", body: "Obriga o fornecimento gratuito de EPI adequado, com Certificado de Aprovação (CA). Trata de seleção, uso, guarda, conservação e treinamento." },
  { id: "NR-07", title: "PCMSO — Programa de Controle Médico de Saúde Ocupacional", body: "Exige exames médicos (admissional, periódico, retorno ao trabalho, mudança de função, demissional) e elaboração do PCMSO articulado ao PGR." },
  { id: "NR-08", title: "Edificações", body: "Estabelece requisitos técnicos para edificações: pé-direito mínimo, pisos, escadas, rampas, proteção contra intempéries e sinalização." },
  { id: "NR-09", title: "Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos", body: "Antigo PPRA — agora integra o PGR. Define limites de tolerância, monitoramento e medidas de controle (eliminação, substituição, EPC, EPI)." },
  { id: "NR-10", title: "Segurança em Instalações e Serviços em Eletricidade", body: "Define requisitos para projetos, execução, manutenção e operação de instalações elétricas. Exige curso básico (40h) e SEP (40h adicionais)." },
  { id: "NR-11", title: "Transporte, Movimentação, Armazenagem e Manuseio de Materiais", body: "Regulamenta o uso de equipamentos de movimentação (empilhadeiras, pontes rolantes, talhas) e o armazenamento seguro de materiais." },
  { id: "NR-12", title: "Segurança no Trabalho em Máquinas e Equipamentos", body: "Define proteções, dispositivos de segurança, distâncias mínimas, sinalização, manuais e capacitação para operação de máquinas." },
  { id: "NR-13", title: "Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento", body: "Estabelece classes (A/B/C), inspeções periódicas (interna/externa), prontuário, PMTA (Pressão Máxima de Trabalho Admissível) e operadores habilitados." },
  { id: "NR-14", title: "Fornos", body: "Define requisitos construtivos, operacionais e de segurança para fornos industriais, incluindo proteção contra calor radiante e gases." },
  { id: "NR-15", title: "Atividades e Operações Insalubres", body: "Define agentes insalubres (físicos, químicos, biológicos), limites de tolerância e adicionais de insalubridade (10%, 20% ou 40% sobre o mínimo)." },
  { id: "NR-16", title: "Atividades e Operações Perigosas", body: "Define atividades perigosas (inflamáveis, explosivos, energia elétrica, radiações ionizantes, segurança patrimonial e motociclistas). Garante adicional de periculosidade de 30% sobre o salário base, sem incidência de outros acréscimos." },
  { id: "NR-17", title: "Ergonomia", body: "Estabelece parâmetros para adaptar as condições de trabalho às características psicofisiológicas dos trabalhadores. Trata de levantamento e transporte de cargas, mobiliário, equipamentos, condições ambientais (iluminação, ruído, temperatura) e organização do trabalho. Exige Análise Ergonômica do Trabalho (AET) quando necessário." },
  { id: "NR-18", title: "Segurança e Saúde no Trabalho na Indústria da Construção", body: "Aplica-se a obras de construção, demolição, reparos e manutenção. Exige PGR específico (antigo PCMAT para obras com 20+ trabalhadores), áreas de vivência, proteções coletivas (guarda-corpo, plataformas), capacitações específicas e controle de riscos típicos do canteiro." },
  { id: "NR-19", title: "Explosivos", body: "Regula o depósito, manuseio, armazenamento e transporte de explosivos. Define classificação, distâncias de segurança, requisitos para paióis, sinalização, qualificação dos blasters e procedimentos para detonação." },
  { id: "NR-20", title: "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis", body: "Estabelece requisitos mínimos para a gestão da segurança e saúde no trabalho contra os fatores de risco de acidentes provenientes das atividades de extração, produção, armazenamento, transferência, manuseio e manipulação de inflamáveis e líquidos combustíveis. Classifica instalações (Classe I, II ou III), exige Plano de Prevenção e Proteção contra Incêndios, análise de riscos, projeto da instalação e capacitação específica (básico, intermediário, avançado I e II e especial) com cargas horárias e periodicidades definidas." },
  { id: "NR-21", title: "Trabalho a Céu Aberto", body: "Estabelece medidas de proteção para atividades realizadas a céu aberto, como abrigos contra intempéries (sol, chuva, frio), fornecimento de água potável e instalações sanitárias adequadas." },
  { id: "NR-22", title: "Segurança e Saúde Ocupacional na Mineração", body: "Aplica-se à mineração a céu aberto, subterrânea, garimpo e beneficiamento mineral. Exige PGR específico, ventilação em subsolo, controle de poeiras, plano de emergência, sinalização e capacitação para operações de risco." },
  { id: "NR-23", title: "Proteção Contra Incêndios", body: "Define exigências de proteção contra incêndios nos locais de trabalho: saídas de emergência, equipamentos de combate (extintores, hidrantes), sinalização, brigada de incêndio e treinamento dos trabalhadores para evacuação." },
  { id: "NR-24", title: "Condições Sanitárias e de Conforto nos Locais de Trabalho", body: "Estabelece requisitos mínimos para instalações sanitárias, vestiários, refeitórios, cozinhas, alojamentos e fornecimento de água potável, garantindo higiene e conforto aos trabalhadores." },
  { id: "NR-25", title: "Resíduos Industriais", body: "Determina medidas para destinação adequada dos resíduos gerados nos ambientes de trabalho (sólidos, líquidos e gasosos), evitando riscos à saúde e ao meio ambiente. Proíbe lançamento de resíduos perigosos sem tratamento." },
  { id: "NR-26", title: "Sinalização de Segurança", body: "Padroniza cores, símbolos e rótulos de sinalização de segurança nos locais de trabalho. Define rotulagem preventiva de produtos químicos conforme o GHS (Sistema Globalmente Harmonizado) e FISPQ." },
  { id: "NR-27", title: "Registro Profissional do TST (revogada — referência histórica)", body: "Originalmente regulava o registro do Técnico de Segurança do Trabalho junto ao MTE. Revogada em 2008 pela Lei 11.598; o registro hoje é feito diretamente pela Superintendência Regional do Trabalho." },
  { id: "NR-28", title: "Fiscalização e Penalidades", body: "Define os procedimentos de fiscalização do trabalho relativos à SST, gradação das infrações (leve, média, grave, gravíssima), valores das multas e prazos para recursos administrativos." },
  { id: "NR-29", title: "Segurança e Saúde no Trabalho Portuário", body: "Regula a proteção dos trabalhadores portuários (estiva, capatazia, conferência, conserto de carga, vigilância). Exige PGR portuário, capacitações específicas, controle de riscos em operações com cargas e equipamentos." },
  { id: "NR-30", title: "Segurança e Saúde no Trabalho Aquaviário", body: "Aplica-se aos trabalhadores de embarcações comerciais utilizadas no transporte de cargas e passageiros, pesca e plataformas. Trata de condições de habitabilidade, segurança da navegação, prevenção de incêndios e abandono de embarcação." },
  { id: "NR-31", title: "Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura", body: "Estabelece preceitos para organização e ambiente de trabalho rural. Trata de uso de agrotóxicos, máquinas e implementos agrícolas, transporte de trabalhadores, áreas de vivência no campo e capacitação específica." },
  { id: "NR-32", title: "Segurança e Saúde no Trabalho em Serviços de Saúde", body: "Protege trabalhadores de hospitais, clínicas, laboratórios e demais serviços de saúde. Trata de riscos biológicos, químicos (gases anestésicos, quimioterápicos), radiações ionizantes, perfurocortantes (PPRA específico) e vacinação obrigatória." },
  { id: "NR-33", title: "Segurança e Saúde nos Trabalhos em Espaços Confinados", body: "Aplica-se a qualquer área não projetada para ocupação humana contínua, com meios limitados de entrada/saída e ventilação insuficiente. Exige Permissão de Entrada e Trabalho (PET), supervisor de entrada, vigia, monitoramento atmosférico contínuo e capacitação (16h trabalhador/vigia, 40h supervisor) com reciclagem anual." },
  { id: "NR-34", title: "Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval", body: "Específica para estaleiros e atividades navais. Trata de trabalho a quente, em altura, espaços confinados, movimentação de cargas, jateamento e pintura, com exigências de PT, capacitações e controles específicos do setor." },
  { id: "NR-35", title: "Trabalho em Altura", body: "Aplica-se a toda atividade executada acima de 2,00 m do nível inferior onde haja risco de queda. Exige análise de risco (AR) e Permissão de Trabalho (PT) quando aplicável, sistemas de proteção contra quedas (coletivos preferencialmente, e individuais — cinturão tipo paraquedista com talabarte e trava-quedas), ancoragem confiável, capacitação inicial de 8 horas e reciclagem bienal (ou em caso de mudança de função, retorno após afastamento >90 dias, mudança nos procedimentos ou acidente grave). Inclui requisitos para resgate, planejamento, organização e execução do trabalho em altura." },
  { id: "NR-36", title: "Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados", body: "Aplica-se a frigoríficos e indústrias de processamento de carnes. Trata de mobiliário, equipamentos, organização do trabalho, pausas psicofisiológicas, levantamento de cargas e prevenção de LER/DORT em ambientes frios e úmidos." },
  { id: "NR-37", title: "Segurança e Saúde em Plataformas de Petróleo", body: "Regula condições mínimas de SST em plataformas fixas e flutuantes de petróleo e gás. Trata de habitabilidade, sistemas de salvatagem, plano de emergência, abandono de plataforma, helideck e capacitações específicas (HUET, CBSP)." },
  { id: "NR-38", title: "Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos", body: "Aplica-se a coleta, transporte, triagem, tratamento e destinação final de resíduos sólidos urbanos. Exige PGR específico, EPIs adequados (luvas, botas, uniformes refletivos), imunização, controle de riscos biológicos e ergonômicos e capacitação dos trabalhadores." },
];

const NRS_BY_ID = new Map(NRS_RAW.map((n) => [n.id, n]));
const ORDERED = NR_ORDER.map((id) => NRS_BY_ID.get(id)!).filter(Boolean);

export default function Normas() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string>("NR-01");

  const searching = search.trim().length > 0;
  const filtered = useMemo(
    () =>
      ORDERED.filter((n) =>
        `${n.id} ${n.title}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const mainList = MAIN_NRS.map((id) => NRS_BY_ID.get(id)!).filter(Boolean);
  const otherList = ORDERED.filter((n) => !MAIN_NRS.includes(n.id));

  const activeNR = NRS_BY_ID.get(active) ?? ORDERED[0];
  const ActiveIcon = getIcon(activeNR.id);

  const renderChip = (id: string, withIcon = false) => {
    const Icon = getIcon(id);
    const isActive = id === active;
    const isRevoked = REVOKED.has(id);
    return (
      <button
        key={id}
        onClick={() => setActive(id)}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-all",
          "hover:border-primary hover:text-primary",
          isActive
            ? "gradient-primary text-primary-foreground border-transparent shadow-md"
            : "bg-card text-foreground border-border",
          isRevoked && !isActive && "opacity-60",
        )}
      >
        {withIcon && <Icon className="w-5 h-5" />}
        <span>{id}</span>
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="text-primary" /> Normas Principais
        </h1>
        <p className="text-muted-foreground mt-1">
          Biblioteca completa: NR-01 a NR-38 (vigentes e revogadas com referência histórica).
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar NR…"
          className="pl-9"
        />
      </div>

      {searching ? (
        <div className="flex flex-wrap gap-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma NR encontrada.</p>
          ) : (
            filtered.map((n) => renderChip(n.id, MAIN_NRS.includes(n.id)))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Principais
            </p>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {mainList.map((n) => renderChip(n.id, true))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Demais NRs
            </p>
            <div className="flex flex-wrap gap-2">
              {otherList.map((n) => renderChip(n.id, false))}
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <ActiveIcon className="w-7 h-7 text-primary shrink-0" />
          <span>
            {activeNR.id} — {activeNR.title}
          </span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">{activeNR.body}</p>
        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-md bg-muted">
            <p className="font-semibold text-primary">Aplicação</p>
            <p className="text-muted-foreground">
              Aplica-se a empresas privadas, públicas e órgãos públicos da administração direta e indireta.
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted">
            <p className="font-semibold text-primary">Responsabilidade</p>
            <p className="text-muted-foreground">
              Cabe ao empregador cumprir e fazer cumprir; ao empregado, observar as orientações.
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted">
            <p className="font-semibold text-primary">Penalidades</p>
            <p className="text-muted-foreground">
              Multas administrativas conforme infração e responsabilização civil/criminal em casos graves.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
