import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, KeyRound, Copy, Plus, FlaskConical, Palette, Eye, EyeOff, Trophy, RefreshCw, Users, Unlock, Lock, History, Award, Trash2 } from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { THEMES, applyTheme, getStoredTheme, ThemeName } from "@/lib/theme";
import { useNavigate } from "react-router-dom";
import { PLANS, planLabel } from "@/lib/plans";
import PlanBadge from "@/components/PlanBadge";
import type { AccessPlan } from "@/contexts/AuthContext";

interface Invite {
  id: string;
  token: string;
  used: boolean;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  plan: AccessPlan;
  access_expires_at: string | null;
}

interface StudentRow {
  id: string;
  email: string;
  plan: AccessPlan;
  access_expires_at: string | null;
  last_score: number;
  current_topic: string | null;
  current_topic_unlocked: boolean;
  expert_unlocked_until: string | null;
}

export default function Admin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { enabled: demoEnabled, setEnabled: setDemoEnabled, fakeLeaderboard, viewAsId, setViewAsId } = useDemoMode();
  const [previewTheme, setPreviewTheme] = useState<ThemeName>(getStoredTheme());
  const [slots, setSlots] = useState(0);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [unlockLogs, setUnlockLogs] = useState<Array<{ id: string; created_at: string; admin_email: string | null; student_email: string; previous_topic: string | null }>>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [plan, setPlan] = useState<AccessPlan>("free");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invite | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const [{ data: s }, { data: i }, { data: st }, { data: logs }, { data: roles }] = await Promise.all([
      supabase.from("available_slots").select("count").eq("id", 1).single(),
      supabase.from("invites").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,plan,access_expires_at,last_score,current_topic,current_topic_unlocked,expert_unlocked_until").order("access_expires_at", { ascending: true }),
      supabase.from("study_unlock_logs").select("id,created_at,admin_email,student_email,previous_topic").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    setSlots(s?.count ?? 0);
    setInvites((i as Invite[]) ?? []);
    setStudents((st as StudentRow[]) ?? []);
    setUnlockLogs((logs as any) ?? []);
    setAdminIds(new Set(((roles as any[]) ?? []).map((r) => r.user_id)));
  };

  useEffect(() => { load(); }, []);

  const release = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-invite", { body: { pin, plan } });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acesso liberado!", description: `Plano ${planLabel(plan)} · link copiado.` });
    const link = `${window.location.origin}/cadastro?token=${data.token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setOpen(false);
    setPin("");
    load();
  };

  const renew = async (userId: string, newPlan: AccessPlan) => {
    const { error } = await supabase.rpc("admin_renew_user", { _user_id: userId, _plan: newPlan });
    if (error) {
      toast({ title: "Erro ao renovar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acesso renovado!", description: `Plano ${planLabel(newPlan)} aplicado.` });
    load();
  };

  const unlockStudy = async (userId: string, email: string) => {
    if (!confirm(`Liberar próximo tópico de estudo para ${email}? O aluno poderá escolher um novo tema mesmo sem ter atingido 80 pontos.`)) return;
    const { error } = await supabase.rpc("admin_unlock_study", { _user_id: userId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estudo liberado!", description: `${email} pode escolher novo tópico. Ação registrada no histórico.` });
    load();
  };

  const unlockExpert = async (userId: string, email: string) => {
    if (!confirm(`Liberar Simulado Expert por 24h para ${email}?`)) return;
    const { error } = await supabase.rpc("admin_unlock_expert", { _user_id: userId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Expert liberado!", description: `${email} pode acessar o Simulado Expert por 24h.` });
    load();
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/cadastro?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const statusOf = (i: Invite) => {
    if (i.used) return <Badge variant="secondary">Usado</Badge>;
    if (new Date(i.expires_at) < new Date()) return <Badge variant="destructive">Expirado</Badge>;
    return <Badge className="gradient-primary text-primary-foreground border-0">Ativo</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="text-primary" /> Gestão de Cadastros</h1>
        <p className="text-muted-foreground mt-1">Libere acessos individuais protegidos por PIN.</p>
      </div>

      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold flex items-center gap-2">
                Modo de teste
                {demoEnabled && <Badge className="gradient-primary text-primary-foreground border-0">Ativo</Badge>}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Visualize Ranking e Meu Progresso com dados fictícios e pré-visualize temas — visível apenas para você. Nenhum dado é salvo no banco.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="demo-switch" className="text-sm">Ativar dados fake</Label>
            <Switch id="demo-switch" checked={demoEnabled} onCheckedChange={setDemoEnabled} />
          </div>
        </div>

        {demoEnabled && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/app/ranking")} className="gap-1 border-primary/40">
              <Trophy className="w-3.5 h-3.5 text-primary" /> Ver Ranking demo
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/app/progresso")} className="gap-1 border-primary/40">
              <Eye className="w-3.5 h-3.5 text-primary" /> Ver Meu Progresso
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/app/estudar-demo")} className="gap-1 border-primary/40">
              <FlaskConical className="w-3.5 h-3.5 text-primary" /> Demo de Estudo
            </Button>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-primary" /> Pré-visualizar tema
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setPreviewTheme(t.id);
                  applyTheme(t.id);
                }}
                className={`text-left p-3 rounded-md border transition-colors ${
                  previewTheme === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="text-lg">{t.emoji}</p>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            A troca aplica o tema imediatamente em todo o app (até você sair ou escolher outro em Configurações).
          </p>
        </div>

        {demoEnabled && (
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <p className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Ver o app como aluno
              </p>
              {viewAsId && (
                <Button size="sm" variant="ghost" onClick={() => setViewAsId(null)} className="h-7 gap-1 text-xs">
                  <EyeOff className="w-3 h-3" /> Sair da simulação
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Escolha um aluno fictício para abrir <strong>Meu Progresso</strong> com os dados dele (histórico, gráficos e conquistas).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {fakeLeaderboard.map((s) => {
                const active = viewAsId === s.user_id;
                return (
                  <button
                    key={s.user_id}
                    onClick={() => {
                      setViewAsId(s.user_id);
                      navigate("/app/progresso");
                    }}
                    className={`text-left p-3 rounded-md border transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{s.display_name}</p>
                      {active && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Atual</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {s.attempts} simulados · {s.hard_passed} aprovações · média {s.avg_score}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-8 shadow-glow text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">Vagas disponíveis</p>
        <p className="text-6xl font-bold gradient-primary bg-clip-text text-transparent my-2" style={{ WebkitTextFillColor: "transparent", backgroundImage: "var(--gradient-primary)" }}>
          {slots}
        </p>
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground shadow-glow mt-2">
          <Plus className="mr-2" /> Liberar +1 acesso
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Convites ({invites.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Expira link</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{statusOf(i)}</TableCell>
                <TableCell><Badge variant="outline">{planLabel(i.plan)}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(i.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-xs">{new Date(i.expires_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {!i.used && new Date(i.expires_at) > new Date() && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                      <Copy className="w-3 h-3 mr-1" /> Copiar link
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invites.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum convite ainda.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Alunos cadastrados ({students.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Estudo</TableHead>
              <TableHead>Expert 24h</TableHead>
              <TableHead>Renovar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const expired = s.access_expires_at && new Date(s.access_expires_at) < new Date();
              const isAdminRow = adminIds.has(s.id);
              const expertActiveNow = s.expert_unlocked_until && new Date(s.expert_unlocked_until) > new Date();
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-xs truncate max-w-[180px]">{s.email}</TableCell>
                  <TableCell><PlanBadge plan={s.plan} isAdmin={isAdminRow} size="sm" /></TableCell>
                  <TableCell className="text-xs">
                    {isAdminRow ? (
                      <span className="text-primary font-semibold">Vitalício</span>
                    ) : s.access_expires_at ? (
                      <span className={expired ? "text-destructive font-semibold" : ""}>
                        {new Date(s.access_expires_at).toLocaleDateString("pt-BR")}
                        {expired && " (expirado)"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {s.current_topic_unlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <Unlock className="w-3 h-3" /> Liberado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => unlockStudy(s.id, s.email)}
                        title={`Tópico atual: ${s.current_topic ?? "—"} · Pontos: ${s.last_score}`}
                      >
                        <Unlock className="w-3 h-3 mr-1" /> Liberar estudo
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {expertActiveNow ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(280 80% 65%)" }} title={new Date(s.expert_unlocked_until!).toLocaleString("pt-BR")}>
                        <Award className="w-3 h-3" /> Ativo até{" "}
                        {new Date(s.expert_unlocked_until!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        style={{ borderColor: "hsl(280 80% 55% / 0.4)" }}
                        onClick={() => unlockExpert(s.id, s.email)}
                      >
                        <Award className="w-3 h-3 mr-1" /> Liberar 24h
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select onValueChange={(v) => renew(s.id, v as AccessPlan)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Renovar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label} · {p.days}d</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {students.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum aluno cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Histórico de liberações de estudo ({unlockLogs.length})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Tópico anterior</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unlockLogs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">
                  {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </TableCell>
                <TableCell className="text-xs truncate max-w-[160px]">{l.admin_email ?? "—"}</TableCell>
                <TableCell className="text-xs truncate max-w-[180px]">{l.student_email}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.previous_topic ?? "—"}</TableCell>
              </TableRow>
            ))}
            {unlockLogs.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhuma liberação manual ainda.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="text-primary" /> Liberar novo acesso</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Escolha o plano e digite o PIN para gerar um link de cadastro único.</p>
          <div className="space-y-2">
            <Label>Plano de acesso</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as AccessPlan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>PIN do administrador</Label>
            <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          </div>
          <Button onClick={release} disabled={loading || pin.length !== 4} className="gradient-primary text-primary-foreground">
            {loading ? "Liberando…" : `Confirmar — ${planLabel(plan)}`}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
