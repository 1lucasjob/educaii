import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Brain, Sparkles, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Estudar() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(profile?.current_topic ?? null);

  const unlocked = profile?.current_topic_unlocked ?? true;
  const lastScore = profile?.last_score ?? 0;

  const generate = async () => {
    if (!unlocked) {
      toast({ title: "Tema bloqueado", description: "Conclua o Simulado Difícil com 80+ pontos para liberar.", variant: "destructive" });
      return;
    }
    if (topic.trim().length < 3) {
      toast({ title: "Digite um tema válido", variant: "destructive" });
      return;
    }
    setLoadingSummary(true);
    setSummary(null);
    const { data, error } = await supabase.functions.invoke("generate-summary", { body: { topic } });
    setLoadingSummary(false);
    if (error || data?.error) {
      toast({ title: "Erro ao gerar resumo", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setSummary(data.summary);
    setActiveTopic(topic);

    // Persist session and lock the topic
    if (profile) {
      await supabase.from("study_sessions").insert({ user_id: profile.id, topic, summary: data.summary });
      await supabase.from("profiles").update({ current_topic: topic, current_topic_unlocked: false, last_score: 0 }).eq("id", profile.id);
      await refreshProfile();
    }
  };

  const startQuiz = (difficulty: "easy" | "hard") => {
    if (!activeTopic) return;
    navigate(`/app/simulado?topic=${encodeURIComponent(activeTopic)}&difficulty=${difficulty}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="text-primary" /> Módulo de Estudos
        </h1>
        <p className="text-muted-foreground mt-1">Tema único por vez — desbloqueado ao dominar o difícil ≥ 80 pts.</p>
      </div>

      <Card className="p-6 shadow-glow">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${unlocked ? "bg-success/20" : "bg-warning/20 animate-pulse-glow"}`}>
            {unlocked ? <Unlock className="w-7 h-7 text-success" /> : <Lock className="w-7 h-7 text-warning" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold">{unlocked ? "Pronto para um novo tema" : "Tema atual bloqueado"}</h2>
              <Badge variant={unlocked ? "outline" : "secondary"}>{unlocked ? "Desbloqueado" : "Bloqueado"}</Badge>
            </div>
            {activeTopic && <p className="text-sm text-muted-foreground mt-1 truncate">Tema atual: <strong>{activeTopic}</strong></p>}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso para desbloquear</span>
                <span>{lastScore}/80 pts</span>
              </div>
              <Progress value={Math.min(100, (lastScore / 80) * 100)} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sobre qual tema quer estudar?</label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!unlocked || loadingSummary}
            placeholder={unlocked ? "Ex: NR-35 Trabalho em Altura, EPIs, ergonomia, brigada de incêndio…" : "Conclua o simulado difícil para liberar."}
            className="min-h-24"
          />
          <Button onClick={generate} disabled={!unlocked || loadingSummary} className="w-full gradient-primary text-primary-foreground shadow-glow">
            {loadingSummary ? "Gerando resumo…" : (<><Sparkles className="mr-2" /> Gerar Estudo</>)}
          </Button>
        </div>
      </Card>

      {summary && (
        <Card className="p-6 animate-fade-in">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Brain className="text-primary" /> Resumo Técnico</h3>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {summary}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Button onClick={() => startQuiz("easy")} variant="outline" className="border-primary/40 hover:bg-primary/10 h-14">
              <Target className="mr-2" />
              <div className="text-left">
                <p className="font-bold">Simulado Fácil</p>
                <p className="text-xs text-muted-foreground">10–25 questões · 100 pts</p>
              </div>
            </Button>
            <Button onClick={() => startQuiz("hard")} className="gradient-primary text-primary-foreground h-14 shadow-glow">
              <Zap className="mr-2" />
              <div className="text-left">
                <p className="font-bold">Simulado Difícil</p>
                <p className="text-xs opacity-80">5–15 questões · libera novo tema (≥80)</p>
              </div>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
