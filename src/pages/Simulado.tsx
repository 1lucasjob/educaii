import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Unlock, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";

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
  const difficulty = (params.get("difficulty") as "easy" | "hard") ?? "easy";
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const TIME_LIMIT = difficulty === "hard" ? 10 * 60 : 15 * 60; // seconds
  const lockNavigation = difficulty === "hard";

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.functions.invoke("generate-quiz", { body: { topic, difficulty } });
      if (error || data?.error) {
        toast({ title: "Erro ao gerar simulado", description: data?.error ?? error?.message, variant: "destructive" });
        navigate("/app/estudar");
        return;
      }
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (loading || finished) return;
    if (timeLeft <= 0) {
      toast({ title: "Tempo esgotado!", description: "Seu simulado foi finalizado automaticamente.", variant: "destructive" });
      submit();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
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

    if (profile) {
      await supabase.from("quiz_attempts").insert({
        user_id: profile.id,
        topic,
        difficulty,
        score: total,
        total_points: 100,
        questions: questions as any,
        answers: answers as any,
      });

      const updates: { last_score: number; current_topic_unlocked?: boolean } = { last_score: total };
      if (difficulty === "hard" && total >= 80) {
        updates.current_topic_unlocked = true;
      }
      await supabase.from("profiles").update(updates).eq("id", profile.id);
      await refreshProfile();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="inline-block w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-muted-foreground">Gerando simulado {difficulty === "hard" ? "difícil" : "fácil"}…</p>
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
          <p className="text-muted-foreground">Simulado {difficulty === "hard" ? "Difícil" : "Fácil"} · {topic}</p>
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
          </div>
        </Card>

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Questão {current + 1} de {questions.length}</Badge>
        <Badge className="gradient-primary text-primary-foreground border-0">{difficulty === "hard" ? "DIFÍCIL" : "FÁCIL"}</Badge>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} />

      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Vale {q.points} pts</p>
        <h2 className="text-lg font-medium mb-5">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className={`w-full text-left p-3 rounded-md border transition-all ${
                answers[current] === i
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border hover:border-primary/50 hover:bg-muted"
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Anterior</Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(current + 1)} className="gradient-primary text-primary-foreground">Próxima</Button>
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
