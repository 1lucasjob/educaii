import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

interface Row {
  user_id: string;
  display_name: string;
  total_score: number;
  hard_passed: number;
  attempts: number;
  avg_score: number;
  composite_score: number;
}

const rankIcon = (i: number) => {
  if (i === 0) return <Crown className="w-5 h-5 text-primary" />;
  if (i === 1) return <Medal className="w-5 h-5 text-foreground/70" />;
  if (i === 2) return <Award className="w-5 h-5 text-primary/60" />;
  return <span className="w-5 inline-block text-center text-xs text-muted-foreground font-mono">{i + 1}</span>;
};

export default function Ranking() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_leaderboard").then(({ data }) => {
      setRows((data as Row[]) ?? []);
      setLoading(false);
    });
  }, []);

  const myIndex = rows.findIndex((r) => r.user_id === user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Trophy className="text-primary" /> Ranking
      </h1>
      <p className="text-sm text-muted-foreground">
        Top 100 alunos ordenados pelo score composto: <strong>aprovações no difícil × 10 + média de pontos</strong>.
      </p>

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
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando ranking…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Ninguém no ranking ainda. Faça um simulado para entrar!</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r, i) => {
              const isMe = r.user_id === user?.id;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 px-4 py-3 ${
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
                      {r.attempts} simulados · {r.hard_passed} aprovações no difícil · média {r.avg_score}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{Math.round(r.composite_score)}</p>
                    <p className="text-xs text-muted-foreground">{r.total_score} pts totais</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {myIndex >= 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Sua posição: <strong className="text-primary">#{myIndex + 1}</strong> de {rows.length}
        </p>
      )}
    </div>
  );
}
