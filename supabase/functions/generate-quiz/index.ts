// Generate a quiz on a Workplace Safety topic via tool calling for structured output
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um professor rigoroso de SEGURANÇA DO TRABALHO. Crie questões de múltipla escolha técnicas e didáticas em português brasileiro. Cada questão deve ter 4 alternativas (A, B, C, D) com apenas uma correta. Distribua os pontos de forma equilibrada totalizando exatamente 100 pontos.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, difficulty } = await req.json();
    if (!topic || !["easy", "hard"].includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const range = difficulty === "easy"
      ? "entre 10 e 25 questões (escolha um número adequado)"
      : "entre 5 e 15 questões mais profundas e analíticas";

    const userPrompt = `Tema: ${topic}
Dificuldade: ${difficulty === "easy" ? "FÁCIL" : "DIFÍCIL"}
Quantidade: ${range}.
Total de pontos: exatamente 100, distribuídos entre as questões.
${difficulty === "hard" ? "As questões devem ser mais técnicas, exigir interpretação e conhecimento aprofundado das NRs." : "As questões devem cobrir conceitos básicos e aplicações diretas."}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      }),
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
