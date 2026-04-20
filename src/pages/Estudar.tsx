import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Brain, Sparkles, Target, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { computeFreeTrial } from "@/lib/freeTrial";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Estudar() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [hardUnlocked, setHardUnlocked] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(profile?.current_topic ?? null);

  const trial = computeFreeTrial({ plan: profile?.plan, createdAt: profile?.created_at });
  const freeExpired = trial.isFree && !trial.freeBaseActive;
  const unlocked = (profile?.current_topic_unlocked ?? true) && !freeExpired;
  const lastScore = profile?.last_score ?? 0;

  const MIN_CHARS_EASY = 500;
  const MIN_CHARS_HARD = 1501;
  const TITLE_MIN = 5;
  const TITLE_MAX = 80;
  const topicLength = topic.trim().length;
  const titleLength = title.trim().length;
  const meetsEasy = topicLength >= MIN_CHARS_EASY;
  const meetsHard = topicLength >= MIN_CHARS_HARD;
  const titleValid = titleLength >= TITLE_MIN && titleLength <= TITLE_MAX;

  const generate = async () => {
    if (freeExpired) {
      toast({ title: "Acesso FREE encerrado", description: "Faça upgrade para continuar gerando resumos.", variant: "destructive" });
      return;
    }
    if (!unlocked) {
      toast({ title: "Tema bloqueado", description: "Conclua o Simulado Difícil com 80+ pontos para liberar.", variant: "destructive" });
      return;
    }
    if (!titleValid) {
      toast({
        title: "Título inválido",
        description: `Informe um título entre ${TITLE_MIN} e ${TITLE_MAX} caracteres (ex: "NR-35 — Trabalho em Altura").`,
        variant: "destructive",
      });
      return;
    }
    if (!meetsEasy) {
      toast({
        title: "Texto insuficiente",
        description: `Escreva pelo menos ${MIN_CHARS_EASY} caracteres descrevendo o tema (atual: ${topicLength}).`,
        variant: "destructive",
      });
      return;
    }
    setLoadingSummary(true);
    setSummary(null);
    const cleanTitle = title.trim();
    const isHard = meetsHard;
    const { data, error } = await supabase.functions.invoke("generate-summary", { body: { topic, title: cleanTitle } });
    setLoadingSummary(false);
    if (error || data?.error) {
      toast({ title: "Erro ao gerar resumo", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setSummary(data.summary);
    setHardUnlocked(isHard);

    setActiveTopic(cleanTitle);
    if (profile) {
      await supabase.from("study_sessions").insert({ user_id: profile.id, topic: `${cleanTitle}\n\n${topic}`, summary: data.summary });
      await supabase.from("profiles").update({ current_topic: cleanTitle, current_topic_unlocked: false, last_score: 0 }).eq("id", profile.id);
      await refreshProfile();
    }
    setTitle("");
    setTopic("");
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

      {trial.isFree && trial.freeBaseActive && (
        <Alert className="border-primary/40 bg-primary/5">
          <Sparkles className="w-4 h-4 text-primary" />
          <AlertDescription className="text-sm">
            Plano <strong>FREE</strong> ativo · Resumos e Simulado Fácil por mais{" "}
            <strong>{trial.baseDaysLeft} dia(s)</strong>
            {trial.freeChatActive && <> · Chat e Simulado Difícil por mais <strong>{trial.chatDaysLeft} dia(s)</strong></>}
            {" · "}<Link to="/app/planos" className="text-primary underline underline-offset-2">Ver planos</Link>
          </AlertDescription>
        </Alert>
      )}
      {freeExpired && (
        <Alert className="border-destructive/40 bg-destructive/10">
          <Lock className="w-4 h-4 text-destructive" />
          <AlertDescription className="text-sm">
            Seu período gratuito de 30 dias acabou.{" "}
            <Link to="/app/planos" className="text-primary underline underline-offset-2 font-medium">
              Faça upgrade para continuar estudando
            </Link>.
          </AlertDescription>
        </Alert>
      )}

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
            {activeTopic && <p className="text-sm text-muted-foreground mt-1">Tema atual: <strong>{activeTopic}</strong></p>}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso para desbloquear</span>
                <span>{lastScore}/80 pts</span>
              </div>
              <Progress value={Math.min(100, (lastScore / 80) * 100)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="study-title">Título do tema de estudo</Label>
            <Input
              id="study-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              disabled={!unlocked || loadingSummary}
              placeholder="Ex: NR-35 — Trabalho em Altura"
              maxLength={TITLE_MAX}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={titleValid ? "text-success" : "text-muted-foreground"}>
                {titleLength}/{TITLE_MAX} {titleValid ? "✓" : `(mín. ${TITLE_MIN})`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-topic">Descrição detalhada do tema</Label>
            <Textarea
              id="study-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!unlocked || loadingSummary}
              placeholder={unlocked ? "Descreva o tema que quer estudar (NR, contexto, riscos, medidas…). 500+ caracteres libera Simulado Fácil; 1501+ libera também o Simulado Difícil." : "Conclua o simulado difícil para liberar."}
              className="min-h-32"
            />
            <div className="flex items-center justify-between text-xs gap-3">
              <span className={meetsHard ? "text-success" : meetsEasy ? "text-primary" : "text-muted-foreground"}>
                {meetsHard
                  ? `${topicLength}/${MIN_CHARS_HARD} ✓ libera Fácil + Difícil`
                  : meetsEasy
                    ? `${topicLength}/${MIN_CHARS_HARD} ✓ libera Simulado Fácil`
                    : `${topicLength}/${MIN_CHARS_EASY} (mínimo para gerar)`}
              </span>
              <Progress value={Math.min(100, (topicLength / MIN_CHARS_HARD) * 100)} className="w-24 h-1.5" />
            </div>
          </div>

          <Button onClick={generate} disabled={!unlocked || loadingSummary || !meetsEasy || !titleValid} className="w-full gradient-primary text-primary-foreground shadow-glow">
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
                <p className="text-xs text-muted-foreground">5–10 questões · 100 pts</p>
              </div>
            </Button>
            {hardUnlocked ? (
              <Button onClick={() => startQuiz("hard")} className="gradient-primary text-primary-foreground h-14 shadow-glow">
                <Zap className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Difícil</p>
                  <p className="text-xs opacity-80">5–10 questões · libera novo tema (≥80)</p>
                </div>
              </Button>
            ) : (
              <Button disabled className="h-14" variant="outline" title="Escreva 1501+ caracteres para liberar o Simulado Difícil">
                <Lock className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Difícil</p>
                  <p className="text-xs text-muted-foreground">Escreva 1501+ caracteres para liberar</p>
                </div>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
