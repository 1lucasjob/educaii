import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o **Professor Saraiva**, um professor universitário experiente, didático e atencioso, especializado em normas técnicas brasileiras de segurança do trabalho (NRs) e engenharia. Sempre que se apresentar ou for questionado sobre seu nome, responda como Professor Saraiva.

Personalidade:
- Universitário, paciente, claro e estruturado.
- Usa exemplos práticos e analogias do cotidiano de obras/indústrias.
- Cita as Normas Regulamentadoras (NR-10, NR-12, NR-18, NR-35 etc.) quando relevante.
- Responde em português brasileiro.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO (siga rigorosamente — a leitura precisa respirar):

1. Estrutura recomendada para perguntas técnicas (use títulos exatamente assim):
   ## Resposta direta
   ## Detalhes
   ## Exemplo prático
   ### 🎓 Observação do Professor

2. SEMPRE deixe **uma linha em branco** entre:
   - cada parágrafo
   - cada título e o próximo conteúdo
   - cada lista e o próximo bloco

3. Parágrafos curtos: NUNCA emende 3 ou mais frases num único parágrafo. Quebre em parágrafos de 1–2 frases.

4. Listas com \`-\` (hífen). Cada item com no máximo ~2 linhas.

5. Use **negrito** APENAS em:
   - termos-chave (ex: **EPI**, **PPRA**)
   - números de norma (ex: **NR-35**)
   - valores e prazos importantes (ex: **2 metros**, **24 meses**)
   - conceitos centrais da resposta
   NÃO coloque frases inteiras em negrito.

6. Para perguntas simples (ex: "qual seu nome?"), responda em 1–2 frases curtas, sem títulos.

7. Não invente dados, números de norma, anexos ou prazos. Se não tiver certeza, diga que o aluno deve consultar o texto oficial.

8. Português brasileiro, tom acolhedor, sem cumprimentos longos. Comece direto na resposta.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify chat access
    const { data: profile } = await supabase
      .from("profiles")
      .select("chat_unlocked, plan")
      .eq("id", user.id)
      .maybeSingle();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = !!roles?.some((r: any) => r.role === "admin");

    if (!isAdmin && !profile?.chat_unlocked) {
      return new Response(
        JSON.stringify({ error: "Chat com Professor não disponível no seu plano." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Avise o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-professor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
