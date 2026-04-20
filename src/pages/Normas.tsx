import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, HardHat, Search } from "lucide-react";

const NRS = [
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
  { id: "NR-20", title: "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis", body: "Estabelece requisitos mínimos para a gestão da segurança e saúde no trabalho contra os fatores de risco de acidentes provenientes das atividades de extração, produção, armazenamento, transferência, manuseio e manipulação de inflamáveis e líquidos combustíveis. Classifica instalações (Classe I, II ou III), exige Plano de Prevenção e Proteção contra Incêndios, análise de riscos, projeto da instalação e capacitação específica (básico, intermediário, avançado I e II e especial) com cargas horárias e periodicidades definidas." },
  { id: "NR-35", title: "Trabalho em Altura", body: "Aplica-se a toda atividade executada acima de 2,00 m do nível inferior onde haja risco de queda. Exige análise de risco (AR) e Permissão de Trabalho (PT) quando aplicável, sistemas de proteção contra quedas (coletivos preferencialmente, e individuais — cinturão tipo paraquedista com talabarte e trava-quedas), ancoragem confiável, capacitação inicial de 8 horas e reciclagem bienal (ou em caso de mudança de função, retorno após afastamento >90 dias, mudança nos procedimentos ou acidente grave). Inclui requisitos para resgate, planejamento, organização e execução do trabalho em altura." },
];

export default function Normas() {
  const [search, setSearch] = useState("");
  const filtered = NRS.filter((n) => `${n.id} ${n.title}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="text-primary" /> Normas Principais</h1>
        <p className="text-muted-foreground mt-1">Biblioteca rápida das NR-01 a NR-15, NR-20 e NR-35.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar NR…" className="pl-9" />
      </div>

      <Tabs defaultValue={filtered[0]?.id ?? "NR-01"} orientation="vertical" className="flex flex-col md:flex-row gap-4">
        <TabsList className="md:flex-col h-auto bg-card p-2 md:w-56 flex-wrap md:flex-nowrap overflow-x-auto md:overflow-visible">
          {filtered.map((n) => (
            <TabsTrigger key={n.id} value={n.id} className="md:w-full md:justify-start data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <HardHat className="w-3.5 h-3.5 mr-2 shrink-0" />
              {n.id}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1">
          {filtered.map((n) => (
            <TabsContent key={n.id} value={n.id} className="mt-0">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-2">{n.id} — {n.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{n.body}</p>
                <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-md bg-muted">
                    <p className="font-semibold text-primary">Aplicação</p>
                    <p className="text-muted-foreground">Aplica-se a empresas privadas, públicas e órgãos públicos da administração direta e indireta.</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <p className="font-semibold text-primary">Responsabilidade</p>
                    <p className="text-muted-foreground">Cabe ao empregador cumprir e fazer cumprir; ao empregado, observar as orientações.</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <p className="font-semibold text-primary">Penalidades</p>
                    <p className="text-muted-foreground">Multas administrativas conforme infração e responsabilização civil/criminal em casos graves.</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
