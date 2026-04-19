import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trophy } from "lucide-react";

interface Attempt {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  created_at: string;
}

export default function Progresso() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("quiz_attempts")
      .select("id,topic,difficulty,score,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAttempts((data as Attempt[]) ?? []));
  }, [user]);

  const total = attempts.length;
  const avg = total ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / total) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="text-primary" /> Meu Progresso</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Simulados feitos</p>
          <p className="text-3xl font-bold">{total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Média de pontos</p>
          <p className="text-3xl font-bold text-primary">{avg}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-bold mb-4">Histórico</h2>
        <div className="space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
              <div className="min-w-0">
                <p className="font-medium truncate">{a.topic}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.difficulty === "hard" ? "default" : "outline"} className={a.difficulty === "hard" ? "gradient-primary text-primary-foreground border-0" : ""}>
                  {a.difficulty === "hard" ? "Difícil" : "Fácil"}
                </Badge>
                <span className="font-bold flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-primary" /> {a.score}
                </span>
              </div>
            </div>
          ))}
          {attempts.length === 0 && <p className="text-center text-muted-foreground py-6">Nenhum simulado ainda.</p>}
        </div>
      </Card>
    </div>
  );
}
