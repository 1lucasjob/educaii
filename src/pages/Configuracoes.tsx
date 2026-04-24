import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { THEMES, applyTheme, ThemeName } from "@/lib/theme";
import { buildRenewalMailto, daysUntil, planLabel } from "@/lib/plans";
import PlanBadge from "@/components/PlanBadge";
import LoyaltyBadge from "@/components/LoyaltyBadge";
import UserAvatar from "@/components/UserAvatar";
import { Settings, Check, Trophy, KeyRound, Eye, EyeOff, CreditCard, Calendar, RefreshCw, User as UserIcon, Upload, Trash2, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import { PRESET_AVATARS, availableBorderPresets, type PresetAvatar } from "@/lib/presetAvatars";
import { computeAchievements } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export default function Configuracoes() {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const { toast } = useToast();

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [savingNick, setSavingNick] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  // Carrega tentativas para calcular conquistas desbloqueadas → libera avatares de conquista
  const [attempts, setAttempts] = useState<Array<{ topic: string; difficulty: string; score: number; created_at: string; time_spent_seconds?: number }>>([]);
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("quiz_attempts")
      .select("topic,difficulty,score,created_at,time_spent_seconds")
      .eq("user_id", profile.id)
      .then(({ data }) => setAttempts((data as any) ?? []));
  }, [profile?.id]);

  const unlockedAchievements = useMemo(() => {
    const list = computeAchievements(attempts);
    return new Set(list.filter((a) => a.unlocked).map((a) => a.id));
  }, [attempts]);

  const visibleAvatars = useMemo(() => {
    return PRESET_AVATARS.filter((p) => {
      if (isAdmin) return true; // admin vê todos os ocultos
      if (p.category === "human") return true;
      if (p.category === "admin") return false;
      if (p.category === "achievement") {
        return p.requiresAchievement ? unlockedAchievements.has(p.requiresAchievement) : true;
      }
      if (p.category === "plan") {
        return !!(p.requiresPlanIn && profile?.plan && p.requiresPlanIn.includes(profile.plan));
      }
      return false;
    });
  }, [unlockedAchievements, isAdmin, profile?.plan]);

  const groupedAvatars = useMemo(() => {
    const human: PresetAvatar[] = [];
    const achievement: PresetAvatar[] = [];
    const plan: PresetAvatar[] = [];
    const admin: PresetAvatar[] = [];
    visibleAvatars.forEach((a) => {
      if (a.category === "human") human.push(a);
      else if (a.category === "achievement") achievement.push(a);
      else if (a.category === "plan") plan.push(a);
      else admin.push(a);
    });
    return { human, achievement, plan, admin };
  }, [visibleAvatars]);

  const borderOptions = useMemo(
    () =>
      availableBorderPresets({
        isAdmin,
        unlockedAchievementIds: unlockedAchievements,
        plan: profile?.plan,
      }),
    [isAdmin, unlockedAchievements, profile?.plan],
  );

  const saveDisplayName = async () => {
    if (!profile) return;
    const clean = displayName.trim().slice(0, 24);
    setSavingNick(true);
    const { error } = await supabase.from("profiles").update({ display_name: clean || null }).eq("id", profile.id);
    setSavingNick(false);
    if (error) {
      toast({ title: "Erro ao salvar apelido", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Apelido atualizado!" });
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPEG ou WebP.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 2 MB.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setCropFile(file);
    setCropOpen(true);
  };

  const handleCroppedBlob = async (blob: Blob) => {
    if (!profile) return;
    setUploadingAvatar(true);
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type });
    if (upErr) {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Erro ao enviar imagem", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl + `?t=${Date.now()}`;

    if (isAdmin) {
      // Admin: bypass — vai direto para avatar_url
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url, avatar_pending_url: null, avatar_status: "approved", avatar_reviewed_at: new Date().toISOString() })
        .eq("id", profile.id);
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (updErr) {
        toast({ title: "Erro ao salvar imagem", description: updErr.message, variant: "destructive" });
        return;
      }
      await refreshProfile();
      toast({ title: "Imagem atualizada!" });
      return;
    }

    // Aluno: salva como pendente, aguarda aprovação
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_pending_url: url, avatar_status: "pending" })
      .eq("id", profile.id);
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (updErr) {
      toast({ title: "Erro ao salvar imagem", description: updErr.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({
      title: "Imagem enviada para análise",
      description: "Sua nova imagem só ficará visível depois que o administrador aprovar.",
    });
  };

  const removeAvatar = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null, avatar_pending_url: null, avatar_status: "none" })
      .eq("id", profile.id);
    if (error) {
      toast({ title: "Erro ao remover imagem", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Imagem removida" });
  };

  const selectPreset = async (url: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: url,
        avatar_pending_url: null,
        avatar_status: "approved",
        avatar_reviewed_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (error) {
      toast({ title: "Erro ao aplicar avatar", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Avatar atualizado!" });
  };

  const selectBorder = async (borderId: string | null) => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_border: borderId })
      .eq("id", profile.id);
    if (error) {
      toast({ title: "Erro ao aplicar borda", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: borderId ? "Borda atualizada!" : "Borda removida" });
  };

  const changePassword = async () => {
    if (newPwd.length < 6) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "Senhas não conferem", description: "Confirme a nova senha corretamente.", variant: "destructive" });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
      return;
    }
    setNewPwd("");
    setConfirmPwd("");
    toast({ title: "Senha alterada!", description: "Sua nova senha já está ativa." });
  };

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
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Settings className="text-primary shrink-0" /> Configurações</h1>

      <Card className="p-6">
        <h2 className="font-bold flex items-center gap-2 mb-4"><UserIcon className="w-4 h-4 text-primary" /> Meu Perfil</h2>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              displayName={profile?.display_name}
              email={profile?.email}
              size="xl"
            />
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarSelected} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                {uploadingAvatar ? "Enviando…" : "Trocar imagem"}
              </Button>
              {profile?.avatar_url && (
                <Button size="sm" variant="ghost" onClick={removeAvatar} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">PNG/JPEG/WebP · até 2 MB</p>
            {!isAdmin && profile?.avatar_status === "pending" && (
              <p className="text-[10px] text-amber-500 font-medium text-center max-w-[160px]">
                ⏳ Imagem em análise pelo administrador
              </p>
            )}
            {!isAdmin && profile?.avatar_status === "rejected" && (
              <p className="text-[10px] text-destructive font-medium text-center max-w-[160px]">
                ✕ Imagem rejeitada — envie outra
              </p>
            )}
            {!isAdmin && profile?.avatar_status === "approved" && profile?.avatar_url && (
              <p className="text-[10px] text-success font-medium text-center max-w-[160px]">
                ✓ Imagem aprovada
              </p>
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="display-name" className="text-sm">Apelido</Label>
              <LoyaltyBadge startDate={profile?.created_at} size="sm" />
            </div>
            <Input id="display-name" value={displayName} maxLength={24} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como você quer ser chamado" />
            <p className="text-xs text-muted-foreground">
              Aparece no ranking e no cabeçalho. Deixe em branco para usar a parte do email antes do @.
            </p>
            <Button onClick={saveDisplayName} disabled={savingNick} size="sm" className="gradient-primary text-primary-foreground">
              {savingNick ? "Salvando…" : "Salvar apelido"}
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border space-y-5">
          <div>
            <p className="text-sm font-medium mb-1">Ou escolha um avatar pronto</p>
            <p className="text-xs text-muted-foreground mb-3">
              Aplicação imediata, sem precisar de aprovação.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {groupedAvatars.human.map((a) => {
                const active = profile?.avatar_url === a.src;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectPreset(a.src)}
                    title={a.label}
                    aria-label={a.label}
                    className={cn(
                      "relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105",
                      active ? "border-primary shadow-glow" : "border-border hover:border-primary/50",
                    )}
                  >
                    <img
                      src={a.src}
                      alt={a.label}
                      width={128}
                      height={128}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {groupedAvatars.achievement.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Avatares de conquista
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Desbloqueados pelas suas conquistas — borda dourada exclusiva.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {groupedAvatars.achievement.map((a) => {
                  const active = profile?.avatar_url === a.src;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectPreset(a.src)}
                      title={a.label}
                      aria-label={a.label}
                      className={cn(
                        "relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105",
                        a.borderClass,
                        active && "scale-105",
                      )}
                    >
                      <img
                        src={a.src}
                        alt={a.label}
                        width={128}
                        height={128}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {active && (
                        <span className="absolute inset-0 ring-2 ring-primary rounded-full pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {groupedAvatars.plan.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Exclusivos do plano 90 dias ou superior
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Borda roxa exclusiva para assinantes dos planos 90/180 dias e Premium.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {groupedAvatars.plan.map((a) => {
                  const active = profile?.avatar_url === a.src;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectPreset(a.src)}
                      title={a.label}
                      aria-label={a.label}
                      className={cn(
                        "relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105",
                        a.borderClass,
                        active && "scale-105",
                      )}
                    >
                      <img
                        src={a.src}
                        alt={a.label}
                        width={128}
                        height={128}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {active && (
                        <span className="absolute inset-0 ring-2 ring-primary rounded-full pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {groupedAvatars.admin.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Exclusivo Admin
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Borda platina + coroa — só você vê esta opção.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {groupedAvatars.admin.map((a) => {
                  const active = profile?.avatar_url === a.src;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectPreset(a.src)}
                      title={a.label}
                      aria-label={a.label}
                      className={cn(
                        "relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105",
                        a.borderClass,
                        active && "scale-105",
                      )}
                    >
                      <img
                        src={a.src}
                        alt={a.label}
                        width={128}
                        height={128}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {active && (
                        <span className="absolute inset-0 ring-2 ring-primary rounded-full pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

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
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Plano de acesso
            </h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Plano atual:</span>
                <span className="font-semibold text-primary">{isAdmin ? "ADMIN" : planLabel(profile?.plan ?? "free")}</span>
                {profile && <PlanBadge plan={profile.plan} size="md" isAdmin={isAdmin} />}
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-primary">Acesso vitalício de administrador</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Expira em:</span>
                    <span className={(() => {
                      const d = daysUntil(profile?.access_expires_at ?? null);
                      if (d === null) return "text-muted-foreground";
                      if (d <= 10) return "text-destructive font-semibold";
                      if (d <= 30) return "text-yellow-500 font-semibold";
                      return "text-green-500 font-semibold";
                    })()}>
                      {(() => {
                        const d = daysUntil(profile?.access_expires_at ?? null);
                        if (d === null) return "—";
                        if (d < 0) return "Expirado";
                        return `${d} ${d === 1 ? "dia" : "dias"}`;
                      })()}
                    </span>
                  </div>
                  {profile?.access_expires_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(profile.access_expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {!isAdmin && (() => {
            const d = daysUntil(profile?.access_expires_at ?? null);
            const showButton = d !== null && d <= 10;
            const mailto = profile ? buildRenewalMailto({
              userEmail: profile.email,
              plan: profile.plan,
              expiresAt: profile.access_expires_at,
            }) : "#";
            return showButton ? (
              <div className="flex flex-col items-stretch gap-2 shrink-0">
                <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-glow">
                  <a href={mailto}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Renovar agora
                  </a>
                </Button>
                <a href="/app/planos" className="text-xs text-primary hover:underline text-center">
                  Ver todos os planos
                </a>
              </div>
            ) : (
              <a href="/app/planos" className="text-xs text-primary hover:underline shrink-0 self-center">
                Ver todos os planos
              </a>
            );
          })()}
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

      <Card className="p-6">
        <h2 className="font-bold flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-primary" /> Alterar senha
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Defina uma nova senha de acesso. Você continuará logado após a alteração.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-pwd" className="text-sm">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-pwd"
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd" className="text-sm">Confirmar nova senha</Label>
            <Input
              id="confirm-pwd"
              type={showPwd ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>
        </div>
        <Button
          onClick={changePassword}
          disabled={savingPwd || !newPwd || !confirmPwd}
          className="mt-4 gradient-primary text-primary-foreground"
        >
          {savingPwd ? "Salvando…" : "Alterar senha"}
        </Button>
      </Card>

      <AvatarCropDialog
        file={cropFile}
        open={cropOpen}
        onOpenChange={(o) => {
          setCropOpen(o);
          if (!o) {
            setCropFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
        onCropped={handleCroppedBlob}
      />
    </div>
  );
}

