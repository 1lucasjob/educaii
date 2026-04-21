import { ListChecks, LayoutGrid, type LucideIcon } from "lucide-react";

export type FrameworkField = {
  key: string;
  label: string;
  placeholder: string;
};

export type Framework = {
  id: "5w2h" | "swot";
  label: string;
  short: string;
  description: string;
  /** HSL components (e.g. "210 90% 55%") for use in `hsl(...)` */
  color: string;
  icon: LucideIcon;
  titleSuggestion: string;
  template: string;
  explanation: string;
  example: string;
  fields: FrameworkField[];
};

const TEMPLATE_5W2H = `Resumo no formato 5W2H

What (O quê):
Descreva claramente o que será feito ou estudado.

Why (Por quê):
Explique a razão / justificativa / objetivo.

Where (Onde):
Local, setor, ambiente em que ocorre.

When (Quando):
Prazos, datas, frequência ou cronograma.

Who (Quem):
Responsáveis e envolvidos.

How (Como):
Método, etapas e procedimentos para executar.

How much (Quanto custa):
Custos, recursos, materiais ou esforço necessário.
`;

const TEMPLATE_SWOT = `Resumo no formato SWOT (FOFA)

Forças (Strengths):
Pontos fortes internos — o que é vantagem própria.

Fraquezas (Weaknesses):
Pontos fracos internos — o que precisa melhorar.

Oportunidades (Opportunities):
Fatores externos favoráveis que podem ser aproveitados.

Ameaças (Threats):
Fatores externos desfavoráveis que precisam ser monitorados.

Conclusão / plano:
Resuma como potencializar forças, mitigar fraquezas, aproveitar oportunidades e enfrentar ameaças.
`;

const EXPLANATION_5W2H = `O 5W2H é uma ferramenta de gestão criada para transformar ideias em planos de ação claros e executáveis. O nome vem das sete perguntas-chave em inglês: What, Why, Where, When, Who, How e How much. Originalmente popularizado pela indústria automotiva japonesa, hoje é amplamente usado em segurança do trabalho, qualidade, projetos e planejamento estratégico.

Sua principal vantagem é a simplicidade: ao responder essas sete perguntas, você elimina ambiguidades sobre o que precisa ser feito, por quem, quando, como e a que custo. Isso reduz retrabalho, melhora a comunicação entre equipes e facilita o acompanhamento das ações.

Use o 5W2H quando precisar implantar uma nova rotina, montar um plano de ação para uma não-conformidade, organizar um treinamento, planejar uma inspeção ou estruturar qualquer atividade que envolva múltiplos responsáveis e prazos.`;

const EXAMPLE_5W2H = `Exemplo prático — Implantação do uso obrigatório de capacete na obra

What: Tornar obrigatório o uso de capacete de segurança classe B em toda a área de canteiro.
Why: Reduzir o risco de lesões cranianas por queda de objetos e atender a NR-6 e NR-18.
Where: Canteiro de obras da Filial Norte, incluindo áreas administrativas externas.
When: Início em 01/06, com prazo de 15 dias para adaptação total dos colaboradores.
Who: Técnico de Segurança (responsável), encarregados de obra (fiscalização), todos os trabalhadores (cumprimento).
How: Treinamento de 1h sobre o uso correto, distribuição dos EPIs, sinalização nas entradas, auditoria diária por 30 dias.
How much: R$ 4.500 (compra de 60 capacetes + treinamento).`;

const EXPLANATION_SWOT = `A análise SWOT — também chamada de FOFA em português (Forças, Oportunidades, Fraquezas, Ameaças) — é uma ferramenta de diagnóstico estratégico criada na década de 1960 na Universidade de Stanford. Ela organiza a avaliação de uma situação em quatro quadrantes: dois internos (Forças e Fraquezas) e dois externos (Oportunidades e Ameaças).

Seu valor está em forçar uma visão equilibrada: nem só pontos fortes, nem só problemas. Ao mapear esses quatro aspectos, você consegue traçar estratégias que potencializam o que já dá certo, corrigem vulnerabilidades, aproveitam tendências favoráveis e se antecipam a riscos.

Aplique a SWOT em diagnósticos de SST de uma unidade, avaliação de um programa de prevenção, análise de viabilidade de um novo procedimento, planejamento anual de segurança ou sempre que precisar tomar uma decisão estruturada considerando contexto interno e externo.`;

