import { useAuth } from "@/contexts/AuthContext";
import { buildRenewalMailto, daysUntil, planLabel, shouldShowRenewal } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Mail, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function RenewalBanner() {
  const { profile, isAdmin } = useAuth();
  if (!profile) return null;
  if (!shouldShowRenewal(profile.plan, profile.access_expires_at, isAdmin)) return null;

  const days = daysUntil(profile.access_expires_at) ?? 0;
  const href = buildRenewalMailto({
    userEmail: profile.email,
    plan: profile.plan,
    expiresAt: profile.access_expires_at,
  });

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 sm:p-4 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-start gap-2 min-w-0">
        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            Seu acesso {planLabel(profile.plan)} expira em {days} {days === 1 ? "dia" : "dias"}
          </p>
          <p className="text-xs text-muted-foreground">
            Quer continuar estudando? Solicite a renovação ao administrador.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild size="sm" variant="outline">
          <Link to="/app/planos">
            <Sparkles className="w-4 h-4 mr-1.5" /> Ver planos
          </Link>
        </Button>
        <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-glow">
          <a href={href}>
            <Mail className="w-4 h-4 mr-1.5" /> Solicitar renovação
          </a>
        </Button>
      </div>
    </div>
  );
}
