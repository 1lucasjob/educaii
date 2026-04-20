import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sha256 } from "@/lib/crypto";
import { KeyRound, HardHat } from "lucide-react";

export default function Cadastro() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reserveCode, setReserveCode] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setValidating(false);
        return;
      }
      const { data } = await supabase
        .from("invites")
        .select("id, used, expires_at")
        .eq("token", token)
        .maybeSingle();
      const ok = !!data && !data.used && new Date(data.expires_at) > new Date();
      setValid(ok);
      setValidating(false);
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(reserveCode)) {
      toast({ title: "Código reserva inválido", description: "Deve ter exatamente 5 dígitos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const reserveHash = await sha256(reserveCode);
    const answerHash = await sha256(secretAnswer);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/estudar`,
        data: {
          reserve_code_hash: reserveHash,
          secret_question: secretQuestion,
          secret_answer_hash: answerHash,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }

    // Mark invite as used
    await supabase.from("invites").update({ used: true, used_at: new Date().toISOString(), used_by: data.user?.id ?? null }).eq("token", token);

    toast({ title: "Cadastro realizado!", description: "Você já pode entrar." });
    navigate("/login");
  };

  if (validating) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Validando convite…</div>;
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Convite inválido</h1>
          <p className="text-muted-foreground mb-6">Este link é inválido, expirado ou já foi utilizado.</p>
          <Link to="/login"><Button variant="outline">Ir para login</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <HardHat className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-muted-foreground text-sm">Preencha os dados do seu acesso</p>
        </div>

        <Card className="p-6 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Código reserva (5 dígitos)</Label>
              <Input inputMode="numeric" maxLength={5} required value={reserveCode} onChange={(e) => setReserveCode(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 12345" />
              <p className="text-xs text-muted-foreground">Use para recuperar seu email caso esqueça.</p>
            </div>
            <div className="space-y-2">
              <Label>Pergunta secreta</Label>
              <Input required value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)} placeholder="Ex: Nome do meu primeiro pet?" />
            </div>
            <div className="space-y-2">
              <Label>Resposta secreta</Label>
              <Input required value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-glow">
              {loading ? "Criando…" : "Criar conta"}
              <KeyRound className="ml-2" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
