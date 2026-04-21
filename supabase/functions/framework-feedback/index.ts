import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)\n]|$)/g, "$1$2")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  "5w2h":
    "5W2H — plano de ação com 7 perguntas: What (O quê), Why (Por quê), Where (Onde), When (Quando), Who (Quem), How (Como) e How much (Quanto custa).",
  swot:
    "SWOT (FOFA) — análise estratégica com 4 quadrantes: Forças (internas), Fraquezas (internas), Oportunidades (externas) e Ameaças (externas), além de uma conclusão/plano.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const body = await req.json();
    const frameworkId = String(body?.frameworkId ?? "").trim();
    const topic = String(body?.topic ?? "").trim();
    const fields = body?.fields ?? {};

    if (!frameworkId || !FRAMEWORK_DESCRIPTIONS[frameworkId]) {
      return new Response(JSON.stringify({ error: "Modelo inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!topic || topic.length < 5) {
      return new Response(
        JSON.stringify({ error: "Informe um tema de exercício com pelo menos 5 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!fields || typeof fields !== "object") {
      return new Response(JSON.stringify({ error: "Campos inválidos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filledCount = Object.values(fields).filter(
      (v) => typeof v === "string" && v.trim().length > 0,
    ).length;
    if (filledCount === 0) {
      return new Response(
        JSON.stringify({ error: "Preencha pelo menos um campo antes de pedir feedback." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fieldsText = Object.entries(fields)
      .map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : ""}`)
      .join("\n");

    const systemPrompt = `Você é um professor especializado em segurança do trabalho e ferramentas de gestão. Avalia exercícios de alunos sobre o modelo: ${FRAMEWORK_DESCRIPTIONS[frameworkId]}.

REGRAS DE FORMATO (obrigatórias):
- Responda em português do Brasil.
- Use APENAS texto plano. Não use markdown, não use asteriscos, não use # de cabeçalho, não use crases, não use listas com - ou *.
- Use linhas em branco para separar seções e use letras maiúsculas no início de cada seção (ex.: "Avaliação geral:", "Pontos fortes:", "O que falta:", "Sugestões de melhoria:", "Nota: X/10").
- Seja didático, direto e construtivo.

ESTRUTURA DA RESPOSTA:
1. Avaliação geral do preenchimento em 2-3 linhas.
2. Para cada campo preenchido, comente brevemente o que está bom e o que pode melhorar.
3. Aponte campos vazios ou superficiais que merecem mais atenção.
4. Dê de 2 a 4 sugestões práticas de melhoria.
5. Termine com "Nota: X/10" (X de 0 a 10), avaliando a qualidade global do preenchimento.`;

    const userPrompt = `Tema do exercício: ${topic}

Preenchimento do aluno:
${fieldsText}

Faça a análise seguindo a estrutura definida.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Muitas solicitações no momento. Aguarde alguns instantes e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (resp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Tente novamente mais tarde." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar feedback. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const feedback = stripMarkdown(String(raw));

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("framework-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
