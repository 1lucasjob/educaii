import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Unlock, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Clock, Lock, Award, Zap, Sparkles, Copy, AlertCircle } from "lucide-react";
import { computeAchievements } from "@/lib/achievements";
import { fireConfetti, fireEpicConfetti, playAchievementSound, playSecretAchievementSound } from "@/lib/celebrate";
import { computeFreeTrial, computePlanWindows, expertActive, modelQuizAdvancedActive, modelQuizEasyActive, performanceAnalysisActive } from "@/lib/freeTrial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { saveQuiz, clearQuiz, loadQuiz, loadQuizRemote, clearQuizRemote } from "@/lib/quizPersistence";

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

export default function Simulado() {
  const [params] = useSearchParams();
  const topic = params.get("topic") ?? "";
  const difficulty = (params.get("difficulty") as "easy" | "hard" | "expert") ?? "easy";
  const framework = params.get("framework");
  const isFrameworkQuiz = framework === "5w2h" || framework === "swot";
  const navigate = useNavigate();
  const { profile, isAdmin, refreshProfile } = useAuth();
  const { toast } = useToast();

  const TIME_LIMIT =
    difficulty === "expert" ? 20 * 60 : difficulty === "hard" ? 10 * 60 : 15 * 60;
  const lockNavigation = difficulty === "hard" || difficulty === "expert";

  const trial = computeFreeTrial({ plan: profile?.plan, createdAt: profile?.created_at });
  const planWindow = computePlanWindows({ plan: profile?.plan, accessExpiresAt: profile?.access_expires_at });
  const userHasExpert = expertActive({ plan: profile?.plan, expertUnlockedUntil: profile?.expert_unlocked_until, isAdmin });

  const modelQuizAllowed = difficulty === "easy"
    ? modelQuizEasyActive({
        plan: profile?.plan,
        createdAt: profile?.created_at,
        modelQuizUnlockedUntil: profile?.model_quiz_unlocked_until,
        isAdmin,
      })
    : modelQuizAdvancedActive({
        plan: profile?.plan,
        modelQuizUnlockedUntil: profile?.model_quiz_unlocked_until,
        isAdmin,
      });
  const modelQuizBlocked = isFrameworkQuiz && !modelQuizAllowed;

  const freeBlocked =
    !isFrameworkQuiz &&
    !isAdmin &&
    trial.isFree &&
    ((difficulty === "hard" && !trial.freeHardActive) || (difficulty === "easy" && !trial.freeBaseActive));

  // Plano-based gating for Hard mode (não-FREE):
  const planAllowsHard =
    profile?.plan === "days_90" ||
    profile?.plan === "premium" ||
    (profile?.plan === "days_30" && (profile?.days_30_renewals_count ?? 0) >= 2) ||
    (profile?.plan === "days_60" && planWindow.hardActive);
  const planBlockedHard =
    !isFrameworkQuiz && !isAdmin && !!profile && !trial.isFree && difficulty === "hard" && !planAllowsHard;

  // Expert gating: somente premium, days_90 ou liberação ADM ativa.
  const expertBlocked = !isFrameworkQuiz && difficulty === "expert" && !userHasExpert;

  const blocked = modelQuizBlocked || freeBlocked || planBlockedHard || expertBlocked;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [timeSpent, setTimeSpent] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(blocked);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const canAnalyze = performanceAnalysisActive({
    plan: profile?.plan,
    createdAt: profile?.created_at,
    isAdmin,
  });

  const generateAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-performance", {
        body: {
          topic,
          difficulty,
          score,
          total_points: 100,
          time_spent_seconds: timeSpent,
          questions,
          answers,
        },
      });
      if (error || data?.error) {
        const msg = data?.error ?? error?.message ?? "Falha ao gerar análise";
        setAnalysisError(msg);
        toast({ title: "Erro na análise", description: msg, variant: "destructive" });
        return;
      }
      setAnalysisText(data?.analysis ?? "");
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao gerar análise";
      setAnalysisError(msg);
      toast({ title: "Erro na análise", description: msg, variant: "destructive" });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const copyAnalysis = async () => {
    if (!analysisText) return;
    try {
      await navigator.clipboard.writeText(analysisText);
      toast({ title: "Análise copiada para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    setGenerationError(null);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setFinished(false);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setTimeSpent(0);

    let sourceText: string | undefined;
    try {
      sourceText = localStorage.getItem(`study_body:${topic}`) ?? undefined;
    } catch {}

    const { data, error } = await supabase.functions.invoke("generate-quiz", {
      body: { topic, difficulty, sourceText, framework: isFrameworkQuiz ? framework : undefined },
    });
    const msg = data?.error ?? error?.message;
    if (error || data?.error || !Array.isArray(data?.questions) || data.questions.length < 10) {
      const fallback = !Array.isArray(data?.questions) || data?.questions?.length < 10
        ? "A IA não conseguiu gerar o mínimo de 10 questões. Tente novamente."
        : "Não foi possível gerar o simulado. Tente novamente.";
      const description = msg ?? fallback;
      setGenerationError(description);
      toast({ title: "Erro ao gerar simulado", description, variant: "destructive" });
      setLoading(false);
      return;
    }

    setQuestions(data.questions);
    setAnswers(new Array(data.questions.length).fill(-1));
    setLoading(false);
  };

  useEffect(() => {
    if (blocked) {
      setUpgradeOpen(true);
      setLoading(false);
      if (profile?.id) void clearQuizRemote(profile.id);
      return;
    }
    const wantResume = params.get("resume") === "1";

    const tryResumeFrom = (saved: any): boolean => {
      if (
        saved &&
        saved.topic === topic &&
        saved.difficulty === difficulty &&
        Array.isArray(saved.questions) &&
        saved.questions.length > 0
      ) {
        const elapsed = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
        const adjusted = Math.max(0, saved.timeLeft - elapsed);
        setQuestions(saved.questions);
        setAnswers(saved.answers);
        setCurrent(Math.min(saved.current, saved.questions.length - 1));
        setTimeLeft(adjusted);
        setTimeSpent(saved.timeSpent + elapsed);
        setLoading(false);
        return true;
      }
      return false;
    };

    const init = async () => {
      if (wantResume && profile?.id) {
        // Tenta local primeiro (instantâneo)
        const local = loadQuiz(profile.id);
        if (tryResumeFrom(local)) return;
        // Fallback: banco (outro dispositivo / cache limpo)
        const remote = await loadQuizRemote(profile.id);
        if (tryResumeFrom(remote)) return;
      }
      await generateQuiz();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir progresso em localStorage para permitir "Retomar Simulado"
  useEffect(() => {
    if (loading || finished || blocked) return;
    if (!profile?.id || questions.length === 0) return;
    saveQuiz(profile.id, {
      topic,
      difficulty,
      questions,
      answers,
      current,
      timeLeft,
      timeSpent,
      savedAt: Date.now(),
      timeLimit: TIME_LIMIT,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, answers, current, finished, loading]);

  // Salvar timer a cada 5s para manter timeLeft atualizado caso o usuário saia
  useEffect(() => {
    if (loading || finished || blocked) return;
    if (!profile?.id || questions.length === 0) return;
    if (timeLeft % 5 !== 0) return;
    saveQuiz(profile.id, {
      topic,
      difficulty,
      questions,
      answers,
      current,
      timeLeft,
      timeSpent,
      savedAt: Date.now(),
      timeLimit: TIME_LIMIT,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Countdown timer
  useEffect(() => {
    if (loading || finished) return;
    if (timeLeft <= 0) {
      toast({ title: "Tempo esgotado!", description: "Seu simulado foi finalizado automaticamente.", variant: "destructive" });
      submit();
      return;
    }
    const id = setTimeout(() => {
      setTimeLeft((t) => t - 1);
      setTimeSpent((t) => t + 1);
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, finished]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const select = (idx: number) => {
    // Hard mode: lock answer once chosen (no changes)
    if (lockNavigation && answers[current] >= 0) return;
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    // Auto-advance on hard mode after answering
    if (lockNavigation && current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 350);
    }
  };

  const submit = async () => {
    let total = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) total += q.points;
    });
    setScore(total);
    setFinished(true);
    clearQuiz(profile?.id);

    if (profile) {
      const { data: prevAttempts } = await supabase
        .from("quiz_attempts")
        .select("topic,difficulty,score,created_at,time_spent_seconds")
        .eq("user_id", profile.id);
      const prevUnlocked = new Set(
        computeAchievements((prevAttempts as any) ?? []).filter((a) => a.unlocked).map((a) => a.id),
      );

      // Anti-cheat: only count for ranking if took at least 120s
      // and fewer than 3 valid attempts of the same topic today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayValidSameTopic = (prevAttempts ?? []).filter(
        (a: any) =>
          a.topic?.toLowerCase().trim() === topic.toLowerCase().trim() &&
          (a.time_spent_seconds ?? 0) >= 120 &&
          new Date(a.created_at) >= startOfDay,
      ).length;
      const countsForRanking = timeSpent >= 120 && todayValidSameTopic < 3;

      if (!countsForRanking) {
        toast({
          title: "Simulado não conta no ranking",
          description:
            timeSpent < 120
              ? "Tempo mínimo de 2 minutos não atingido."
              : "Limite de 3 tentativas válidas por tema/dia atingido.",
        });
      }

      await supabase.from("quiz_attempts").insert({
        user_id: profile.id,
        topic,
        difficulty,
        score: total,
        total_points: 100,
        questions: questions as any,
        answers: answers as any,
        time_spent_seconds: timeSpent,
        counts_for_ranking: countsForRanking,
      });

      const updates: { last_score: number; current_topic_unlocked?: boolean } = { last_score: total };
      if (difficulty === "hard" && total >= 80) {
        updates.current_topic_unlocked = true;
      }
      await supabase.from("profiles").update(updates).eq("id", profile.id);
      await refreshProfile();

      const newAttempt = { topic, difficulty, score: total, created_at: new Date().toISOString(), time_spent_seconds: timeSpent };
      const allAttempts = [...((prevAttempts as any) ?? []), newAttempt];
      const newlyUnlocked = computeAchievements(allAttempts)
        .filter((a) => a.unlocked && !prevUnlocked.has(a.id));

      if (newlyUnlocked.length > 0) {
        const hasSecret = newlyUnlocked.some((a) => a.secret);
        if (hasSecret) {
          fireEpicConfetti();
          playSecretAchievementSound();
        } else {
          fireConfetti();
          playAchievementSound();
        }
      }
      newlyUnlocked.forEach((ach, i) => {
        setTimeout(() => {
          if (i > 0) {
            if (ach.secret) {
              fireEpicConfetti();
              playSecretAchievementSound();
            } else {
              fireConfetti();
              playAchievementSound();
            }
          }
          toast({
            title: ach.secret ? "✨ CONQUISTA SECRETA DESBLOQUEADA! ✨" : "🏆 Conquista desbloqueada!",
            description: `${ach.title} — ${ach.description}`,
            className: ach.secret
              ? "animate-scale-in border-2 border-primary bg-gradient-to-br from-yellow-500/20 via-primary/15 to-background shadow-glow"
              : "animate-scale-in border-primary bg-gradient-to-br from-primary/10 to-background",
            duration: ach.secret ? 7000 : 5000,
          });
        }, i * 1200);
      });
    }
  };

  if (blocked) {
    const isHard = difficulty === "hard";
    const isExpert = difficulty === "expert";
    const renewals = profile?.days_30_renewals_count ?? 0;
    const description = modelQuizBlocked
      ? (difficulty === "easy"
          ? "O Simulado Fácil dos Modelos exige FREE dentro dos 30 dias, plano 60 DAYS ou superior, ou liberação do administrador por 30 dias."
          : "Os Simulados Difícil e Expert dos Modelos exigem plano 90 DAYS ou superior, ou liberação do administrador por 30 dias.")
      : isExpert
      ? "O Simulado Expert (nível acadêmico) é exclusivo dos planos PREMIUM, 180 DAYS e 90 DAYS (10 dias iniciais). O administrador também pode liberar acesso temporário (24h) sob solicitação."
      : freeBlocked
        ? (isHard
            ? "Seus 15 dias gratuitos de Simulado Difícil acabaram. Faça upgrade para continuar treinando com o nível avançado."
            : "Seus 30 dias do plano FREE acabaram. Faça upgrade para continuar acessando os simulados.")
        : `O Simulado Difícil exige plano 90 DAYS, PREMIUM ou plano 30 DAYS renovado pelo menos 2 vezes (você tem ${renewals} renovação${renewals === 1 ? "" : "ões"}). Faça upgrade ou continue renovando o 30 DAYS.`;
    return (
      <Dialog open={upgradeOpen} onOpenChange={(o) => { if (!o) navigate(isFrameworkQuiz ? "/app/modelos" : "/app/estudar"); setUpgradeOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-warning" />
              {isFrameworkQuiz ? "Simulado do Modelo bloqueado" : isExpert ? "Simulado Expert bloqueado" : isHard ? "Simulado Difícil bloqueado" : "Acesso encerrado"}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => navigate(isFrameworkQuiz ? "/app/modelos" : "/app/estudar")}>
              Voltar
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground shadow-glow">
              <Link to="/app/planos">Ver planos</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-3">
        <Card className="p-6 sm:p-8 text-center space-y-4 border-primary/30 bg-primary/5">
          <div className="mx-auto w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold">Gerando Simulado</h1>
            <p className="text-sm text-muted-foreground">
              A IA está preparando no mínimo 10 questões no modo {difficulty === "expert" ? "expert" : difficulty === "hard" ? "difícil" : "fácil"}.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns instantes. Não feche esta tela.</p>
        </Card>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-3">
        <Card className="p-6 sm:p-8 space-y-5 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-bold">Falha ao gerar o simulado</h1>
              <p className="text-sm text-muted-foreground">{generationError}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateQuiz} className="gradient-primary text-primary-foreground shadow-glow">
              <RotateCcw className="mr-2 w-4 h-4" /> Tentar novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(isFrameworkQuiz ? "/app/modelos" : "/app/estudar")}>
              <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (finished) {
    const passed = difficulty === "hard" && score >= 80;
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <Card className="p-8 text-center shadow-glow">
          <Trophy className={`mx-auto w-16 h-16 mb-3 ${passed ? "text-success" : "text-primary"}`} />
          <h1 className="text-4xl font-bold mb-2">{score}<span className="text-muted-foreground text-2xl">/100</span></h1>
          <p className="text-muted-foreground">Simulado {difficulty === "hard" ? "Difícil" : "Fácil"} · {topic.length > 80 ? topic.slice(0, 80) + "…" : topic}</p>
          <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Tempo gasto: <strong className="text-foreground">{formatTime(timeSpent)}</strong>
          </p>
          {passed && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success font-medium">
              <Unlock className="w-4 h-4" /> Tema desbloqueado! Você pode estudar um novo agora.
            </div>
          )}
          {difficulty === "hard" && !passed && (
            <p className="mt-4 text-sm text-warning">Você precisa de 80+ pontos no difícil para desbloquear novo tema.</p>
          )}
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/app/estudar")}>
              <ArrowLeft className="mr-2 w-4 h-4" /> Voltar ao estudo
            </Button>
            {!passed && (
              <Button onClick={() => window.location.reload()} className="gradient-primary text-primary-foreground">
                <RotateCcw className="mr-2 w-4 h-4" /> Tentar novamente
              </Button>
            )}
            {difficulty === "easy" && (
              <Button
                onClick={() => navigate(`/app/simulado?topic=${encodeURIComponent(topic)}&difficulty=hard`)}
                className="gradient-primary text-primary-foreground shadow-glow"
              >
                <Zap className="mr-2 w-4 h-4" /> Encarar Simulado Difícil
              </Button>
            )}
          </div>
          {difficulty === "easy" && (
            <p className="text-xs text-muted-foreground mt-3">
              Pronto para o desafio? O simulado difícil libera novo tema com 80+ pts.
            </p>
          )}
        </Card>

        {(difficulty === "hard" || difficulty === "expert") && (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h2 className="font-bold">Análise de Desempenho com IA</h2>
                  <p className="text-xs text-muted-foreground">
                    Receba uma análise personalizada com pontos fortes, erros recorrentes e plano de estudo.
                  </p>
                </div>
              </div>
              {canAnalyze && analysisText && (
                <Button variant="outline" size="sm" onClick={copyAnalysis}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copiar
                </Button>
              )}
            </div>

            {!canAnalyze ? (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Disponível a partir do plano <strong>60 DAYS</strong>. Está incluso por <strong>30 dias grátis</strong> no plano FREE após o cadastro.
                  </p>
                </div>
                <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-glow">
                  <Link to="/app/planos">Fazer upgrade</Link>
                </Button>
              </div>
            ) : analysisText ? (
              <div className="whitespace-pre-line leading-relaxed text-sm space-y-3 bg-muted/30 rounded-lg p-4">
                {analysisText}
              </div>
            ) : (
              <div className="space-y-3">
                {analysisError && (
                  <p className="text-sm text-destructive">{analysisError}</p>
                )}
                <Button
                  onClick={generateAnalysis}
                  disabled={analysisLoading}
                  className="gradient-primary text-primary-foreground shadow-glow"
                >
                  {analysisLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                      Analisando…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Gerar Análise
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-bold mb-4">Gabarito comentado</h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ok = answers[i] === q.correct_index;
              return (
                <div key={i} className="border-l-4 pl-3 py-1" style={{ borderColor: ok ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
                  <p className="font-medium text-sm flex items-start gap-2">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                    <span>{i + 1}. {q.question}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sua resposta: <strong>{answers[i] >= 0 ? q.options[answers[i]] : "—"}</strong>
                  </p>
                  <p className="text-xs text-success mt-0.5">Correta: <strong>{q.options[q.correct_index]}</strong></p>
                  <p className="text-xs mt-1 italic">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers.filter((a) => a >= 0).length;

  const lowTime = timeLeft <= 60;
  const locked = lockNavigation && answers[current] >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {topic && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tema</p>
          <h1 className="text-lg font-bold text-foreground">{topic.length > 80 ? topic.slice(0, 80) + "…" : topic}</h1>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline">Questão {current + 1} de {questions.length}</Badge>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-semibold border ${lowTime ? "bg-destructive/10 text-destructive border-destructive/40 animate-pulse" : "bg-muted border-border"}`}>
          <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
        </div>
        {difficulty === "expert" ? (
          <Badge
            className="border-0 text-white"
            style={{ background: "linear-gradient(135deg, hsl(280 80% 55%), hsl(320 80% 55%))" }}
          >
            EXPERT
          </Badge>
        ) : (
          <Badge className="gradient-primary text-primary-foreground border-0">{difficulty === "hard" ? "DIFÍCIL" : "FÁCIL"}</Badge>
        )}
      </div>
      <Progress value={((current + 1) / questions.length) * 100} />

      {lockNavigation && (
        <p className="text-xs text-warning flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Modo difícil: você não pode voltar nem alterar respostas.
        </p>
      )}

      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Vale {q.points} pts</p>
        <h2 className="text-lg font-medium mb-5">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[current] === i;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                disabled={locked && !selected}
                className={`w-full text-left p-3 rounded-md border transition-all ${
                  selected
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                } ${locked && !selected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          disabled={current === 0 || lockNavigation}
          onClick={() => setCurrent(current - 1)}
        >
          Anterior
        </Button>
        {current < questions.length - 1 ? (
          <Button
            onClick={() => setCurrent(current + 1)}
            disabled={lockNavigation && answers[current] < 0}
            className="gradient-primary text-primary-foreground"
          >
            Próxima
          </Button>
        ) : (
          <Button onClick={submit} disabled={answered < questions.length} className="gradient-primary text-primary-foreground shadow-glow">
            Finalizar simulado
          </Button>
        )}
      </div>
      <p className="text-xs text-center text-muted-foreground">{answered}/{questions.length} respondidas</p>
    </div>
  );
}
