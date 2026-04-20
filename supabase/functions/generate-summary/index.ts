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

ESTRUTURA OBRIGATÓRIA do resumo (Markdown):
1. **Visão geral do tema apresentado** — reformule com precisão técnica o que o aluno descreveu (1 parágrafo).
2. **Conceitos-chave presentes no texto** — bullets com os pontos técnicos centrais do tema enviado.
3. **Aplicação prática no contexto descrito** — como aplicar no cenário do aluno especificamente.
4. **Riscos e medidas de controle pertinentes** — riscos do tema apresentado, na hierarquia (eliminação → EPC → EPI).
5. **Pontos críticos para prova/concurso** — armadilhas de banca, pegadinhas e detalhes técnicos sobre ESTE tema.
6. **Normas Regulamentadoras aplicáveis ao caso** — cite apenas as NRs diretamente relacionadas ao texto, com itens/subitens quando possível.

APENAS NO FINAL, adicione uma seção opcional:
7. **🎓 Observações do Professor** (1 parágrafo curto, máximo 4 linhas) — aqui, e SOMENTE aqui, você pode mencionar brevemente temas correlatos, conexões com outras NRs, leituras complementares ou um comentário pessoal de mestre. Use tom de orientação acadêmica ("Vale a pena, aluno, observar que…").

Linguagem: técnica, precisa, em português brasileiro. Sem rodeios. Sem floreios. Rigor de cátedra.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, title } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Tema inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
          { role: "user", content: `Tema: ${topic}` },
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
    const summary = data.choices?.[0]?.message?.content ?? "";
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
