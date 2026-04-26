import { NavLink, useLocation, Outlet, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, BarChart3, ShieldCheck, Settings, LogOut, Trophy, FlaskConical, HardHat, MessageCircle, Lock, Sparkles, FileText, Library, Headset, Headphones } from "lucide-react";
import CreuzaFab from "@/components/CreuzaFab";
import { useDemoMode } from "@/contexts/DemoModeContext";
import RenewalBanner from "@/components/RenewalBanner";
import PlanBadge from "@/components/PlanBadge";
import LoyaltyBadge from "@/components/LoyaltyBadge";
import TermsGate from "@/components/TermsGate";
import UserAvatar from "@/components/UserAvatar";
import { computeFreeTrial, computePlanWindows } from "@/lib/freeTrial";

const items = [
  { title: "Estudar", url: "/app/estudar", icon: GraduationCap },
  { title: "Modelos de Estudo", url: "/app/modelos", icon: Library },
  { title: "Ouvir", url: "/app/ouvir", icon: Headphones },
  { title: "Chat com Professor", url: "/app/chat", icon: MessageCircle },
  { title: "Normas Principais", url: "/app/normas", icon: BookOpen },
  { title: "Meu Progresso", url: "/app/progresso", icon: BarChart3 },
  { title: "Ranking", url: "/app/ranking", icon: Trophy },
  { title: "Planos", url: "/app/planos", icon: Sparkles },
];

const adminItems = [
  { title: "Gestão de Cadastros", url: "/app/admin", icon: ShieldCheck },
  { title: "Demo de Estudo", url: "/app/estudar-demo", icon: FlaskConical },
];

function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin, profile } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const trial = computeFreeTrial({ plan: profile?.plan, createdAt: profile?.created_at });
  const planWindow = computePlanWindows({ plan: profile?.plan, accessExpiresAt: profile?.access_expires_at });
  const days60ChatActive = profile?.plan === "days_60" && planWindow.chatActive;
  const baseChatUnlock = profile?.plan === "days_60" ? days60ChatActive : !!profile?.chat_unlocked;
  const chatLocked = !isAdmin && !baseChatUnlock && !trial.freeChatActive;
  const cls = (path: string) =>
    location.pathname === path
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/60";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="w-9 h-9 shrink-0 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <HardHat className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col">
              <p className="font-bold leading-tight text-base">EDUCA.I</p>
              <p className="text-xs text-muted-foreground leading-tight">Academy</p>
              {profile && (
                <div className="mt-1">
                  <PlanBadge plan={profile.plan} isAdmin={isAdmin} />
                </div>
              )}
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Aluno</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const isChat = it.url === "/app/chat";
                const locked = isChat && chatLocked;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={it.url} end className={cls(it.url)}>
                        <it.icon className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <span className="flex items-center gap-1.5 flex-1">
                            {it.title}
                            {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((it) => (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={it.url} end className={cls(it.url)}>
                        <it.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{it.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/app/suporte" className={cls("/app/suporte")}>
                    <Headset className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Suporte (Creuza)</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/app/configuracoes" className={cls("/app/configuracoes")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Configurações</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/termos" target="_blank" className="hover:bg-sidebar-accent/60">
                    <FileText className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Termos de Uso</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppLayout() {
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { enabled: demoEnabled, setEnabled: setDemoEnabled, viewAsRow, setViewAsId } = useDemoMode();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 gap-2 bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden md:inline">EDUCA.I Academy</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {isAdmin && demoEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDemoEnabled(false)}
                  className="border-primary/50 text-primary gap-1 h-7 px-2"
                  title="Desativar modo de teste"
                >
                  <FlaskConical className="w-3 h-3" />
                  <span className="hidden sm:inline text-xs">Modo teste</span>
                </Button>
              )}
              {profile && <PlanBadge plan={profile.plan} isAdmin={isAdmin} size="sm" className="hidden sm:inline-flex" />}
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <Link
                  to="/app/configuracoes#meu-perfil"
                  className="flex items-center gap-2 min-w-0 rounded-md px-1 py-0.5 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  aria-label="Editar nome e avatar"
                  title="Editar nome e avatar"
                >
                  <UserAvatar
                    avatarUrl={profile?.avatar_url}
                    displayName={profile?.display_name}
                    email={profile?.email}
                    borderId={profile?.avatar_border}
                    size="xs"
                  />
                  <span className="text-sm truncate max-w-[160px] hover:underline">
                    {profile?.display_name?.trim() || profile?.email?.split("@")[0]}
                  </span>
                </Link>
                <LoyaltyBadge startDate={profile?.created_at} size="xs" />
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sair">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          {isAdmin && viewAsRow && (
            <div className="bg-primary/15 border-b border-primary/30 px-4 py-2 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">
                  Vendo o app como <strong>{viewAsRow.display_name}</strong> (aluno fictício)
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setViewAsId(null)} className="h-7 text-xs">
                Sair
              </Button>
            </div>
          )}
          <main className="flex-1 p-3 sm:p-4 md:p-8 animate-fade-in space-y-4 min-w-0 overflow-x-hidden">
            <RenewalBanner />
            <Outlet />
          </main>
        </div>
      </div>
      <CreuzaFab />
      <TermsGate />
    </SidebarProvider>
  );
}
