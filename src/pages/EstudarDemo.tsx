import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Sparkles,
  Target,
  Zap,
  FlaskConical,
  ArrowLeft,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

type Phase = "input" | "summary" | "quiz" | "result";

export default function EstudarDemo() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "hard">("easy");
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Timer only during quiz phase
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  if (authLoading) return <div className="text-center text-muted-foreground py-20">Carregando…</div>;
  if (!isAdmin) return <Navigate to="/app/estudar" replace />;

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const generateSummary = async () => {
    if (topic.trim().length < 30) {
      toast({
        title: "Descreva melhor o tema",
        description: "No demo basta um texto curto (30+ caracteres) — não é salvo no banco.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setSummary(null);
    const { data, error } = await supabase.functions.invoke("generate-summary", { body: { topic } });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erro ao gerar resumo", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setSummary(data.summary);
    setPhase("summary");
  };

  const startQuiz = async (diff: "easy" | "hard") => {
    setDifficulty(diff);
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-quiz", {
      body: { topic, difficulty: diff },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erro ao gerar simulado", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setQuestions(data.questions);
    setAnswers(new Array(data.questions.length).fill(-1));
    setCurrent(0);
    setScore(0);
    setTimeSpent(0);
    setPhase("quiz");
  };

  const select = (idx: number) => {
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    if (difficulty === "hard" && current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 300);
    }
  };

  const finish = () => {
    let total = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) total += q.points;
    });
    setScore(total);
    setPhase("result");
  };

  const reset = () => {
    setTopic("");
    setSummary(null);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setScore(0);
    setTimeSpent(0);
    setPhase("input");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="text-primary" /> Demo de Estudo
          </h1>
          <p className="text-muted-foreground mt-1">
            Experimente resumos e simulados sem salvar nada no banco. Visível só para admins.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary gap-1">
          <Sparkles className="w-3 h-3" /> Modo demo
        </Badge>
      </div>

      <Card className="p-3 border-primary/30 bg-primary/5 text-xs text-muted-foreground flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary shrink-0" />
        Tudo acontece em memória: nenhum estudo, simulado, conquista ou pontuação é gravado.
      </Card>

      {phase === "input" && (
        <Card className="p-6 shadow-glow space-y-3">
          <label className="text-sm font-medium">Tema para testar</label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            placeholder="Ex.: NR-35 Trabalho em altura — riscos, ancoragem, EPIs e medidas de proteção."
            className="min-h-28"
          />
          <p className="text-xs text-muted-foreground">{topic.trim().length} caracteres</p>
          <Button
            onClick={generateSummary}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground shadow-glow"
          >
            {loading ? "Gerando resumo…" : (<><Sparkles className="mr-2" /> Gerar resumo demo</>)}
          </Button>
        </Card>
      )}

      {phase === "summary" && summary && (
        <>
          <Card className="p-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Brain className="text-primary" /> Resumo Técnico (demo)
            </h3>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {summary}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <Button
                onClick={() => startQuiz("easy")}
                disabled={loading}
                variant="outline"
                className="border-primary/40 hover:bg-primary/10 h-14"
              >
                <Target className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Fácil</p>
                  <p className="text-xs text-muted-foreground">Demo · sem salvar</p>
                </div>
              </Button>
              <Button
                onClick={() => startQuiz("hard")}
                disabled={loading}
                className="gradient-primary text-primary-foreground h-14 shadow-glow"
              >
                <Zap className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Difícil</p>
                  <p className="text-xs opacity-80">Demo · sem salvar</p>
                </div>
              </Button>
            </div>
            {loading && <p className="text-xs text-muted-foreground mt-3 text-center">Gerando simulado…</p>}
          </Card>

          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <ArrowLeft className="w-3 h-3" /> Testar outro tema
          </Button>
        </>
      )}

      {phase === "quiz" && questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline">Questão {current + 1} de {questions.length}</Badge>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-semibold border bg-muted border-border">
              <Clock className="w-4 h-4" /> {formatTime(timeSpent)}
            </div>
            <Badge className="gradient-primary text-primary-foreground border-0">
              {difficulty === "hard" ? "DIFÍCIL" : "FÁCIL"} · DEMO
            </Badge>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} />

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Vale {questions[current].points} pts</p>
            <h2 className="text-lg font-medium mb-5">{questions[current].question}</h2>
            <div className="space-y-2">
              {questions[current].options.map((opt, i) => {
                const selected = answers[current] === i;
                return (
                  <button
                    key={i}
                    onClick={() => select(i)}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      selected
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
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
              disabled={current === 0 || difficulty === "hard"}
              onClick={() => setCurrent(current - 1)}
            >
              Anterior
            </Button>
            {current < questions.length - 1 ? (
              <Button
                onClick={() => setCurrent(current + 1)}
                disabled={difficulty === "hard" && answers[current] < 0}
                className="gradient-primary text-primary-foreground"
              >
                Próxima
              </Button>
            ) : (
              <Button
                onClick={finish}
                disabled={answers.filter((a) => a >= 0).length < questions.length}
                className="gradient-primary text-primary-foreground shadow-glow"
              >
                Finalizar (demo)
              </Button>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {answers.filter((a) => a >= 0).length}/{questions.length} respondidas · nada será salvo
          </p>
        </div>
      )}

      {phase === "result" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-8 text-center shadow-glow">
            <Trophy className="mx-auto w-16 h-16 mb-3 text-primary" />
            <h1 className="text-4xl font-bold mb-2">
              {score}<span className="text-muted-foreground text-2xl">/100</span>
            </h1>
            <p className="text-muted-foreground">
              Simulado {difficulty === "hard" ? "Difícil" : "Fácil"} · DEMO
            </p>
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Tempo: <strong className="text-foreground">{formatTime(timeSpent)}</strong>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Resultado <strong>não foi salvo</strong> — modo de demonstração.
            </p>
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              <Button variant="outline" onClick={() => setPhase("summary")}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Voltar ao resumo
              </Button>
              <Button onClick={reset} className="gradient-primary text-primary-foreground">
                <RotateCcw className="mr-2 w-4 h-4" /> Novo tema
              </Button>
              <Button variant="ghost" onClick={() => navigate("/app/admin")}>
                Ir para Admin
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-bold mb-4">Gabarito comentado</h2>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const ok = answers[i] === q.correct_index;
                return (
                  <div
                    key={i}
                    className="border-l-4 pl-3 py-1"
                    style={{ borderColor: ok ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
                  >
                    <p className="font-medium text-sm flex items-start gap-2">
                      {ok ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <span>{i + 1}. {q.question}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua resposta: <strong>{answers[i] >= 0 ? q.options[answers[i]] : "—"}</strong>
                    </p>
                    <p className="text-xs text-success mt-0.5">
                      Correta: <strong>{q.options[q.correct_index]}</strong>
                    </p>
                    <p className="text-xs mt-1 italic">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
