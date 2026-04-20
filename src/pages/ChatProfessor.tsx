import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Send, Lock, Mail, Trash2, Loader2, Bookmark, BookmarkCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildRenewalMailto, planLabel } from "@/lib/plans";
import ReactMarkdown from "react-markdown";

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  pinned?: boolean;
  expires_at?: string;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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
      // Cleanup expired non-pinned messages on read
      await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", profile.id)
        .eq("pinned", false)
        .lt("expires_at", new Date().toISOString());

      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content,pinned,expires_at")
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
          <h1 className="text-2xl font-bold mb-2">Chat com Professor Saraiva bloqueado</h1>
          <p className="text-muted-foreground mb-1">
            Seu plano atual é <strong className="text-foreground">{planName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            O Chat com Professor Saraiva está disponível para alunos do plano <strong>90 DAYS</strong>,{" "}
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
          body: JSON.stringify({ messages: newHistory.map(({ role, content }) => ({ role, content })) }),
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
        const { data: inserted } = await supabase
          .from("chat_messages")
          .insert({
            user_id: profile.id,
            role: "assistant",
            content: assistantText,
          })
          .select("id,expires_at")
          .single();
        if (inserted) {
          setMessages((prev) =>
            prev.map((m, idx) =>
              idx === prev.length - 1
                ? { ...m, id: inserted.id, expires_at: inserted.expires_at }
                : m
            )
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro de conexão", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const pinMessage = async (msg: Msg, idx: number) => {
    if (!msg.id || !profile) return;
    const newExpiry = new Date(Date.now() + THREE_DAYS_MS).toISOString();
    const { error } = await supabase
      .from("chat_messages")
      .update({ pinned: true, expires_at: newExpiry })
      .eq("id", msg.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setMessages((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, pinned: true, expires_at: newExpiry } : m))
    );
    toast({ title: "Salva por +3 dias!", description: "A mensagem ficará disponível por mais 3 dias." });
  };

  const clearChat = async () => {
    if (!profile) return;
    if (!confirm("Limpar todo o histórico do chat (incluindo mensagens salvas)?")) return;
    await supabase.from("chat_messages").delete().eq("user_id", profile.id);
    setMessages([]);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-primary" /> Chat com Professor Saraiva
        </h1>
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearChat}>
            <Trash2 className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <Alert className="mb-3 border-amber-500/40 bg-amber-500/10">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs">
          As conversas são apagadas automaticamente após <strong>3 dias</strong>. Use{" "}
          <strong>"Salvar +3 dias"</strong> nas respostas que quiser manter por mais tempo.
        </AlertDescription>
      </Alert>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center text-muted-foreground py-12">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-primary/60" />
              <p className="font-medium">Olá, aluno! Sou o Professor Saraiva.</p>
              <p className="text-sm">
                Pergunte qualquer dúvida sobre as Normas Regulamentadoras, segurança do trabalho,
                engenharia ou conceitos que você está estudando.
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : `bg-muted text-foreground ${m.pinned ? "border-2 border-amber-500/60" : ""}`
                  }`}
                >
                  {m.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                      {m.id && m.content && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => pinMessage(m, i)}
                            disabled={m.pinned && !!m.expires_at && new Date(m.expires_at).getTime() - Date.now() > THREE_DAYS_MS - 60_000}
                          >
                            {m.pinned ? (
                              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                            {m.pinned ? "Salva (+3 dias)" : "Salvar +3 dias"}
                          </Button>
                        </div>
                      )}
                    </>
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
            placeholder="Pergunte ao Professor Saraiva… (Enter envia, Shift+Enter quebra linha)"
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
