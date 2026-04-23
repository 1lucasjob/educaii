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

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_TTS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSsml(voice: string, text: string): string {
  const lang = voice.startsWith("pt") ? "pt-BR" : "en-US";
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>` +
    `<voice name='${voice}'>` +
    `<prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  );
}

function uuid(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

async function synthesize(text: string, voice: string): Promise<Uint8Array> {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(EDGE_TTS_URL);
    ws.binaryType = "arraybuffer";

    const chunks: Uint8Array[] = [];
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          ws.close();
        } catch (_) { /* noop */ }
        reject(new Error("Timeout: Edge-TTS demorou demais para responder"));
      }
    }, 30000);

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        ws.close();
      } catch (_) { /* noop */ }
    };

    ws.onopen = () => {
      const reqId = uuid();
      const ts = new Date().toString();

      // 1. speech.config
      const configMsg =
        `X-Timestamp:${ts}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "false",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      // 2. SSML
      const ssml = buildSsml(voice, text);
      const ssmlMsg =
        `X-RequestId:${reqId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${ts}\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        // Text frames: turn.start, response, turn.end
        if (ev.data.includes("Path:turn.end")) {
          if (!finished) {
            finished = true;
            cleanup();
            // Concatenate
            const total = chunks.reduce((acc, c) => acc + c.length, 0);
            const out = new Uint8Array(total);
            let off = 0;
            for (const c of chunks) {
              out.set(c, off);
              off += c.length;
            }
            if (out.length === 0) {
              reject(new Error("Edge-TTS retornou áudio vazio"));
            } else {
              resolve(out);
            }
          }
        }
      } else {
        // Binary: 2-byte big-endian header length, then header text, then audio bytes
        const buf = new Uint8Array(ev.data as ArrayBuffer);
        if (buf.length < 2) return;
        const headerLen = (buf[0] << 8) | buf[1];
        if (buf.length < 2 + headerLen) return;
        const headerText = new TextDecoder().decode(buf.slice(2, 2 + headerLen));
        if (headerText.includes("Path:audio")) {
          chunks.push(buf.slice(2 + headerLen));
        }
      }
    };

    ws.onerror = (ev) => {
      if (!finished) {
        finished = true;
        cleanup();
        reject(new Error(`Erro WebSocket Edge-TTS: ${(ev as ErrorEvent).message ?? "desconhecido"}`));
      }
    };

    ws.onclose = () => {
      if (!finished) {
        finished = true;
        cleanup();
        if (chunks.length > 0) {
          const total = chunks.reduce((acc, c) => acc + c.length, 0);
          const out = new Uint8Array(total);
          let off = 0;
          for (const c of chunks) {
            out.set(c, off);
            off += c.length;
          }
          resolve(out);
        } else {
          reject(new Error("Conexão fechada sem áudio"));
        }
      }
    };
  });
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