const EXAMPLE_SWOT = `Exemplo prático — Programa de Prevenção de Acidentes da empresa Alfa

Forças: SESMT bem estruturado, CIPA ativa, baixo turnover, gestão comprometida com SST.
Fraquezas: Alta rotatividade de terceirizados, falta de padronização nos treinamentos de integração, registros de ocorrências em planilhas dispersas.
Oportunidades: Nova linha de crédito do BNDES para equipamentos de segurança, parceria com SENAI para capacitação gratuita, mercado valorizando empresas com selo de segurança.
Ameaças: Aumento da fiscalização do MTE na região, escassez de mão de obra qualificada, novos riscos da automação introduzida em 2025.
Conclusão: Aproveitar o crédito BNDES (oportunidade) para corrigir a dispersão de registros (fraqueza), usando a força do SESMT para implantar um sistema digital antes da próxima fiscalização (ameaça).`;

const FIELDS_5W2H: FrameworkField[] = [
  { key: "what", label: "What — O quê", placeholder: "O que exatamente será feito ou estudado?" },
  { key: "why", label: "Why — Por quê", placeholder: "Qual a razão, justificativa ou objetivo?" },
  { key: "where", label: "Where — Onde", placeholder: "Local, setor ou ambiente onde ocorre." },
  { key: "when", label: "When — Quando", placeholder: "Prazos, datas, frequência ou cronograma." },
  { key: "who", label: "Who — Quem", placeholder: "Responsáveis e pessoas envolvidas." },
  { key: "how", label: "How — Como", placeholder: "Método, etapas e procedimentos." },
  { key: "howmuch", label: "How much — Quanto custa", placeholder: "Custos, recursos ou esforço necessário." },
];

const FIELDS_SWOT: FrameworkField[] = [
  { key: "strengths", label: "Forças (internas)", placeholder: "Pontos fortes próprios — o que é vantagem." },
  { key: "weaknesses", label: "Fraquezas (internas)", placeholder: "Pontos fracos próprios — o que precisa melhorar." },
  { key: "opportunities", label: "Oportunidades (externas)", placeholder: "Fatores externos favoráveis a aproveitar." },
  { key: "threats", label: "Ameaças (externas)", placeholder: "Fatores externos desfavoráveis a monitorar." },
  { key: "conclusion", label: "Conclusão / plano", placeholder: "Como combinar forças e oportunidades para mitigar fraquezas e ameaças." },
];

export const FRAMEWORKS: Framework[] = [
  {
    id: "5w2h",
    label: "5W2H",
    short: "5W2H",
    description: "Plano de ação detalhado em 7 perguntas.",
    color: "210 90% 55%",
    icon: ListChecks,
    titleSuggestion: "Plano de ação 5W2H",
    template: TEMPLATE_5W2H,
    explanation: EXPLANATION_5W2H,
    example: EXAMPLE_5W2H,
    fields: FIELDS_5W2H,
  },
  {
    id: "swot",
    label: "SWOT (FOFA)",
    short: "SWOT",
    description: "Forças, fraquezas, oportunidades e ameaças.",
    color: "280 75% 60%",
    icon: LayoutGrid,
    titleSuggestion: "Análise SWOT",
    template: TEMPLATE_SWOT,
    explanation: EXPLANATION_SWOT,
    example: EXAMPLE_SWOT,
    fields: FIELDS_SWOT,
  },
];

export function getFrameworkById(id: string | null | undefined): Framework | undefined {
  if (!id) return undefined;
  return FRAMEWORKS.find((f) => f.id === id);
}
