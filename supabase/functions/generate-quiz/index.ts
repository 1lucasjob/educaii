// Generate a quiz on a Workplace Safety topic via tool calling for structured output
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um EXAMINADOR SÊNIOR de concursos públicos e provas técnicas de SEGURANÇA DO TRABALHO (Engenharia/Técnico). Crie questões de múltipla escolha em português brasileiro com rigor técnico de banca examinadora (FCC, CESPE/Cebraspe, FGV).

REGRAS OBRIGATÓRIAS:
- 4 alternativas (A, B, C, D), apenas UMA correta.
- As 3 alternativas incorretas devem ser DISTRATORES PLAUSÍVEIS — erros sutis, troca de números/itens de NR, inversões conceituais, exceções mal aplicadas. NUNCA respostas obviamente erradas.
- Cite NRs com itens/subitens reais (ex: "NR-35, item 35.4.5") quando aplicável.
- Pontos somam exatamente 100, distribuídos de forma equilibrada.
- Justificativa técnica curta citando a base normativa.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, difficulty, sourceText, framework } = await req.json();
    if (!topic || !["easy", "hard", "expert"].includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const range =
      difficulty === "easy"
        ? "entre 10 e 12 questões (mínimo obrigatório: 10) — conceituais e de aplicação direta, baseadas no texto base do estudo"
        : difficulty === "hard"
          ? "entre 10 e 12 questões de NÍVEL EXAMINADOR — extremamente analíticas, com múltiplos conceitos por questão (mínimo obrigatório: 10)"
          : "entre 10 e 12 questões de NÍVEL ACADÊMICO/PÓS-GRADUAÇÃO — estudo de caso longo, exigindo cálculos quando aplicável e combinação de múltiplas NRs (mínimo obrigatório: 10)";

    const difficultyLabel =
      difficulty === "easy"
        ? "FÁCIL"
        : difficulty === "hard"
          ? "DIFÍCIL (nível concurso público / banca examinadora)"
          : "EXPERT (nível prova acadêmica / pós-graduação em Engenharia de Segurança do Trabalho)";

    const sourceTextBlock =
      (difficulty === "hard" || difficulty === "expert") && sourceText && typeof sourceText === "string" && sourceText.trim().length > 0
        ? `\n\nREGRA CRÍTICA DE FONTE:\nUse EXCLUSIVAMENTE o texto base abaixo como fonte de informação. NÃO invente itens de NR fora dele. Toda questão deve ser respondível a partir do texto. Se o texto não cobrir um detalhe, NÃO o use.\n\n<<TEXTO_BASE>>\n${sourceText.trim()}\n<</TEXTO_BASE>>`
        : "";

    const expertExtra =
      difficulty === "expert"
        ? `\nAs questões devem:
- Apresentar estudo de caso longo e realista (3-6 linhas) no enunciado.
- Exigir cálculos numéricos quando o tema permitir (NR-15 limites de tolerância, NR-17 ergonomia, NR-06 cálculo de EPI, NR-12 cálculo de proteção, etc).
- Combinar 2 ou mais NRs simultaneamente em uma mesma questão.
- Distratores quase idênticos à correta — diferença em UMA palavra, número, condição ou exceção.
- Nível de banca de pós-graduação / mestrado em Engenharia de Segurança.
- Evitar perguntas conceituais simples — sempre análise de cenário.`
        : difficulty === "hard"
          ? `\nAs questões devem:
- Exigir interpretação de cenários reais e julgamento técnico (estudo de caso curto no enunciado).
- Cobrar números EXATOS de NRs (limites, prazos, períodos, distâncias, alturas, capacidades).
- Incluir pegadinhas: troca de item da NR, exceções, responsabilidades cruzadas (empregador vs empregado vs SESMT vs CIPA).
- Combinar 2+ NRs quando o tema permitir.
- Distratores devem ser quase corretos — diferenças sutis em uma palavra, número ou condição.
- Evitar perguntas conceituais simples ("o que é EPI?") — sempre exigir aplicação ou análise.`
          : "As questões devem cobrir conceitos básicos e aplicações diretas.";

    const frameworkBlock = framework === "5w2h" || framework === "swot"
      ? `\nFluxo: Simulado de Modelo de Estudo. Modelo obrigatório: ${framework.toUpperCase()}. Todas as questões devem avaliar domínio do modelo ${framework.toUpperCase()} aplicado à Saúde e Segurança do Trabalho.`
      : "";

    const userPrompt = `Tema: ${topic}
Dificuldade: ${difficultyLabel}
Quantidade: ${range}.
Total de pontos: exatamente 100, distribuídos entre as questões.${frameworkBlock}${expertExtra}${sourceTextBlock}`;

    const model =
      difficulty === "expert"
        ? "google/gemini-3.1-pro-preview"
        : difficulty === "hard"
          ? "google/gemini-3.1-pro-preview"
          : "google/gemini-3-flash-preview";

    const body: any = {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "build_quiz",
            description: "Retorna um simulado estruturado",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string", description: "Enunciado" },
                      options: {
                        type: "array",
                        items: { type: "string" },
                        description: "Exatamente 4 alternativas",
                      },
                      correct_index: { type: "integer", description: "Índice 0-3 da correta" },
                      points: { type: "integer", description: "Pontos da questão" },
                      explanation: { type: "string", description: "Justificativa técnica curta" },
                    },
                    required: ["question", "options", "correct_index", "points", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "build_quiz" } },
    };

    if (difficulty === "expert") {
      body.reasoning = { effort: "high" };
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("quiz AI error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar simulado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    const questions = args.questions ?? [];
    if (!Array.isArray(questions) || questions.length < 10) {
      return new Response(JSON.stringify({ error: "A IA gerou menos de 10 questões. Tente gerar novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize points to total exactly 100
    const totalPts = questions.reduce((s: number, q: any) => s + (q.points || 0), 0);
    if (totalPts !== 100 && questions.length > 0) {
      const scale = 100 / totalPts;
      let acc = 0;
      questions.forEach((q: any, i: number) => {
        if (i === questions.length - 1) {
          q.points = 100 - acc;
        } else {
          q.points = Math.max(1, Math.round((q.points || 0) * scale));
          acc += q.points;
        }
      });
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
