import { supabase } from "@/integrations/supabase/client";

type TextToSpeechRequest = {
  text: string;
  voice: string;
};

function getFunctionUrl(name: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "error" in payload) {
      return String(payload.error);
    }
  }

  const text = await response.text().catch(() => "");
  return text || `Falha no servidor (HTTP ${response.status})`;
}

export async function requestTextToSpeechAudio({ text, voice }: TextToSpeechRequest) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(getFunctionUrl("text-to-speech"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("Áudio vazio recebido");
  }

  return blob;
}