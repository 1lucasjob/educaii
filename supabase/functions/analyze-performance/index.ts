import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Professor Saraiva, especialista em segurança do trabalho e didática para concursos/provas técnicas.

Sua tarefa: gerar uma ANÁLISE DE DESEMPENHO personalizada e prática para o aluno, com base no resultado do simulado dele.

Regras de saída (OBRIGATÓRIAS):
- Responda em português do Brasil.
- Use APENAS texto plano. NÃO use markdown, NÃO use asteriscos, NÃO use #, NÃO use crases, NÃO use listas com - ou *.
- Para listas, numere com 1., 2., 3. e separe com quebras de linha.
- Use títulos de seção em CAIXA ALTA seguidos de dois pontos, em linha própria.
- Tom acolhedor, direto, técnico e motivador. Sem floreios.
- Comprimento total entre 350 e 700 palavras.

Estrutura obrigatória, nesta ordem:

RESUMO GERAL:
1 a 2 parágrafos curtos comentando o desempenho geral (nota, tempo, dificuldade), contextualizando o resultado.

PONTOS FORTES:
Liste de 2 a 4 acertos relevantes ou padrões positivos (conceitos dominados). Cite a questão pelo número quando útil.

PONTOS A MELHORAR:
Analise os erros, identifique padrões (ex.: confusão entre normas, falha em cálculos, dúvida em definições) e explique brevemente o conceito correto. Cite as questões pelo número.

PLANO DE ESTUDO RECOMENDADO:
3 a 5 passos práticos e específicos para o aluno melhorar (revisar NR específica, praticar cálculos X, refazer simulado em Y dias, etc.). Numere os passos.`;

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, difficulty, score, total_points, time_spent_seconds, questions, answers } = await req.json();

    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "Dados do simulado inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const breakdown = questions.map((q: any, i: number) => {
      const userIdx = answers[i];
      const correctIdx = q.correct_index;
      const ok = userIdx === correctIdx;
      return `Q${i + 1} [${ok ? "ACERTOU" : "ERROU"}] (${q.points ?? 0} pts)
Pergunta: ${q.question}
Resposta do aluno: ${userIdx >= 0 ? q.options?.[userIdx] ?? "—" : "Em branco"}
Resposta correta: ${q.options?.[correctIdx] ?? "—"}
Explicação: ${q.explanation ?? ""}`;
    }).join("\n\n");

    const minutes = Math.floor((time_spent_seconds ?? 0) / 60);
    const seconds = (time_spent_seconds ?? 0) % 60;

    const userContent = `TEMA: ${topic}
DIFICULDADE: ${difficulty === "expert" ? "Expert (acadêmico)" : "Difícil"}
NOTA: ${score} de ${total_points ?? 100}
TEMPO GASTO: ${minutes} min ${seconds} s
TOTAL DE QUESTÕES: ${questions.length}

DETALHAMENTO POR QUESTÃO:
${breakdown}

Gere a análise de desempenho seguindo exatamente a estrutura solicitada.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições no momento. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Avise o administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Falha ao gerar análise" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const analysis = stripMarkdown(raw);

    if (!analysis) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-performance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
