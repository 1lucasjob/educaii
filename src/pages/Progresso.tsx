import { useEffect, useMemo, useState } from "react";
import LoyaltyProgram from "@/components/LoyaltyProgram";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trophy, TrendingUp, Target, Award, Clock, ShieldCheck, ShieldOff, FlaskConical, Sparkles } from "lucide-react";
import { computeAchievements } from "@/lib/achievements";
import { AchievementsGrid } from "@/components/AchievementsGrid";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";

interface Attempt {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  created_at: string;
  time_spent_seconds: number;
  counts_for_ranking: boolean;
}

const formatDuration = (s: number) => {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
};

export default function Progresso() {
  const { user, isAdmin, profile } = useAuth();
  const { enabled: demoEnabled, fakeAttempts, viewAsRow } = useDemoMode();
  const [realAttempts, setRealAttempts] = useState<Attempt[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("quiz_attempts")
      .select("id,topic,difficulty,score,created_at,time_spent_seconds,counts_for_ranking")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setRealAttempts((data as Attempt[]) ?? []));
  }, [user]);

  const attempts = useMemo<Attempt[]>(() => {
    if (demoEnabled && viewAsRow) {
      return viewAsRow.attempts_data
        .map((a, i) => ({
          id: `view-${i}`,
          topic: a.topic,
          difficulty: a.difficulty,
          score: a.score,
          created_at: a.created_at,
          time_spent_seconds: a.time_spent_seconds ?? 0,
          counts_for_ranking: (a.time_spent_seconds ?? 0) >= 120,
        }))
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    }
    if (demoEnabled) {
      return [...realAttempts, ...(fakeAttempts as Attempt[])].sort(
        (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      );
    }
    return realAttempts;
  }, [demoEnabled, realAttempts, fakeAttempts, viewAsRow]);

  const total = attempts.length;
  const avg = total ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / total) : 0;
  const best = total ? Math.max(...attempts.map((a) => a.score)) : 0;
  const passed = attempts.filter((a) => a.difficulty === "hard" && a.score >= 80).length;
  const totalTime = attempts.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0);
  const avgTime = total ? Math.round(totalTime / total) : 0;
  const achievements = useMemo(() => computeAchievements(attempts), [attempts]);
  const normalAchievements = useMemo(() => achievements.filter((a) => !a.secret), [achievements]);
  const secretAchievements = useMemo(() => achievements.filter((a) => !!a.secret), [achievements]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const unlockedSecretCount = secretAchievements.filter((a) => a.unlocked).length;
  const showSecretSection = isAdmin || unlockedSecretCount > 0;

  const evolutionData = useMemo(
    () =>
      attempts.map((a, i) => ({
        idx: i + 1,
        label: new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        score: a.score,
        difficulty: a.difficulty,
      })),
    [attempts],
  );

  const timeData = useMemo(() => {
    let sum = 0;
    return attempts
      .filter((a) => (a.time_spent_seconds ?? 0) > 0)
      .map((a, i) => {
        const minutes = +(a.time_spent_seconds / 60).toFixed(2);
        sum += minutes;
        return {
          label: new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          tempo: minutes,
          media: +(sum / (i + 1)).toFixed(2),
        };
      });
  }, [attempts]);

  const byTopic = useMemo(() => {
    const map = new Map<string, { topic: string; total: number; sum: number }>();
    attempts.forEach((a) => {
      const cur = map.get(a.topic) ?? { topic: a.topic, total: 0, sum: 0 };
      cur.total += 1;
      cur.sum += a.score;
      map.set(a.topic, cur);
    });
    return Array.from(map.values())
      .map((t) => ({ topic: t.topic.length > 18 ? t.topic.slice(0, 18) + "…" : t.topic, media: Math.round(t.sum / t.total) }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 6);
  }, [attempts]);

  const chartConfig = {
    score: { label: "Pontuação", color: "hsl(var(--primary))" },
    media: { label: "Média (min)", color: "hsl(var(--primary))" },
    tempo: { label: "Tempo (min)", color: "hsl(var(--muted-foreground))" },
  };

  const reversed = [...attempts].reverse();

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 min-w-0">
      <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
        <BarChart3 className="text-primary shrink-0 w-6 h-6 sm:w-8 sm:h-8" />
        <span className="truncate">{viewAsRow ? `Progresso de ${viewAsRow.display_name}` : "Meu Progresso"}</span>
      </h1>
      {demoEnabled && (
        <Card className="p-3 border-primary/40 bg-primary/5 flex items-center gap-2 text-sm">
          <FlaskConical className="w-4 h-4 text-primary shrink-0" />
          {viewAsRow ? (
            <span>
              <strong>Vendo como aluno fictício:</strong> {viewAsRow.display_name} — todos os dados abaixo são deste aluno demo.
            </span>
          ) : (
            <span><strong>Modo de teste ativo</strong> — simulados fictícios incluídos para visualização.</span>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground">Simulados</p>
          <p className="text-2xl sm:text-3xl font-bold">{total}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground">Média</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary">{avg}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Trophy className="w-3 h-3" /> Melhor</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary">{best}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Aprovações</p>
          <p className="text-2xl sm:text-3xl font-bold">{passed}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo total</p>
          <p className="text-lg sm:text-2xl font-bold break-words">{formatDuration(totalTime)}</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo médio</p>
          <p className="text-lg sm:text-2xl font-bold break-words">{formatDuration(avgTime)}</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
            <Award className="w-4 h-4 text-primary" /> Conquistas
          </h2>
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
            {unlockedCount}/{achievements.length} desbloqueadas
          </span>
        </div>
        <AchievementsGrid items={normalAchievements} revealSecrets={isAdmin} isOwner={true} />
      </Card>

      {showSecretSection && (
        <Card className="p-4 sm:p-6 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-primary" /> Conquistas Secretas
              {isAdmin && (
                <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                  Visível só para admin
                </Badge>
              )}
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
              {unlockedSecretCount}/{secretAchievements.length} reveladas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Conquistas raras e desafiadoras — algumas exigem maestria, velocidade ou persistência fora do comum.
          </p>
          <AchievementsGrid items={secretAchievements} revealSecrets={isAdmin} />
        </Card>
      )}

      {profile?.created_at && !viewAsRow && (
        <LoyaltyProgram startDate={profile.created_at} />
      )}

      <Card className="p-4 sm:p-6">
        <h2 className="font-bold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Evolução das pontuações</h2>
        <p className="text-xs text-muted-foreground mb-4">Linha de meta em 80 pontos (aprovação no difícil)</p>
        {evolutionData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhum dado para exibir ainda.</p>
        ) : (
          <div className="w-full min-w-0 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[220px] sm:h-[260px] w-full">
            <LineChart data={evolutionData} margin={{ left: 4, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={80} stroke="hsl(var(--primary))" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-bold mb-4">Média por tema</h2>
        {byTopic.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhum tema avaliado ainda.</p>
        ) : (
          <div className="w-full min-w-0 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[240px] sm:h-[260px] w-full">
            <BarChart data={byTopic} margin={{ left: 4, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="topic" tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} fontSize={10} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="media" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-bold mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Evolução do tempo por simulado</h2>
        <p className="text-xs text-muted-foreground mb-4">Tempo gasto em cada simulado e média acumulada (em minutos)</p>
        {timeData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Sem dados de tempo registrados ainda.</p>
        ) : (
          <div className="w-full min-w-0 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[220px] sm:h-[260px] w-full">
            <LineChart data={timeData} margin={{ left: 4, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="tempo" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-bold mb-4">Histórico</h2>
        {(() => {
          const totalPages = Math.max(1, Math.ceil(reversed.length / PAGE_SIZE));
          const currentPage = Math.min(historyPage, totalPages);
          const start = (currentPage - 1) * PAGE_SIZE;
          const pageItems = reversed.slice(start, start + PAGE_SIZE);
          return (
            <>
              <div className="space-y-2">
                {pageItems.map((a) => {
                  const counts = a.counts_for_ranking !== false && (a.time_spent_seconds ?? 0) >= 120;
                  const reason =
                    (a.time_spent_seconds ?? 0) < 120
                      ? "Tempo abaixo de 2 min"
                      : a.counts_for_ranking === false
                      ? "Limite diário ou regra anti-burla"
                      : "";
                  return (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 sm:p-3 rounded-md bg-muted">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 sm:block">
                          <p className="font-medium truncate text-sm sm:text-base">{a.topic}</p>
                          <span className="font-bold flex items-center gap-1 text-sm sm:hidden shrink-0">
                            <Trophy className="w-3.5 h-3.5 text-primary" /> {a.score}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                          <span>{new Date(a.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(a.time_spent_seconds ?? 0)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap sm:justify-end">
                        <Badge
                          variant="outline"
                          title={counts ? "Conta no ranking" : reason}
                          className={
                            "gap-1 text-[10px] sm:text-xs px-1.5 py-0 h-5 " +
                            (counts
                              ? "border-success/40 text-success bg-success/10"
                              : "border-muted-foreground/30 text-muted-foreground")
                          }
                        >
                          {counts ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                          <span className="hidden sm:inline">{counts ? "Ranking" : "Sem ranking"}</span>
                        </Badge>
                        <Badge
                          variant={a.difficulty === "hard" ? "default" : "outline"}
                          className={
                            "text-[10px] sm:text-xs px-1.5 py-0 h-5 " +
                            (a.difficulty === "hard" ? "gradient-primary text-primary-foreground border-0" : "")
                          }
                        >
                          {a.difficulty === "hard" ? "Difícil" : "Fácil"}
                        </Badge>
                        <span className="font-bold hidden sm:flex items-center gap-1 ml-auto sm:ml-0">
                          <Trophy className="w-4 h-4 text-primary" /> {a.score}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {attempts.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Nenhum simulado ainda.</p>}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </Card>
    </div>
  );
}
