import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { THEMES, applyTheme, ThemeName } from "@/lib/theme";
import { Settings, Check } from "lucide-react";

export default function Configuracoes() {
  const { profile, refreshProfile } = useAuth();

  const choose = async (id: ThemeName) => {
    applyTheme(id);
    if (profile) {
      await supabase.from("profiles").update({ theme: id }).eq("id", profile.id);
      await refreshProfile();
    }
  };

  const current = profile?.theme ?? "dark-yellow";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="text-primary" /> Configurações</h1>

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
