import { useAuth, type AccessPlan } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PlanBadge from "@/components/PlanBadge";
import { buildPurchaseMailto } from "@/lib/plans";
import { Check, Sparkles, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCard {
  id: AccessPlan;
  price: string;
  oldPrice?: string;
  duration: string;
  highlight?: string;
  benefits: string[];
}

const PLAN_CARDS: PlanCard[] = [
  {
    id: "days_30",
    price: "R$ 10",
    oldPrice: "R$ 20",
    duration: "30 dias renováveis",
    benefits: [
      "Acesso completo aos estudos",
      "Quizzes ilimitados (fácil e difícil)",
      "Simulados oficiais",
      "Ranking e progresso",
      "Renovação flexível",
    ],
  },
  {
    id: "days_90",
    price: "R$ 25",
    oldPrice: "R$ 60",
    duration: "90 dias renováveis",
    highlight: "Mais escolhido",
    benefits: [
      "Tudo do plano 30 DAYS",
      "3 meses de acesso contínuo",
      "Melhor custo por dia",
      "Chat com Professor Saraiva (sob liberação)",
    ],
  },
  {
    id: "premium",
    price: "R$ 100",
    oldPrice: "R$ 240",
    duration: "366 dias renováveis",
    highlight: "Melhor custo-benefício",
    benefits: [
      "Tudo dos planos anteriores",
      "1 ano completo de acesso",
      "Chat com Professor Saraiva liberado",
      "Prioridade em novos recursos",
      "Acesso antecipado a simulados",
    ],
  },
];

export default function Planos() {
  const { profile, isAdmin } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          Planos EducA.I.
        </h1>
        <p className="text-muted-foreground text-sm">
          Escolha o plano ideal para sua jornada de estudos.
        </p>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-sm font-medium">
          🎉 <strong>Preços promocionais por tempo limitado!</strong> Aproveite enquanto durar.
        </AlertDescription>
      </Alert>

      {isAdmin && (
        <Alert className="border-purple-500/50 bg-purple-500/10">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm">
            Você possui <strong>acesso vitalício de administrador</strong> — não precisa contratar nenhum plano.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {PLAN_CARDS.map((p) => {
          const isCurrent = !isAdmin && profile?.plan === p.id;
          const mailto = profile ? buildPurchaseMailto({ userEmail: profile.email, plan: p.id }) : "#";
          return (
            <Card
              key={p.id}
              className={cn(
                "p-6 flex flex-col gap-4 relative transition-all",
                isCurrent && "ring-2 ring-primary shadow-glow",
                p.highlight && !isCurrent && "border-primary/40"
              )}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {p.highlight}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Seu plano atual
                </div>
              )}

              <div className="flex items-center justify-between">
                <PlanBadge plan={p.id} size="md" />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  {p.oldPrice && (
                    <span className="text-sm text-muted-foreground line-through">{p.oldPrice}</span>
                  )}
                  <span className="text-4xl font-extrabold">{p.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.duration}</p>
              </div>

              <ul className="space-y-2 flex-1">
                {p.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {!isAdmin && !isCurrent && (
                <Button asChild className="gradient-primary text-primary-foreground shadow-glow w-full">
                  <a href={mailto}>
                    <Mail className="w-4 h-4 mr-2" /> Quero este plano
                  </a>
                </Button>
              )}
              {isCurrent && (
                <Button disabled variant="outline" className="w-full">
                  Plano ativo
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Ao clicar em "Quero este plano", abriremos seu cliente de e-mail para você enviar a solicitação ao administrador. A ativação é manual após confirmação do pagamento.
      </p>
    </div>
  );
}
