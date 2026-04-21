import { ListChecks, LayoutGrid, type LucideIcon } from "lucide-react";

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
  },
];
