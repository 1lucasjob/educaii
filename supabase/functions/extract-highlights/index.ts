// Extract verbatim key excerpts from a user-provided text
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um extrator de trechos. Sua única tarefa é selecionar os trechos MAIS IMPORTANTES de um texto fornecido pelo aluno.

REGRAS ABSOLUTAS:
- Retorne APENAS um JSON válido no formato: {"highlights": ["trecho 1", "trecho 2", ...]}
- Cada item DEVE ser uma substring EXATA, contígua e LITERAL do texto fornecido.
- NUNCA reescreva, parafraseie, resuma, traduza ou corrija ortografia/pontuação.
- NUNCA junte pedaços de partes diferentes do texto.
- Cada trecho deve ter entre 1 e 3 frases (idealmente uma frase completa).
- Não adicione comentários, marcações, aspas externas ou explicações.
- Se o texto for curto, retorne menos itens. Qualidade > quantidade.`;

const FRAMEWORK_TEMPLATE_MARKERS = [
  "Resumo no formato 5W2H",
  "Resumo no formato SWOT (FOFA)",
];

function topicMatchesFrameworkTemplate(topic: string): boolean {
  if (!topic) return false;
  const head = topic.trimStart();
  return FRAMEWORK_TEMPLATE_MARKERS.some((m) => head.startsWith(m));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, title, count, from_framework } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 100) {
      return new Response(JSON.stringify({ error: "Texto muito curto para extrair trechos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const frameworkBypass = from_framework === true && topicMatchesFrameworkTemplate(topic);
    void frameworkBypass; // gating de plano é feito no client; flag fica disponível para futura validação server-side
    const safeCount = Math.max(3, Math.min(10, Number(count) || 6));
    const safeTitle = typeof title === "string" ? title.trim().slice(0, 200) : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const userContent = `${safeTitle ? `Título: ${safeTitle}\n\n` : ""}Texto-fonte:\n"""\n${topic}\n"""\n\nExtraia até ${safeCount} trechos LITERAIS (substrings exatas) mais importantes deste texto. Retorne apenas o JSON.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao extrair trechos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: { highlights?: unknown } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Invalid JSON from model:", content);
      return new Response(JSON.stringify({ error: "Resposta do modelo inválida. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = Array.isArray(parsed.highlights) ? parsed.highlights : [];
    const seen = new Set<string>();
    const highlights = raw
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter((s) => s.length >= 10)
      .filter((s) => topic.includes(s))
      .filter((s) => {
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      })
      .slice(0, safeCount);

    if (highlights.length === 0) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair trechos verbatim — tente novamente." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ highlights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-highlights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
