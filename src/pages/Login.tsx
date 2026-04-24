import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, HardHat, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const expired = params.get("expired") === "1";

  useEffect(() => {
    if (expired) {
      toast({
        title: "Acesso expirado",
        description: "Seu plano terminou. Entre em contato com o administrador para renovar.",
        variant: "destructive",
      });
    }
  }, [expired, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/app/estudar");
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
            <HardHat className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight">EDUCA.I</h1>
          <p className="text-lg text-muted-foreground leading-tight">Academy</p>
          <p className="text-muted-foreground mt-2">Estudo focado em Segurança do Trabalho</p>
        </div>

        <Card className="p-6 shadow-glow animate-scale-in">
          {expired && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 flex gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p>Seu acesso expirou. Solicite renovação ao administrador.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
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
            <Button type="submit" disabled={loading} className="w-full gradient-primary shadow-glow text-primary-foreground">
              {loading ? "Entrando…" : "Entrar"}
              <ShieldCheck className="ml-2" />
            </Button>
          </form>

          <div className="flex flex-col gap-2 mt-6 text-sm text-center">
            <Link to="/recuperar-senha" className="text-primary hover:underline">
              Esqueci minha senha
            </Link>
            <Link to="/recuperar-email" className="text-primary hover:underline">
              Esqueci meu email
            </Link>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Cadastro disponível apenas via convite do administrador.
        </p>
      </div>
    </div>
  );
}
