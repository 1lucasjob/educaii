import { NavLink, useLocation, Outlet, Navigate } from "react-router-dom";
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
import { GraduationCap, BookOpen, BarChart3, ShieldCheck, Settings, LogOut, Trophy, FlaskConical, HardHat, MessageCircle } from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import RenewalBanner from "@/components/RenewalBanner";
import PlanBadge from "@/components/PlanBadge";

const items = [
  { title: "Estudar", url: "/app/estudar", icon: GraduationCap },
  { title: "Chat com Professor", url: "/app/chat", icon: MessageCircle },
  { title: "Normas Principais", url: "/app/normas", icon: BookOpen },
  { title: "Meu Progresso", url: "/app/progresso", icon: BarChart3 },
  { title: "Ranking", url: "/app/ranking", icon: Trophy },
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
  const chatLocked = !isAdmin && !profile?.chat_unlocked;
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
            <div>
              <p className="font-bold leading-tight">EducA.I.</p>
              <p className="text-xs text-muted-foreground">Academy</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Aluno</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
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
                  <NavLink to="/app/configuracoes" className={cls("/app/configuracoes")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Configurações</span>}
                  </NavLink>
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
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">EducA.I. Academy</span>
            </div>
            <div className="flex items-center gap-3">
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
              {isAdmin && <Badge className="gradient-primary text-primary-foreground border-0">Admin</Badge>}
              <span className="text-sm hidden sm:inline truncate max-w-[180px]">{profile?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
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
          <main className="flex-1 p-4 md:p-8 animate-fade-in space-y-4">
            <RenewalBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
