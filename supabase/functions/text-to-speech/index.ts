import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICES = [
  "pt-BR-FranciscaNeural",
  "pt-BR-AntonioNeural",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
] as const;

const BodySchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(VOICES),
});

const VOICE_LANG: Record<string, string> = {
  "pt-BR-FranciscaNeural": "pt-BR",
  "pt-BR-AntonioNeural": "pt-BR",
  "en-US-JennyNeural": "en-US",
  "en-US-GuyNeural": "en-US",
};

const MAX_CHUNK = 190; // Google Translate TTS limit (~200 chars)

/**
 * Splits text into chunks <= MAX_CHUNK chars, preferring sentence/word boundaries.
 */
function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_CHUNK) return [cleaned];

  const chunks: string[] = [];
  // Split by sentences first
  const sentences = cleaned.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [cleaned];

  let buffer = "";
  for (const sRaw of sentences) {
    const s = sRaw.trim();
    if (!s) continue;

    if (s.length > MAX_CHUNK) {
      // Flush buffer first
      if (buffer) {
        chunks.push(buffer.trim());
        buffer = "";
      }
      // Split long sentence by words
      const words = s.split(" ");
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > MAX_CHUNK) {
          if (line) chunks.push(line.trim());
          // If a single word is huge, hard-split it
          if (w.length > MAX_CHUNK) {
            for (let i = 0; i < w.length; i += MAX_CHUNK) {
              chunks.push(w.slice(i, i + MAX_CHUNK));
            }
            line = "";
          } else {
            line = w;
          }
        } else {
          line = line ? line + " " + w : w;
        }
      }
      if (line) chunks.push(line.trim());
    } else if ((buffer + " " + s).trim().length > MAX_CHUNK) {
      if (buffer) chunks.push(buffer.trim());
      buffer = s;
    } else {
      buffer = buffer ? buffer + " " + s : s;
    }
  }
  if (buffer) chunks.push(buffer.trim());
  return chunks;
}

async function fetchChunkMp3(text: string, lang: string): Promise<Uint8Array> {
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8` +
    `&q=${encodeURIComponent(text)}` +
    `&tl=${encodeURIComponent(lang)}` +
    `&client=tw-ob&ttsspeed=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
      "Accept": "audio/mpeg, */*",
      "Accept-Language": lang,
    },
  });

  if (!res.ok) {
    throw new Error(`Falha no provedor TTS (HTTP ${res.status})`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error("Provedor TTS retornou áudio vazio");
  }
  return buf;
}

async function synthesize(text: string, voice: string): Promise<Uint8Array> {
  const lang = VOICE_LANG[voice] ?? "pt-BR";
  const chunks = chunkText(text);

  const audioParts: Uint8Array[] = [];
  for (const chunk of chunks) {
    // Small delay between requests to avoid rate-limit
    if (audioParts.length > 0) {
      await new Promise((r) => setTimeout(r, 120));
    }
    const mp3 = await fetchChunkMp3(chunk, lang);
    audioParts.push(mp3);
  }

  const total = audioParts.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of audioParts) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Entrada inválida", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { text, voice } = parsed.data;
    const audio = await synthesize(text, voice);

    return new Response(audio, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("text-to-speech error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
