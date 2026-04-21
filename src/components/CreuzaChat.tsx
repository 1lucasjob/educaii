import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2, Mail, Headset, Loader2 } from "lucide-react";
import { planLabel } from "@/lib/plans";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "creuza:history";
const SUPPORT_EMAIL = "1lucasjob@gmail.com";

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá! Eu sou a **Creuza**, sua assistente de suporte da plataforma de IA para Saúde e Segurança do Trabalho. Como posso ajudar nos seus estudos hoje?",
};

interface Props {
  className?: string;
  /** Altura interna do scroll de mensagens. Use h-full em página, fixo no drawer. */
  heightClass?: string;
}

export default function CreuzaChat({ className, heightClass = "h-[calc(100vh-280px)]" }: Props) {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [WELCOME];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {/* ignore */}
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {/* ignore */}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setSending(true);

    try {
      const token = session?.access_token;
      const expired = profile?.access_expires_at ? new Date(profile.access_expires_at) < new Date() : false;
      const userContext = profile
        ? {
            plan: profile.plan,
            planLabel: planLabel(profile.plan),
            accessExpiresAt: profile.access_expires_at,
            isFree: profile.plan === "free",
            isExpired: expired,
          }
        : null;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creuza-support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].filter((m) => m.content).map(({ role, content }) => ({ role, content })),
          userContext,
        }),
      });

      if (!resp.ok || !resp.body) {
        let errMsg = "Falha ao falar com a Creuza.";
        try {
          const j = await resp.json();
          if (j?.error) errMsg = j.error;
        } catch {/* ignore */}
        throw new Error(errMsg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return copy;
      });
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {/* ignore */}
  };

  const emailSupport = () => {
    const subject = encodeURIComponent("Suporte EDUCA.I - Solicitação de ajuda");
    const body = encodeURIComponent(
      `Olá, equipe de suporte!\n\nUsuário: ${profile?.email ?? "(não informado)"}\nPlano: ${profile ? planLabel(profile.plan) : "n/d"}\n\nDescreva sua dúvida abaixo:\n\n`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto rounded-lg border border-border bg-card/50 p-3 space-y-3 ${heightClass}`}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" && i === 0 && (
                <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-primary">
                  <Headset className="w-3.5 h-3.5" /> Creuza · Suporte
                </div>
              )}
              {m.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Pergunte sobre planos, navegação ou problemas técnicos…"
          className="min-h-[60px] resize-none"
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-auto">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs gap-1">
          <Trash2 className="w-3 h-3" /> Limpar conversa
        </Button>
        <Button variant="outline" size="sm" onClick={emailSupport} className="text-xs gap-1">
          <Mail className="w-3 h-3" /> Falar com humano
        </Button>
      </div>
    </div>
  );
}
