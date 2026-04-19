import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 animate-scale-in">
        <h1 className="text-2xl font-bold mb-2">Esqueci minha senha</h1>
        <p className="text-muted-foreground text-sm mb-6">Enviaremos um link de redefinição para seu email.</p>
        {sent ? (
          <div className="text-center py-6">
            <Mail className="mx-auto w-12 h-12 text-primary mb-3" />
            <p className="font-medium">Verifique seu email</p>
            <p className="text-sm text-muted-foreground mt-2">Enviamos o link de redefinição para <strong>{email}</strong>.</p>
            <Link to="/login" className="text-primary hover:underline mt-6 inline-block">Voltar para login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
            <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">Voltar</Link>
          </form>
        )}
      </Card>
    </div>
  );
}
