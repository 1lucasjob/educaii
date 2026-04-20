import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function TermsGate() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile not loaded yet OR already accepted -> hide
  if (!profile || (profile as any).terms_accepted_at) return null;

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", profile.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Termos aceitos", description: "Obrigado! Bons estudos." });
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-w-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Termos de Uso — Aceite Necessário
          </DialogTitle>
          <DialogDescription>
            Para continuar usando o EDUCA.I Academy, leia e aceite os termos abaixo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] rounded-md border border-border p-4 text-sm space-y-3">
          <div className="space-y-3">
            <p>
              <strong className="text-primary">Reembolso por indisponibilidade:</strong> se o app ficar fora do ar ou
              deixar de funcionar de forma definitiva, devolvemos o valor proporcional aos meses restantes do plano em
              até <strong>20 dias corridos</strong>.
            </p>
            <p>
              <strong className="text-primary">Conteúdo de IA:</strong> resumos, simulados e respostas do Professor
              Saraiva são apoio ao estudo e <strong>não substituem</strong> o texto oficial das NRs nem orientação
              profissional. Sempre confira a norma vigente.
            </p>
            <p>
              <strong className="text-primary">Conta individual:</strong> seu acesso é pessoal e intransferível.
              Compartilhar login pode causar suspensão sem reembolso.
            </p>
            <p>
              <strong className="text-primary">Conduta:</strong> proibido ofender, fazer spam, scraping, engenharia
              reversa ou tentar burlar limites do plano.
            </p>
            <p>
              <strong className="text-primary">Uso justo:</strong> chat e geração de resumos/simulados têm limites
              razoáveis para garantir qualidade a todos.
            </p>
            <p>
              <strong className="text-primary">Manutenções:</strong> paradas curtas para atualização não geram reembolso.
            </p>
            <p>
              <strong className="text-primary">Privacidade (LGPD):</strong> seus dados são tratados conforme a LGPD.
              E-mail só é usado para login, comunicação e cobrança.
            </p>
            <p>
              <strong className="text-primary">Cancelamento:</strong> pode pedir por e-mail; valor já consumido não é
              devolvido (exceto pela regra de indisponibilidade acima).
            </p>
            <p>
              <strong className="text-primary">Alterações:</strong> mudanças relevantes pedem novo aceite.
            </p>
            <p className="pt-2 border-t border-border">
              Ler os termos completos em{" "}
              <Link to="/termos" target="_blank" className="text-primary underline font-medium">
                /termos
              </Link>
              .
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="terms-accept"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
          />
          <label htmlFor="terms-accept" className="text-sm leading-relaxed cursor-pointer">
            Li e aceito os{" "}
            <Link to="/termos" target="_blank" className="text-primary underline">
              Termos de Uso
            </Link>{" "}
            do EDUCA.I Academy.
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="gradient-primary text-primary-foreground shadow-glow"
          >
            {loading ? "Salvando…" : "Aceito e quero continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
