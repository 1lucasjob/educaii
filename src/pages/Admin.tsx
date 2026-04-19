import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, KeyRound, Copy, Plus } from "lucide-react";

interface Invite {
  id: string;
  token: string;
  used: boolean;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [slots, setSlots] = useState(0);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [{ data: s }, { data: i }] = await Promise.all([
      supabase.from("available_slots").select("count").eq("id", 1).single(),
      supabase.from("invites").select("*").order("created_at", { ascending: false }),
    ]);
    setSlots(s?.count ?? 0);
    setInvites((i as Invite[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const release = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-invite", { body: { pin } });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acesso liberado!", description: "Link copiado para a área de transferência." });
    const link = `${window.location.origin}/cadastro?token=${data.token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setOpen(false);
    setPin("");
    load();
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/cadastro?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const statusOf = (i: Invite) => {
    if (i.used) return <Badge variant="secondary">Usado</Badge>;
    if (new Date(i.expires_at) < new Date()) return <Badge variant="destructive">Expirado</Badge>;
    return <Badge className="gradient-primary text-primary-foreground border-0">Ativo</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="text-primary" /> Gestão de Cadastros</h1>
        <p className="text-muted-foreground mt-1">Libere acessos individuais protegidos por PIN.</p>
      </div>

      <Card className="p-8 shadow-glow text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">Vagas disponíveis</p>
        <p className="text-6xl font-bold gradient-primary bg-clip-text text-transparent my-2" style={{ WebkitTextFillColor: "transparent", backgroundImage: "var(--gradient-primary)" }}>
          {slots}
        </p>
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground shadow-glow mt-2">
          <Plus className="mr-2" /> Liberar +1 acesso
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4">Convites ({invites.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{statusOf(i)}</TableCell>
                <TableCell className="text-xs">{new Date(i.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-xs">{new Date(i.expires_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {!i.used && new Date(i.expires_at) > new Date() && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                      <Copy className="w-3 h-3 mr-1" /> Copiar link
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invites.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum convite ainda.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="text-primary" /> Confirmar liberação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Digite o PIN do administrador para gerar um novo link de cadastro único.</p>
          <div className="space-y-2">
            <Label>PIN</Label>
            <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          </div>
          <Button onClick={release} disabled={loading || pin.length !== 4} className="gradient-primary text-primary-foreground">
            {loading ? "Liberando…" : "Confirmar"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
