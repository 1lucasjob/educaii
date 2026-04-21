import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Mail } from "lucide-react";
import { buildPixPayload } from "@/lib/pix";

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planLabel: string;
  notifyMailto: string;
}

const PIX_KEY = "e7a2545b-21e7-46bd-9359-47c09ac5e7bd";
const MERCHANT_NAME = "EDUCA.I";
const MERCHANT_CITY = "BRASIL";

export default function PixPaymentDialog({
  open,
  onOpenChange,
  amount,
  planLabel,
  notifyMailto,
}: PixPaymentDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () =>
      buildPixPayload({
        pixKey: PIX_KEY,
        merchantName: MERCHANT_NAME,
        merchantCity: MERCHANT_CITY,
        amount,
        description: `EDUCAI ${planLabel}`,
      }),
    [amount, planLabel],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            {planLabel} — <strong>R$ {amount.toFixed(2).replace(".", ",")}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-lg border border-border">
            <QRCodeSVG value={payload} size={220} level="M" />
          </div>

          <div className="w-full space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              PIX copia e cola
            </label>
            <div className="flex gap-2">
              <Input value={payload} readOnly className="text-xs font-mono" />
              <Button onClick={copy} size="icon" variant="outline" aria-label="Copiar">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p>1. Abra o app do seu banco e escaneie o QR Code (ou cole o código).</p>
            <p>2. Confirme o pagamento de <strong>R$ {amount.toFixed(2).replace(".", ",")}</strong>.</p>
            <p>3. Envie o comprovante ao administrador para liberar seu acesso.</p>
          </div>

          <Button asChild className="w-full gradient-primary text-primary-foreground">
            <a href={notifyMailto}>
              <Mail className="w-4 h-4 mr-2" /> Enviar comprovante ao admin
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
