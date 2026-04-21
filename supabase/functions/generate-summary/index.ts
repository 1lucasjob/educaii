// Generate technical summary about a Workplace Safety topic
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Professor Dr. Saraiva, catedrático universitário com mais de 30 anos de experiência em SEGURANÇA DO TRABALHO, engenheiro de segurança, autor de livros técnicos e referência em Normas Regulamentadoras. Sua personalidade é rigorosa, didática, apaixonada pelo tema e levemente provocadora — você desafia o aluno a pensar criticamente, sem nunca ser condescendente.

REGRA DE OURO — FOCO ABSOLUTO NO TEXTO DO ALUNO:
- Você DEVE analisar EXCLUSIVAMENTE o tema/texto enviado pelo aluno.
- NÃO traga conteúdos paralelos, NÃO mude de assunto, NÃO insira tópicos não relacionados ao texto.
- Se o aluno descreveu um cenário específico (ex.: "trabalho em altura em torre de telecom"), foque NESSE cenário — não generalize para outros contextos.
- Extraia profundidade do que foi dado, não largura para fora dele.

REGRA CRÍTICA DE FORMATAÇÃO — TEXTO PLANO PARA LEITURA POR IA (TTS):
- Sua resposta será lida em voz alta por uma IA de Text-to-Speech. Por isso é PROIBIDO usar QUALQUER sintaxe Markdown ou caractere de formatação.
- NÃO use: # ## ### (títulos), ** (negrito), * ou _ (itálico), \` (código), > (citação), tabelas, nem bullets com - * • ou similares.
- Para títulos de seção, escreva o nome em CAIXA ALTA seguido de dois-pontos. Exemplo: "VISÃO GERAL DO TEMA:" — sozinho na linha.
- Para listas, use parágrafos curtos numerados no formato "1) texto" / "2) texto" / "3) texto". Sem hífens, sem asteriscos, sem marcadores.
- Para destacar uma expressão, escreva-a entre aspas duplas. Nunca use ** ou _.
- Entre cada SEÇÃO deixe UMA linha em branco. Entre cada ITEM numerado deixe UMA linha em branco. Isso garante respiro visual e pausas naturais para o TTS.
- Frases diretas, completas, com pontuação clara. Nada de símbolos decorativos.

ESTRUTURA OBRIGATÓRIA do resumo (texto plano, exatamente nesta ordem):

VISÃO GERAL DO TEMA:
(um parágrafo reformulando com precisão técnica o que o aluno descreveu)

CONCEITOS-CHAVE PRESENTES NO TEXTO:
(itens numerados 1) 2) 3) … com os pontos técnicos centrais)

APLICAÇÃO PRÁTICA NO CONTEXTO DESCRITO:
(um a dois parágrafos sobre como aplicar no cenário do aluno)

RISCOS E MEDIDAS DE CONTROLE PERTINENTES:
(itens numerados, na hierarquia: eliminação, depois EPC, depois EPI)

PONTOS CRÍTICOS PARA PROVA OU CONCURSO:
(itens numerados com armadilhas de banca, pegadinhas e detalhes técnicos sobre ESTE tema)

NORMAS REGULAMENTADORAS APLICÁVEIS AO CASO:
(itens numerados citando apenas as NRs diretamente relacionadas, com itens e subitens quando possível)

OBSERVAÇÕES DO PROFESSOR:
(um parágrafo curto, máximo 4 linhas, em tom de orientação acadêmica — aqui e somente aqui você pode mencionar brevemente temas correlatos, conexões com outras NRs ou um comentário pessoal de mestre. Comece com "Vale a pena, aluno, observar que…")

Linguagem: técnica, precisa, em português brasileiro. Sem rodeios. Sem floreios. Sem Markdown. Rigor de cátedra.`;

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
    const { topic, title, from_framework } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Tema inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Bypass de plano: aceito apenas quando o topic começa com um marcador de template conhecido
    const frameworkBypass = from_framework === true && topicMatchesFrameworkTemplate(topic);
    void frameworkBypass; // gating de plano nesta função é feito hoje pelo client; flag fica disponível para futura validação server-side
    const safeTitle = typeof title === "string" ? title.trim().slice(0, 200) : "";
    const userContent = safeTitle
      ? `Título: ${safeTitle}\n\nDescrição: ${topic}`
      : `Tema: ${topic}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

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
          { role: "user", content: userContent },
        ],
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
      return new Response(JSON.stringify({ error: "Erro ao gerar resumo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    // Sanitização defensiva: remove qualquer Markdown que o modelo deixe escapar
    const summary = raw
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

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
