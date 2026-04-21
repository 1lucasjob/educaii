import { Headset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CreuzaChat from "@/components/CreuzaChat";

export default function Suporte() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" /> Suporte com a Creuza
          </CardTitle>
          <CardDescription>
            A Creuza é nossa assistente de suporte. Pergunte sobre <strong>planos</strong>, <strong>navegação</strong> ou <strong>problemas técnicos</strong>. Para dúvidas de conteúdo de SST, use o <strong>Chat com Professor Saraiva</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreuzaChat heightClass="h-[60vh]" />
        </CardContent>
      </Card>
    </div>
  );
}
