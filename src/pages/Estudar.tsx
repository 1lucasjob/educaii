import { useState, useEffect, useRef } from "react";
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
import { Lock, Unlock, Brain, Sparkles, Target, Zap, Award, Quote, Copy, Check, RotateCcw, Trash2, Clock, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { computeFreeTrial, expertActive, highlightsActive } from "@/lib/freeTrial";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getResumableQuiz, getResumableQuizMerged, clearQuiz, type SavedQuiz } from "@/lib/quizPersistence";
import { getFrameworkById, topicMatchesFrameworkTemplate, type Framework } from "@/lib/studyFrameworks";

const FROM_FRAMEWORK_KEY = "estudar:from-framework";

function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)\n]|$)/g, "$1$2")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function Estudar() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [hardUnlocked, setHardUnlocked] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(profile?.current_topic ?? null);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [resumable, setResumable] = useState<SavedQuiz | null>(null);
  const [fromFramework, setFromFramework] = useState<boolean>(() => {
    try { return sessionStorage.getItem(FROM_FRAMEWORK_KEY) === "1"; } catch { return false; }
  });
  const topicRef = useRef<HTMLTextAreaElement>(null);

  const enableFrameworkBypass = () => {
    setFromFramework(true);
    try { sessionStorage.setItem(FROM_FRAMEWORK_KEY, "1"); } catch {}
  };
  const disableFrameworkBypass = () => {
    setFromFramework(false);
    try { sessionStorage.removeItem(FROM_FRAMEWORK_KEY); } catch {}
  };

  // Limpa o bypass quando o usuário edita o tema e ele deixa de bater com um template de framework
  useEffect(() => {
    if (!fromFramework) return;
    if (topic && !topicMatchesFrameworkTemplate(topic)) {
      disableFrameworkBypass();
    }
  }, [topic, fromFramework]);

  // Limpa o bypass ao desmontar a página
  useEffect(() => {
    return () => {
      try { sessionStorage.removeItem(FROM_FRAMEWORK_KEY); } catch {}
    };
  }, []);

  const handlePickFramework = (fw: Framework) => {
    console.log("[FrameworkPicker] picked:", fw.id);
    setTitle((prev) => (prev.trim() ? prev : fw.titleSuggestion));
    setTopic(fw.template);
    toast({
      title: `Modelo ${fw.label} carregado`,
      description: "Preencha os campos e clique em Gerar Estudo.",
    });
    setTimeout(() => {
      const el = topicRef.current;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
        // Posiciona o cursor no fim do texto inserido
        try {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        } catch {}
      }
    }, 120);
  };

  // Auto-aplica template ao chegar com ?framework=5w2h|swot
  useEffect(() => {
    const fwId = searchParams.get("framework");
    if (!fwId) return;
    const fw = getFrameworkById(fwId);
    if (!fw) return;
    handlePickFramework(fw);
    enableFrameworkBypass();
    const next = new URLSearchParams(searchParams);
    next.delete("framework");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Cada chamada de refresh recebe um id crescente; só o mais recente pode aplicar.
    let refreshSeq = 0;
    // savedAt do resumable atualmente exibido — evita que uma resposta tardia
    // (do banco ou do local) sobrescreva um resume mais novo já aplicado.
    let appliedSavedAt = 0;

    const apply = (next: SavedQuiz | null, mySeq: number) => {
      if (cancelled || mySeq !== refreshSeq) return;
      const nextSavedAt = next?.savedAt ?? 0;
      // Só aplica se for mais recente OU se for null (limpeza explícita do mais recente).
      if (next === null) {
        if (appliedSavedAt === 0) setResumable(null);
        return;
      }
      if (nextSavedAt >= appliedSavedAt) {
        appliedSavedAt = nextSavedAt;
        setResumable(next);
      }
    };

    const refresh = async () => {
      const mySeq = ++refreshSeq;
      appliedSavedAt = 0;
      // Local imediato
      apply(getResumableQuiz(profile?.id), mySeq);
      // Hidrata do banco (pode ser mais recente em outro dispositivo)
      const merged = await getResumableQuizMerged(profile?.id);
      apply(merged, mySeq);
    };
    refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [profile?.id]);

  const handleResume = () => {
    if (!resumable) return;
    navigate(
      `/app/simulado?topic=${encodeURIComponent(resumable.topic)}&difficulty=${resumable.difficulty}&resume=1`,
    );
  };

  const handleDiscardResumable = () => {
    clearQuiz(profile?.id);
    setResumable(null);
  };

  const formatResumeTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const trial = computeFreeTrial({ plan: profile?.plan, createdAt: profile?.created_at });
  const freeExpiredRaw = trial.isFree && !trial.freeBaseActive && !isAdmin;
  const freeExpired = freeExpiredRaw && !fromFramework;
  const unlocked = isAdmin || fromFramework || ((profile?.current_topic_unlocked ?? true) && !freeExpiredRaw);
  const lastScore = profile?.last_score ?? 0;

  const MIN_CHARS_EASY = 500;
  const MIN_CHARS_HARD = 1501;
  const MIN_CHARS_EXPERT = 5000;
  const TITLE_MIN = 5;
  const TITLE_MAX = 80;
  const topicLength = topic.trim().length;
  const titleLength = title.trim().length;
  const meetsEasy = topicLength >= MIN_CHARS_EASY;
  const meetsHard = topicLength >= MIN_CHARS_HARD || isAdmin;
  const meetsExpert = topicLength >= MIN_CHARS_EXPERT || isAdmin;
  const titleValid = titleLength >= TITLE_MIN && titleLength <= TITLE_MAX;
  const userHasExpertAccess = expertActive({ plan: profile?.plan, expertUnlockedUntil: profile?.expert_unlocked_until, isAdmin }) || fromFramework;
  const canExtractHighlights = highlightsActive({ plan: profile?.plan, highlightsUnlockedUntil: profile?.highlights_unlocked_until, isAdmin }) || fromFramework;
  const highlightsViaAdmin =
    !isAdmin &&
    !fromFramework &&
    canExtractHighlights &&
    !!profile?.highlights_unlocked_until &&
    !["days_60", "days_90", "days_180", "premium"].includes(profile?.plan ?? "");
  const adminDaysLeft = profile?.highlights_unlocked_until
    ? Math.max(0, Math.ceil((new Date(profile.highlights_unlocked_until).getTime() - Date.now()) / 86_400_000))
    : 0;

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
    const { data, error } = await supabase.functions.invoke("generate-summary", { body: { topic, title: cleanTitle, from_framework: fromFramework } });
    setLoadingSummary(false);
    if (error || data?.error) {
      toast({ title: "Erro ao gerar resumo", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setSummary(data.summary);
    setHardUnlocked(isHard);
    setSourceText(topic);
    setHighlights([]);

    setActiveTopic(cleanTitle);
    // Persistir corpo do tema para uso pelo Simulado (Hard/Expert ancorado no texto)
    try {
      localStorage.setItem(`study_body:${cleanTitle}`, topic);
    } catch {}
    if (profile) {
      await supabase.from("study_sessions").insert({ user_id: profile.id, topic: `${cleanTitle}\n\n${topic}`, summary: data.summary });
      await supabase.from("profiles").update({ current_topic: cleanTitle, current_topic_unlocked: false, last_score: 0 }).eq("id", profile.id);
      await refreshProfile();
    }
    setTitle("");
    setTopic("");
  };

  const extractHighlights = async () => {
    if (!sourceText) return;
    setLoadingHighlights(true);
    const { data, error } = await supabase.functions.invoke("extract-highlights", {
      body: { topic: sourceText, title: activeTopic ?? "", count: 6 },
    });
    setLoadingHighlights(false);
    if (error || data?.error) {
      toast({ title: "Erro ao extrair trechos", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setHighlights(Array.isArray(data?.highlights) ? data.highlights : []);
  };

  const copyHighlight = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 1500);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const startQuiz = (difficulty: "easy" | "hard" | "expert") => {
    if (!activeTopic) return;
    navigate(`/app/simulado?topic=${encodeURIComponent(activeTopic)}&difficulty=${difficulty}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Brain className="text-primary shrink-0" /> Módulo de Estudos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Tema único por vez — desbloqueado ao dominar o difícil ≥ 80 pts.</p>
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

      {resumable && (
        <Card className="p-5 border-2 border-primary shadow-glow animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 animate-pulse-glow">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold">Simulado em andamento</h3>
                {resumable.difficulty === "expert" ? (
                  <Badge
                    className="border-0 text-white"
                    style={{ background: "linear-gradient(135deg, hsl(280 80% 55%), hsl(320 80% 55%))" }}
                  >
                    EXPERT
                  </Badge>
                ) : (
                  <Badge className="gradient-primary text-primary-foreground border-0">
                    {resumable.difficulty === "hard" ? "DIFÍCIL" : "FÁCIL"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                Tema: <span className="text-foreground font-medium">{resumable.topic}</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                <span>
                  Questão <strong className="text-foreground">{Math.min(resumable.current + 1, resumable.questions.length)}/{resumable.questions.length}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tempo restante:{" "}
                  <strong className="text-foreground">{formatResumeTime(resumable.timeLeft)}</strong>
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleResume}
                  className="gradient-primary text-primary-foreground shadow-glow"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Retomar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDiscardResumable}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Descartar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {unlocked && !summary && (
        <div className="text-sm text-muted-foreground">
          <Link to="/app/modelos" className="text-primary underline underline-offset-2 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Conheça os Modelos de Estudo (5W2H, SWOT)
          </Link>
        </div>
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
              ref={topicRef}
              id="study-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!unlocked || loadingSummary}
              placeholder={unlocked ? "Descreva o tema que quer estudar (NR, contexto, riscos, medidas…). 500+ libera Fácil; 1501+ libera Difícil; 5000+ libera Expert (Premium / 90 DAYS ou liberação ADM)." : "Conclua o simulado difícil para liberar."}
              className="min-h-32"
            />
            <div className="flex items-center justify-between text-xs gap-3">
              <span style={meetsExpert ? { color: "hsl(280 80% 65%)" } : undefined} className={meetsExpert ? "" : meetsHard ? "text-success" : meetsEasy ? "text-primary" : "text-muted-foreground"}>
                {meetsExpert
                  ? `${topicLength}/${MIN_CHARS_EXPERT} ✓ libera Fácil + Difícil + Expert`
                  : meetsHard
                    ? `${topicLength}/${MIN_CHARS_EXPERT} ✓ libera Fácil + Difícil`
                    : meetsEasy
                      ? `${topicLength}/${MIN_CHARS_HARD} ✓ libera Simulado Fácil`
                      : `${topicLength}/${MIN_CHARS_EASY} (mínimo para gerar)`}
              </span>
              <Progress value={Math.min(100, (topicLength / MIN_CHARS_EXPERT) * 100)} className="w-24 h-1.5" />
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
          <div className="max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground space-y-1">
            {stripMarkdown(summary)}
          </div>

          <div className={`grid ${hardUnlocked && userHasExpertAccess ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 mt-6`}>
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
                  <p className="text-xs opacity-80">Baseado no texto · libera tema (≥80)</p>
                </div>
              </Button>
            ) : (
              <Button disabled className="h-14" variant="outline" title="Escreva 1501+ caracteres para liberar o Simulado Difícil">
                <Lock className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Difícil</p>
                  <p className="text-xs text-muted-foreground">Escreva 1501+ caracteres</p>
                </div>
              </Button>
            )}
            {hardUnlocked && userHasExpertAccess && (
              <Button
                onClick={() => startQuiz("expert")}
                className="h-14 text-white shadow-glow border-0"
                style={{ background: "linear-gradient(135deg, hsl(280 80% 55%), hsl(320 80% 55%))" }}
                title="Simulado Expert — nível acadêmico"
              >
                <Award className="mr-2" />
                <div className="text-left">
                  <p className="font-bold">Simulado Expert</p>
                  <p className="text-xs opacity-80">Nível acadêmico · 20 min</p>
                </div>
              </Button>
            )}
          </div>
        </Card>
      )}

      {summary && sourceText && canExtractHighlights && (
        <Card className="p-6 animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Quote className="text-primary" /> Trechos-Chave (Pegar Nota)
            </h3>
            <Button
              onClick={extractHighlights}
              disabled={loadingHighlights}
              size="sm"
              variant={highlights.length ? "outline" : "default"}
              className={highlights.length ? "" : "gradient-primary text-primary-foreground"}
            >
              {loadingHighlights ? "Extraindo…" : highlights.length ? "Extrair novamente" : "Extrair trechos"}
            </Button>
          </div>
          {highlightsViaAdmin && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 mb-3">
              <ShieldCheck className="w-3 h-3" />
              Liberado pelo admin · expira em {adminDaysLeft} dia(s)
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-4">
            Trechos extraídos diretamente do seu texto, sem modificações.
          </p>

          {highlights.length === 0 && !loadingHighlights && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Clique em <strong>Extrair trechos</strong> para identificar os pontos mais importantes do texto que você colou.
            </p>
          )}

          {highlights.length > 0 && (
            <div className="space-y-3">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-md bg-muted/40 border border-border p-3 flex items-start gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-1">
                    {i + 1}/{highlights.length}
                  </span>
                  <blockquote className="flex-1 border-l-2 border-primary pl-3 italic text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {h}
                  </blockquote>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyHighlight(h, i)}
                    className="shrink-0 h-7 px-2 text-xs"
                    title="Copiar trecho"
                  >
                    {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {summary && sourceText && !canExtractHighlights && (
        <Card className="p-6 border-2 border-dashed border-muted-foreground/30 bg-muted/20 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold flex items-center gap-2 flex-wrap">
                <Quote className="w-5 h-5 text-muted-foreground" /> Trechos-Chave (Pegar Nota)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Disponível a partir do plano <strong className="text-foreground">60 DAYS</strong>. O administrador também pode liberar por 30 dias para o seu cadastro.
              </p>
              <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-glow mt-3">
                <Link to="/app/planos">
                  <Sparkles className="w-4 h-4 mr-1.5" /> Ver planos
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
