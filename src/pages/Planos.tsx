import { useEffect, useState } from "react";
import { useAuth, type AccessPlan } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PlanBadge from "@/components/PlanBadge";
import PixPaymentDialog from "@/components/PixPaymentDialog";
import { buildPurchaseMailto, buildExpertPackPurchaseMailto, planLabel } from "@/lib/plans";
import { parsePriceToNumber } from "@/lib/pix";
import { Check, Sparkles, Mail, ShieldCheck, Pencil, Save, X, Loader2, Lock, QrCode, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanSetting {
  plan: AccessPlan;
  price: string;
  old_price: string | null;
  duration_label: string;
  highlight: string | null;
  benefits: string[];
  locked: boolean;
}

const PLAN_ORDER: AccessPlan[] = ["days_30", "days_60", "days_90", "days_180", "premium"];

interface ExpertPackSetting {
  price: string;
  old_price: string | null;
  duration_days: number;
  duration_label: string;
  benefits: string[];
  highlight: string | null;
  locked: boolean;
}

export default function Planos() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AccessPlan | null>(null);
  const [draft, setDraft] = useState<PlanSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [pixData, setPixData] = useState<
    | { amount: number; plan: AccessPlan; label: string; mailto: string }
    | null
  >(null);
  const [expertPack, setExpertPack] = useState<ExpertPackSetting | null>(null);
  const [editingPack, setEditingPack] = useState(false);
  const [packDraft, setPackDraft] = useState<ExpertPackSetting | null>(null);
  const [savingPack, setSavingPack] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: packData, error: packErr }] = await Promise.all([
      supabase
        .from("plan_settings")
        .select("plan,price,old_price,duration_label,highlight,benefits,locked"),
      (supabase as any)
        .from("expert_pack_settings")
        .select("price,old_price,duration_days,duration_label,benefits,highlight,locked")
        .eq("id", 1)
        .maybeSingle(),
    ]);
    if (error) {
      toast({ title: "Erro ao carregar planos", description: error.message, variant: "destructive" });
    } else if (data) {
      const normalized: PlanSetting[] = data.map((d: any) => ({
        plan: d.plan as AccessPlan,
        price: d.price,
        old_price: d.old_price,
        duration_label: d.duration_label,
        highlight: d.highlight,
        benefits: Array.isArray(d.benefits) ? (d.benefits as string[]) : [],
        locked: !!d.locked,
      }));
      normalized.sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan));
      setPlans(normalized);
    }
    if (!packErr && packData) {
      const d: any = packData;
      setExpertPack({
        price: d.price,
        old_price: d.old_price,
        duration_days: d.duration_days,
        duration_label: d.duration_label,
        benefits: Array.isArray(d.benefits) ? (d.benefits as string[]) : [],
        highlight: d.highlight,
        locked: !!d.locked,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: PlanSetting) => {
    setEditing(p.plan);
    setDraft({ ...p, benefits: [...p.benefits] });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const savePack = async () => {
    if (!packDraft) return;
    setSavingPack(true);
    const { error } = await (supabase as any)
      .from("expert_pack_settings")
      .update({
        price: packDraft.price.trim(),
        old_price: packDraft.old_price?.trim() || null,
        duration_days: packDraft.duration_days,
        duration_label: packDraft.duration_label.trim(),
        highlight: packDraft.highlight?.trim() || null,
        benefits: packDraft.benefits.map((b) => b.trim()).filter(Boolean),
        locked: packDraft.locked,
      })
      .eq("id", 1);
    setSavingPack(false);
    if (error) {
      toast({ title: "Erro ao salvar pacote", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pacote atualizado" });
    setEditingPack(false);
    setPackDraft(null);
    load();
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("plan_settings")
      .update({
        price: draft.price.trim(),
        old_price: draft.old_price?.trim() || null,
        duration_label: draft.duration_label.trim(),
        highlight: draft.highlight?.trim() || null,
        benefits: draft.benefits.map((b) => b.trim()).filter(Boolean),
        locked: draft.locked,
      })
      .eq("plan", draft.plan);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Plano atualizado" });
    setEditing(null);
    setDraft(null);
    load();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          Planos EDUCA.I
        </h1>
        <p className="text-muted-foreground text-sm">
          Escolha o plano ideal para sua jornada de estudos.
        </p>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-sm font-medium">
          🎉 <strong>Preços promocionais por tempo limitado!</strong> Aproveite enquanto durar.
        </AlertDescription>
      </Alert>

      {isAdmin && (
        <Alert className="border-purple-500/50 bg-purple-500/10">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm">
            Você possui <strong>acesso vitalício de administrador</strong>. Como admin, você pode editar preços, benefícios e destaques de cada plano clicando no ícone de lápis.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {plans.map((p) => {
            const isCurrent = !isAdmin && profile?.plan === p.plan;
            const mailto = profile ? buildPurchaseMailto({ userEmail: profile.email, plan: p.plan }) : "#";
            const isEditing = editing === p.plan && draft;

            return (
              <Card
                key={p.plan}
                className={cn(
                  "p-6 flex flex-col gap-4 relative transition-all",
                  isCurrent && "ring-2 ring-primary shadow-glow",
                  p.highlight && !isCurrent && !p.locked && "border-primary/40",
                  p.locked && !isAdmin && "opacity-75"
                )}
              >
                {p.highlight && !isEditing && !p.locked && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {p.highlight}
                  </div>
                )}
                {p.locked && !isEditing && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md border border-border flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Indisponível
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Seu plano atual
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <PlanBadge plan={p.plan} size="md" />
                  {isAdmin && !isEditing && (
                    <Button size="icon" variant="ghost" onClick={() => startEdit(p)} aria-label="Editar plano">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {isEditing && draft ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Preço atual</Label>
                      <Input
                        value={draft.price}
                        onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                        placeholder="R$ 10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preço antigo (riscado)</Label>
                      <Input
                        value={draft.old_price ?? ""}
                        onChange={(e) => setDraft({ ...draft, old_price: e.target.value })}
                        placeholder="R$ 20 (opcional)"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duração</Label>
                      <Input
                        value={draft.duration_label}
                        onChange={(e) => setDraft({ ...draft, duration_label: e.target.value })}
                        placeholder="30 dias renováveis"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Destaque (fita superior)</Label>
                      <Input
                        value={draft.highlight ?? ""}
                        onChange={(e) => setDraft({ ...draft, highlight: e.target.value })}
                        placeholder="Mais escolhido (opcional)"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Benefícios (um por linha)</Label>
                      <Textarea
                        rows={6}
                        value={draft.benefits.join("\n")}
                        onChange={(e) => setDraft({ ...draft, benefits: e.target.value.split("\n") })}
                        placeholder="Acesso completo&#10;Quizzes ilimitados"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border p-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Plano travado</Label>
                        <p className="text-[10px] text-muted-foreground">Quando ativo, exibe "Indisponível" para os alunos.</p>
                      </div>
                      <Switch
                        checked={draft.locked}
                        onCheckedChange={(v) => setDraft({ ...draft, locked: v })}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={save} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        {p.old_price && (
                          <span className="text-sm text-muted-foreground line-through">{p.old_price}</span>
                        )}
                        <span className="text-4xl font-extrabold">{p.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.duration_label}</p>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {p.benefits.map((b, i) => (
                        <li key={`${p.plan}-${i}`} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {!isAdmin && !isCurrent && !p.locked && (() => {
                      const amount = parsePriceToNumber(p.price);
                      return (
                        <div className="space-y-2">
                          {amount && (
                            <Button
                              onClick={() => {
                                setPixData({
                                  amount,
                                  plan: p.plan,
                                  label: planLabel(p.plan),
                                  mailto: profile ? buildPurchaseMailto({ userEmail: profile.email, plan: p.plan }) : "#",
                                });
                                setPixOpen(true);
                              }}
                              className="gradient-primary text-primary-foreground shadow-glow w-full"
                            >
                              <QrCode className="w-4 h-4 mr-2" /> Pagar com PIX
                            </Button>
                          )}
                          <Button asChild variant="outline" className="w-full">
                            <a href={mailto}>
                              <Mail className="w-4 h-4 mr-2" /> Solicitar por e-mail
                            </a>
                          </Button>
                        </div>
                      );
                    })()}
                    {!isAdmin && !isCurrent && p.locked && (
                      <Button disabled variant="outline" className="w-full gap-2">
                        <Lock className="w-4 h-4" /> Indisponível no momento
                      </Button>
                    )}
                    {isAdmin && !p.locked && (() => {
                      const amount = parsePriceToNumber(p.price);
                      if (!amount) return null;
                      return (
                        <Button
                          onClick={() => {
                            setPixData({
                              amount,
                              plan: p.plan,
                              label: planLabel(p.plan),
                              mailto: profile ? buildPurchaseMailto({ userEmail: profile.email, plan: p.plan }) : "#",
                            });
                            setPixOpen(true);
                          }}
                          variant="outline"
                          className="w-full gap-2 border-dashed"
                        >
                          <QrCode className="w-4 h-4" /> Visualizar PIX (modo teste)
                        </Button>
                      );
                    })()}
                    {isAdmin && p.locked && (
                      <div className="text-xs text-center text-muted-foreground border border-dashed border-border rounded-md p-2 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Travado — alunos verão "Indisponível"
                      </div>
                    )}
                    {isCurrent && (
                      <Button disabled variant="outline" className="w-full">
                        Plano ativo
                      </Button>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Após o pagamento via PIX, envie o comprovante ao administrador para ativarmos seu acesso. A liberação é manual.
      </p>

      {/* Pacotes adicionais */}
      {expertPack && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" /> Pacotes adicionais
            </h2>
            {isAdmin && !editingPack && (
              <Button size="sm" variant="ghost" onClick={() => { setEditingPack(true); setPackDraft({ ...expertPack, benefits: [...expertPack.benefits] }); }} aria-label="Editar pacote">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Card className={cn("p-6 flex flex-col gap-4 relative", expertPack.locked && !isAdmin && "opacity-75")}>
            {expertPack.highlight && !editingPack && !expertPack.locked && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {expertPack.highlight}
              </div>
            )}
            {expertPack.locked && !editingPack && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md border border-border flex items-center gap-1">
                <Lock className="w-3 h-3" /> Indisponível
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-sm bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-purple-600">
                <Award className="w-3.5 h-3.5" /> EXPERT PACK
              </span>
            </div>

            {editingPack && packDraft ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Preço</Label>
                  <Input value={packDraft.price} onChange={(e) => setPackDraft({ ...packDraft, price: e.target.value })} placeholder="R$ 20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preço antigo (riscado)</Label>
                  <Input value={packDraft.old_price ?? ""} onChange={(e) => setPackDraft({ ...packDraft, old_price: e.target.value })} placeholder="opcional" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Duração (dias)</Label>
                    <Input type="number" value={packDraft.duration_days} onChange={(e) => setPackDraft({ ...packDraft, duration_days: parseInt(e.target.value || "0", 10) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rótulo</Label>
                    <Input value={packDraft.duration_label} onChange={(e) => setPackDraft({ ...packDraft, duration_label: e.target.value })} placeholder="30 dias" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Destaque</Label>
                  <Input value={packDraft.highlight ?? ""} onChange={(e) => setPackDraft({ ...packDraft, highlight: e.target.value })} placeholder="opcional" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Benefícios (um por linha)</Label>
                  <Textarea rows={5} value={packDraft.benefits.join("\n")} onChange={(e) => setPackDraft({ ...packDraft, benefits: e.target.value.split("\n") })} />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Pacote travado</Label>
                    <p className="text-[10px] text-muted-foreground">Quando ativo, exibe "Indisponível" para os alunos.</p>
                  </div>
                  <Switch checked={packDraft.locked} onCheckedChange={(v) => setPackDraft({ ...packDraft, locked: v })} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={savePack} disabled={savingPack} className="flex-1">
                    {savingPack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => { setEditingPack(false); setPackDraft(null); }} disabled={savingPack}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    {expertPack.old_price && (
                      <span className="text-sm text-muted-foreground line-through">{expertPack.old_price}</span>
                    )}
                    <span className="text-4xl font-extrabold">{expertPack.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pacote Simulados Expert · {expertPack.duration_label}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {expertPack.benefits.map((b, i) => (
                    <li key={`pack-${i}`} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {!isAdmin && !expertPack.locked && (() => {
                  const amount = parsePriceToNumber(expertPack.price);
                  return (
                    <div className="space-y-2">
                      {amount && (
                        <Button
                          onClick={() => {
                            setPixData({
                              amount,
                              plan: "free" as AccessPlan,
                              label: `Pacote Expert ${expertPack.duration_label}`,
                              mailto: profile ? buildExpertPackPurchaseMailto({ userEmail: profile.email, durationLabel: expertPack.duration_label }) : "#",
                            });
                            setPixOpen(true);
                          }}
                          className="gradient-primary text-primary-foreground shadow-glow w-full"
                        >
                          <QrCode className="w-4 h-4 mr-2" /> Pagar com PIX
                        </Button>
                      )}
                      <Button asChild variant="outline" className="w-full">
                        <a href={profile ? buildExpertPackPurchaseMailto({ userEmail: profile.email, durationLabel: expertPack.duration_label }) : "#"}>
                          <Mail className="w-4 h-4 mr-2" /> Solicitar por e-mail
                        </a>
                      </Button>
                    </div>
                  );
                })()}
                {!isAdmin && expertPack.locked && (
                  <Button disabled variant="outline" className="w-full gap-2">
                    <Lock className="w-4 h-4" /> Indisponível no momento
                  </Button>
                )}
                {isAdmin && !expertPack.locked && (() => {
                  const amount = parsePriceToNumber(expertPack.price);
                  if (!amount) return null;
                  return (
                    <Button
                      onClick={() => {
                        setPixData({
                          amount,
                          plan: "free" as AccessPlan,
                          label: `Pacote Expert ${expertPack.duration_label}`,
                          mailto: profile ? buildExpertPackPurchaseMailto({ userEmail: profile.email, durationLabel: expertPack.duration_label }) : "#",
                        });
                        setPixOpen(true);
                      }}
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                    >
                      <QrCode className="w-4 h-4" /> Visualizar PIX (modo teste)
                    </Button>
                  );
                })()}
                {isAdmin && expertPack.locked && (
                  <div className="text-xs text-center text-muted-foreground border border-dashed border-border rounded-md p-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Travado — alunos verão "Indisponível"
                  </div>
                )}
              </>
            )}
          </Card>
        </section>
      )}

      {pixData && profile && (
        <PixPaymentDialog
          open={pixOpen}
          onOpenChange={setPixOpen}
          amount={pixData.amount}
          planLabel={pixData.label}
          notifyMailto={pixData.mailto}
        />
      )}
    </div>
  );
}
