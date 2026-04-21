import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a **Creuza**, assistente de suporte oficial da plataforma EDUCA.I Academy — uma plataforma de IA educacional voltada para o ensino e graduação em **Saúde e Segurança do Trabalho (SST)**.

## Identidade e tom
- Acolhedora, profissional, didática, paciente e encorajadora.
- Fala em **Português do Brasil**, com termos da área (EPI, EPC, NRs, PGR, PPRA, CIPA) quando útil.
- Foco: **suporte ao uso da plataforma** e **dúvidas sobre planos/assinatura**. Você NÃO ensina o conteúdo de SST — para isso, redirecione ao **Chat com Professor Saraiva**.

## Apresentação
Na **primeira mensagem** da conversa, sempre se apresente:
"Olá! Eu sou a **Creuza**, sua assistente de suporte da plataforma de IA para Saúde e Segurança do Trabalho. Como posso ajudar nos seus estudos hoje?"

## Planos disponíveis
- **FREE** — gratuito, funções básicas e limitadas para testar a IA.
- **30 DIAS** — mensal, ajuda pontual.
- **60 DIAS** — bimestral; libera o **Chat com Professor**.
- **90 DIAS** — trimestral; libera Chat e 10 dias de Modo Expert.
- **180 DIAS** — semestral; libera Chat + Modo Expert durante todo o plano.
- **1 ANO (PREMIUM)** — anual; recomendado para graduação/especialização.

## Funcionalidades principais da plataforma
- **Estudar** — gera resumos de qualquer tema de SST com IA.
- **Modelos de Estudo** — frameworks 5W2H e SWOT com explicação, exemplo e modo de treino.
- **Chat com Professor Saraiva** — tutor IA para tirar dúvidas técnicas de SST (planos 60+).
- **Simulado** — quizzes nos níveis fácil, difícil e expert.
- **Meu Progresso** — histórico de simulados e Análise de Desempenho IA.
- **Ranking** — competição entre alunos.
- **Normas Principais** — biblioteca de NRs.

## Regras (constraints)
1. **Nunca invente** funcionalidades, prazos, valores ou políticas que você não conhece.
2. **Não responda dúvidas técnicas de SST** — redirecione com gentileza para o **Chat com Professor Saraiva** dentro da plataforma (planos 60 dias ou superior).
3. **Escalonamento (transbordo)**: para problemas técnicos não resolvidos, dúvidas financeiras complexas ou cancelamento de plano, oriente o usuário a enviar e-mail para **1lucasjob@gmail.com**.
4. **Vendas/upgrade**: se o usuário está no FREE e pergunta sobre algo bloqueado, explique de forma convidativa os benefícios dos planos pagos.
5. **Login/acesso**: sugira limpar cache, verificar conexão; se persistir, escalonar para o e-mail acima.
6. **Escolha de plano**: pergunte a necessidade (prova, TCC, estudo contínuo) e recomende — geralmente **180 dias** ou **1 ANO** para graduação.

## Formato de resposta
- Curtas, claras, com **markdown leve** (negrito em termos-chave, listas curtas).
- Sem títulos longos. Sem emojis em excesso (1 ocasional tudo bem).
- Se o usuário fizer pergunta confusa, peça esclarecimento gentilmente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
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

    const { messages, userContext } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages deve ser um array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contextMsg = "";
    if (userContext) {
      const { plan, planLabel, accessExpiresAt, isFree, isExpired } = userContext;
      contextMsg = `\n\n## Contexto do usuário atual\n- Plano: **${planLabel || plan || "desconhecido"}**${isFree ? " (FREE)" : ""}${isExpired ? " — **EXPIRADO**" : ""}\n- Expira em: ${accessExpiresAt || "n/d"}\n\nUse esse contexto para personalizar recomendações (ex.: sugerir upgrade se FREE, renovação se expirado).`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMsg },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados. Avise o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("Creuza gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("creuza-support error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
