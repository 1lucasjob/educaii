import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Medal, Award, Crown, EyeOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { computeAchievements, AttemptLite } from "@/lib/achievements";
import { AchievementsGrid } from "@/components/AchievementsGrid";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { FlaskConical } from "lucide-react";

interface Row {
  user_id: string;
  display_name: string;
  total_score: number;
  hard_passed: number;
  attempts: number;
  avg_score: number;
  composite_score: number;
  attempts_data: AttemptLite[];
}

type Period = "week" | "month" | "all";

const PERIOD_LABEL: Record<Period, string> = {
  week: "Últimos 7 dias",
  month: "Últimos 30 dias",
  all: "Geral",
};

const rankIcon = (i: number) => {
  if (i === 0) return <Crown className="w-5 h-5 text-primary" />;
  if (i === 1) return <Medal className="w-5 h-5 text-foreground/70" />;
  if (i === 2) return <Award className="w-5 h-5 text-primary/60" />;
  return <span className="w-5 inline-block text-center text-xs text-muted-foreground font-mono">{i + 1}</span>;
};

const cutoffFor = (p: Period): number | null => {
  if (p === "all") return null;
  const days = p === "week" ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
};

export default function Ranking() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("get_leaderboard").then(({ data }) => {
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    });
  }, []);

  const ranked = useMemo(() => {
    const cutoff = cutoffFor(period);
    return rows
      .map((r) => {
        const list = (Array.isArray(r.attempts_data) ? r.attempts_data : []).filter(
          (a) => cutoff === null || +new Date(a.created_at) >= cutoff,
        );
        const attempts = list.length;
        if (attempts === 0) return null;
        const total_score = list.reduce((s, a) => s + a.score, 0);
        const hard_passed = list.filter((a) => a.difficulty === "hard" && a.score >= 80).length;
        const avg = list.reduce((s, a) => s + a.score, 0) / attempts;
        const composite_score = hard_passed * 10 + avg;
        const unlocked = computeAchievements(list).filter((a) => a.unlocked).length;
        return {
          user_id: r.user_id,
          display_name: r.display_name,
          attempts,
          total_score,
          hard_passed,
          avg_score: +avg.toFixed(1),
          composite_score,
          unlocked,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.composite_score - a.composite_score || b.total_score - a.total_score);
  }, [rows, period]);

  const totalAchievements = computeAchievements([]).length;
  const myIndex = ranked.findIndex((r) => r.user_id === user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Trophy className="text-primary" /> Ranking
      </h1>
      <p className="text-sm text-muted-foreground">
        Alunos ordenados pelo score composto: <strong>aprovações no difícil × 10 + média de pontos</strong>.
      </p>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="week">Semanal</TabsTrigger>
          <TabsTrigger value="month">Mensal</TabsTrigger>
          <TabsTrigger value="all">Geral</TabsTrigger>
        </TabsList>
      </Tabs>

      {profile && !profile.show_in_ranking && (
        <Card className="p-4 border-warning/40 bg-warning/5 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Você está oculto do ranking</p>
            <p className="text-muted-foreground">
              Ative em{" "}
              <Link to="/app/configuracoes" className="text-primary underline underline-offset-2">
                Configurações
              </Link>{" "}
              para participar.
            </p>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
          Período: <strong className="text-foreground">{PERIOD_LABEL[period]}</strong> · {ranked.length} alunos
        </div>
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando ranking…</p>
        ) : ranked.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Nenhum simulado no período selecionado.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {ranked.map((r, i) => {
              const isMe = r.user_id === user?.id;
              return (
                <button
                  key={r.user_id}
                  onClick={() => setSelectedId(r.user_id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${
                    isMe ? "bg-primary/10 border-l-4 border-primary" : i < 3 ? "bg-muted/40" : ""
                  }`}
                >
                  <div className="w-8 flex justify-center">{rankIcon(i)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {r.display_name}
                      {isMe && <Badge variant="outline" className="ml-2 text-xs">Você</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.attempts} simulados · {r.hard_passed} aprovações · média {r.avg_score}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary leading-tight">{Math.round(r.composite_score)}</p>
                    <p className="text-[10px] text-muted-foreground">{r.total_score} pts</p>
                    <Badge variant="outline" className="mt-1 gap-1 px-1.5 py-0 text-[10px]">
                      <Sparkles className="w-2.5 h-2.5 text-primary" />
                      {r.unlocked}/{totalAchievements}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {myIndex >= 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Sua posição em <strong>{PERIOD_LABEL[period]}</strong>:{" "}
          <strong className="text-primary">#{myIndex + 1}</strong> de {ranked.length}
        </p>
      )}

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {(() => {
            const sel = ranked.find((r) => r.user_id === selectedId);
            if (!sel) return null;
            const cutoff = cutoffFor(period);
            const list = (rows.find((r) => r.user_id === selectedId)?.attempts_data ?? []).filter(
              (a) => cutoff === null || +new Date(a.created_at) >= cutoff,
            );
            const ach = computeAchievements(list);
            const unlockedCount = ach.filter((a) => a.unlocked).length;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    {sel.display_name}
                    {sel.user_id === user?.id && <Badge variant="outline" className="text-xs">Você</Badge>}
                  </DialogTitle>
                  <DialogDescription>
                    {PERIOD_LABEL[period]} · {sel.attempts} simulados · {sel.hard_passed} aprovações no difícil ·
                    média {sel.avg_score} · score {Math.round(sel.composite_score)}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-between mb-3 mt-2">
                  <h3 className="font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Conquistas
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {unlockedCount}/{ach.length} desbloqueadas
                  </span>
                </div>
                <AchievementsGrid items={ach} />
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
