import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, HardHat } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
          <h1 className="text-3xl font-bold tracking-tight">EducA.I. Academy</h1>
          <p className="text-muted-foreground mt-2">Estudo focado em Segurança do Trabalho</p>
        </div>

        <Card className="p-6 shadow-glow animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
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
