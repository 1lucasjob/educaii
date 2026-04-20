import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Send, Lock, Mail, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildRenewalMailto, planLabel } from "@/lib/plans";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatProfessor() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const unlocked = isAdmin || !!profile?.chat_unlocked;

  useEffect(() => {
    if (!unlocked || !profile) {
      setLoadingHistory(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role,content")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as Msg[]);
      setLoadingHistory(false);
    })();
  }, [profile, unlocked]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!unlocked) {
    const planName = profile ? planLabel(profile.plan) : "FREE";
    const mailto = profile
      ? buildRenewalMailto({
          userEmail: profile.email,
          plan: profile.plan,
          expiresAt: profile.access_expires_at,
        })
      : "#";
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Chat com Professor bloqueado</h1>
          <p className="text-muted-foreground mb-1">
            Seu plano atual é <strong className="text-foreground">{planName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            O Chat com Professor está disponível para alunos do plano <strong>90 DAYS</strong>,{" "}
            <strong>PREMIUM</strong> ou <strong>30 DAYS</strong> a partir da primeira renovação.
          </p>
          <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-glow">
            <a href={mailto}>
              <Mail className="w-4 h-4 mr-2" /> Solicitar upgrade
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming || !profile) return;

    const userMsg: Msg = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsStreaming(true);

    // persist user msg
    supabase.from("chat_messages").insert({
      user_id: profile.id,
      role: "user",
      content: text,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-professor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ messages: newHistory }),
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erro ao chamar chat" }));
        toast({ title: "Erro", description: err.error ?? "Falha no chat", variant: "destructive" });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, i);
          buffer = buffer.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((prev) =>
                prev.map((m, idx) =>
                  idx === prev.length - 1 ? { ...m, content: assistantText } : m
                )
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantText) {
        await supabase.from("chat_messages").insert({
          user_id: profile.id,
          role: "assistant",
          content: assistantText,
        });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro de conexão", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = async () => {
    if (!profile) return;
    if (!confirm("Limpar todo o histórico do chat?")) return;
    await supabase.from("chat_messages").delete().eq("user_id", profile.id);
    setMessages([]);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-primary" /> Chat com Professor
        </h1>
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearChat}>
            <Trash2 className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center text-muted-foreground py-12">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-primary/60" />
              <p className="font-medium">Olá, aluno!</p>
              <p className="text-sm">
                Pergunte qualquer dúvida sobre as Normas Regulamentadoras, segurança do trabalho,
                engenharia ou conceitos que você está estudando.
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Pergunte ao professor… (Enter envia, Shift+Enter quebra linha)"
            rows={2}
            className="resize-none"
            disabled={isStreaming}
          />
          <Button
            onClick={send}
            disabled={isStreaming || !input.trim()}
            className="gradient-primary text-primary-foreground self-end"
            size="icon"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
