// Validate admin PIN, create invite token with plan, increment slots
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PIN = "1631";
const VALID_PLANS = ["free", "days_30", "days_60", "days_90", "premium"] as const;
type Plan = typeof VALID_PLANS[number];

const planDays = (p: Plan) =>
  p === "premium" ? 366 : p === "days_90" ? 90 : p === "days_60" ? 60 : 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const body = await req.json();
    const { pin, plan } = body as { pin: string; plan?: Plan };

    if (pin !== ADMIN_PIN) {
      return new Response(JSON.stringify({ error: "PIN incorreto" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chosenPlan: Plan = (plan && VALID_PLANS.includes(plan)) ? plan : "free";

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas admin pode liberar acesso" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inviteToken = crypto.randomUUID().replace(/-/g, "");
    const accessExpires = new Date(Date.now() + planDays(chosenPlan) * 86400000).toISOString();

    const { error: insErr } = await admin.from("invites").insert({
      token: inviteToken,
      created_by: userId,
      plan: chosenPlan,
      access_expires_at: accessExpires,
    });
    if (insErr) throw insErr;

    const { data: slot } = await admin.from("available_slots").select("count").eq("id", 1).single();
    await admin.from("available_slots").update({ count: (slot?.count ?? 0) + 1 }).eq("id", 1);

    return new Response(JSON.stringify({ token: inviteToken, plan: chosenPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-invite error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
