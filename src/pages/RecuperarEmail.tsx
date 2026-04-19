import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sha256 } from "@/lib/crypto";

type Step = "code" | "question" | "revealed";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export default function RecuperarEmail() {
  const [step, setStep] = useState<Step>("code");
  const [reserveCode, setReserveCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [profileMatch, setProfileMatch] = useState<{ id: string; email: string; secret_question: string; secret_answer_hash: string } | null>(null);
  const [revealed, setRevealed] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(reserveCode)) {
      toast({ title: "Código inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    const hash = await sha256(reserveCode);
    const { data } = await supabase
      .from("profiles")
      .select("id,email,secret_question,secret_answer_hash")
      .eq("reserve_code_hash", hash)
      .maybeSingle();
    setLoading(false);
    if (!data) {
      toast({ title: "Código não encontrado", variant: "destructive" });
      return;
    }
    setProfileMatch(data as any);
    setStep("question");
  };

  const checkAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileMatch) return;
    setLoading(true);
    const hash = await sha256(answer);
    setLoading(false);
    if (hash !== profileMatch.secret_answer_hash) {
      toast({ title: "Resposta incorreta", variant: "destructive" });
      return;
    }
    setRevealed(profileMatch.email);
    setStep("revealed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 animate-scale-in">
        <h1 className="text-2xl font-bold mb-2">Esqueci meu email</h1>
        <p className="text-muted-foreground text-sm mb-6">Use seu código reserva e responda à pergunta secreta.</p>

        {step === "code" && (
          <form onSubmit={checkCode} className="space-y-4">
            <div className="space-y-2">
              <Label>Código reserva (5 dígitos)</Label>
              <Input inputMode="numeric" maxLength={5} value={reserveCode} onChange={(e) => setReserveCode(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">Continuar</Button>
          </form>
        )}

        {step === "question" && profileMatch && (
          <form onSubmit={checkAnswer} className="space-y-4">
            <div className="p-3 rounded-md bg-muted">
              <p className="text-sm text-muted-foreground">Pergunta secreta:</p>
              <p className="font-medium">{profileMatch.secret_question}</p>
            </div>
            <div className="space-y-2">
              <Label>Sua resposta</Label>
              <Input value={answer} onChange={(e) => setAnswer(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">Revelar email</Button>
          </form>
        )}

        {step === "revealed" && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-2">Seu email cadastrado é:</p>
            <p className="text-xl font-bold text-primary">{revealed}</p>
            <p className="text-xs text-muted-foreground mt-2">(parcialmente: {maskEmail(revealed)})</p>
            <Link to="/login"><Button variant="outline" className="mt-6">Ir para login</Button></Link>
          </div>
        )}

        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary mt-6">Voltar</Link>
      </Card>
    </div>
  );
}
