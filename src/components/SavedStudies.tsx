import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Archive, Trash2, ChevronDown, ChevronUp, ShieldCheck, Lock, Sparkles, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { savedStudiesActive, savedStudiesLimit } from "@/lib/freeTrial";

export interface CurrentStudy {
  title: string;
  body: string;
  summary: string;
}

interface SavedStudy {
  id: string;
  title: string;
  body: string;
  summary: string;
  saved_by_admin: boolean;
  created_at: string;
}

interface Props {
  current?: CurrentStudy | null;
  onLoad?: (s: SavedStudy) => void;
}

export default function SavedStudies({ current, onLoad }: Props) {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<SavedStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const active = savedStudiesActive({
    plan: profile?.plan,
    createdAt: profile?.created_at,
    savedStudiesUnlockedUntil: profile?.saved_studies_unlocked_until,
    isAdmin,
  });
  const limit = savedStudiesLimit({ plan: profile?.plan, isAdmin });
  const ownCount = items.filter((i) => isAdmin || !i.saved_by_admin).length;
  const adminUntil = profile?.saved_studies_unlocked_until
    ? Math.max(0, Math.ceil((new Date(profile.saved_studies_unlocked_until).getTime() - Date.now()) / 86_400_000))
    : 0;

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_studies" as any)
      .select("id,title,body,summary,saved_by_admin,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const save = async () => {
    if (!profile || !current) return;
    if (ownCount >= limit) {
      toast({ title: "Limite atingido", description: `Você pode guardar até ${limit} estudos.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("saved_studies" as any).insert({
      user_id: profile.id,
      title: current.title,
      body: current.body,
      summary: current.summary,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estudo guardado", description: current.title });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este estudo guardado?")) return;
    const { error } = await supabase.from("saved_studies" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  if (!active && items.length === 0) {
    return (
      <Card className="p-5 border-2 border-dashed border-muted-foreground/30 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold flex items-center gap-2"><Archive className="w-4 h-4" /> Guardar Estudo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Recurso disponível para o plano <strong className="text-foreground">FREE</strong> nos primeiros 30 dias ou mediante liberação do administrador (30 dias).
            </p>
            <Button asChild size="sm" className="mt-3 gradient-primary text-primary-foreground">
              <Link to="/app/planos"><Sparkles className="w-4 h-4 mr-1.5" /> Ver planos</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h3 className="font-bold flex items-center gap-2 text-base sm:text-lg">
          <Archive className="w-5 h-5 text-primary" /> Estudos Guardados
          <Badge variant="outline" className="ml-1">{ownCount}/{limit}</Badge>
        </h3>
        {current && active && (
          <Button size="sm" onClick={save} disabled={saving || ownCount >= limit} className="gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-1.5" /> {saving ? "Guardando…" : "Guardar este estudo"}
          </Button>
        )}
      </div>

      {!isAdmin && profile?.saved_studies_unlocked_until && new Date(profile.saved_studies_unlocked_until) > new Date() && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 mb-3">
          <ShieldCheck className="w-3 h-3" /> Liberado pelo admin · {adminUntil} dia(s) restantes
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum estudo guardado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <button onClick={() => setOpen(isOpen ? null : s.id)} className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      {s.saved_by_admin && <> · <span className="text-primary">guardado pelo admin</span></>}
                    </p>
                  </button>
                  {onLoad && (
                    <Button size="sm" variant="ghost" onClick={() => onLoad(s)} className="h-8 px-2 text-xs">
                      Abrir
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)} className="h-8 px-2 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <button onClick={() => setOpen(isOpen ? null : s.id)} className="p-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="p-3 text-sm whitespace-pre-line max-h-72 overflow-auto">
                    {s.summary}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {ownCount >= limit && (
        <Alert className="mt-3 border-warning/40 bg-warning/5">
          <AlertDescription className="text-xs">
            Limite de {limit} estudos atingido. Exclua um para guardar outro.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
