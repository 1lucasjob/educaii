import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { THEMES, applyTheme, ThemeName } from "@/lib/theme";
import { Settings, Check, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const choose = async (id: ThemeName) => {
    applyTheme(id);
    if (profile) {
      await supabase.from("profiles").update({ theme: id }).eq("id", profile.id);
      await refreshProfile();
    }
  };

  const toggleRanking = async (checked: boolean) => {
    if (!profile) return;
    await supabase.from("profiles").update({ show_in_ranking: checked }).eq("id", profile.id);
    await refreshProfile();
    toast({
      title: checked ? "Você aparece no ranking" : "Você foi removido do ranking",
      description: checked
        ? "Outros alunos verão seu nome e pontuação."
        : "Seu perfil ficou oculto da página de Ranking.",
    });
  };

  const current = profile?.theme ?? "dark-yellow";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="text-primary" /> Configurações</h1>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Privacidade do Ranking</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quando ativado, seu nome (parte do email antes do @) e pontuação ficam visíveis aos demais alunos.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="ranking-toggle" className="text-sm">Aparecer no ranking</Label>
            <Switch
              id="ranking-toggle"
              checked={profile?.show_in_ranking ?? true}
              onCheckedChange={toggleRanking}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-1">Tema</h2>
        <p className="text-sm text-muted-foreground mb-4">Escolha a paleta de cores da sua área de estudo.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  active ? "border-primary shadow-glow" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{t.emoji}</span>
                  {active && <Check className="text-primary w-5 h-5" />}
                </div>
                <p className="font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
