import { useMemo } from "react";
import {
  Hexagon,
  Gem,
  Triangle,
  Diamond,
  Shield,
  Crown,
  Star,
  Sparkles,
  Cpu,
  Lock,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconCmp = typeof Hexagon;

interface Tier {
  months: number;
  title: string;
  short: string;
  Icon: IconCmp;
  iconClass: string;
  bgClass: string;
  glowClass: string;
  extraIcon?: IconCmp;
  titleClass?: string;
  pulse?: boolean;
}

export const LOYALTY_TIERS: Tier[] = [
  { months: 1, title: "Recruta", short: "Recruta", Icon: Hexagon, iconClass: "text-gray-300", bgClass: "bg-gradient-to-br from-gray-700 to-gray-900", glowClass: "shadow-[0_0_10px_rgba(156,163,175,0.4)]" },
  { months: 2, title: "Estudante", short: "Estudante", Icon: Hexagon, iconClass: "text-gray-100", bgClass: "bg-gradient-to-br from-gray-300 to-gray-500", glowClass: "shadow-[0_0_10px_rgba(229,231,235,0.45)]" },
  { months: 3, title: "Prevencionista Júnior", short: "Prev. Jr.", Icon: Gem, iconClass: "text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]", bgClass: "bg-gradient-to-br from-emerald-700 to-emerald-950", glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.55)]" },
  { months: 4, title: "Inspetor de Risco", short: "Inspetor", Icon: Triangle, iconClass: "text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.85)]", bgClass: "bg-gradient-to-br from-yellow-700 to-amber-950", glowClass: "shadow-[0_0_12px_rgba(250,204,21,0.55)]" },
  { months: 6, title: "Analista de Segurança", short: "Analista", Icon: Diamond, iconClass: "text-blue-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.9)]", bgClass: "bg-gradient-to-br from-blue-700 to-blue-950", glowClass: "shadow-[0_0_14px_rgba(59,130,246,0.6)]" },
  { months: 8, title: "Estrategista de SESMT", short: "Estrategista", Icon: Diamond, iconClass: "text-red-300 drop-shadow-[0_0_4px_rgba(239,68,68,0.9)]", bgClass: "bg-gradient-to-br from-red-700 to-red-950", glowClass: "shadow-[0_0_14px_rgba(239,68,68,0.6)]" },
  { months: 10, title: "Especialista em NRs", short: "Especialista", Icon: Gem, iconClass: "text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.9)]", bgClass: "bg-gradient-to-br from-purple-700 to-purple-950", glowClass: "shadow-[0_0_14px_rgba(168,85,247,0.6)]" },
  { months: 12, title: "Guardião da Vida", short: "Guardião", Icon: Shield, iconClass: "text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,1)]", bgClass: "bg-gradient-to-br from-emerald-600 to-emerald-950", glowClass: "shadow-[0_0_16px_rgba(16,185,129,0.7)]" },
  { months: 15, title: "Auditor de Ouro", short: "Auditor", Icon: Crown, iconClass: "text-amber-300 drop-shadow-[0_0_5px_rgba(251,191,36,1)]", bgClass: "bg-gradient-to-br from-amber-600 to-yellow-900", glowClass: "shadow-[0_0_16px_rgba(251,191,36,0.75)]" },
  { months: 18, title: "Mestre SST", short: "Mestre", Icon: Star, iconClass: "text-cyan-200 drop-shadow-[0_0_5px_rgba(103,232,249,1)]", bgClass: "bg-gradient-to-br from-cyan-600 to-sky-950", glowClass: "shadow-[0_0_16px_rgba(103,232,249,0.7)]" },
  { months: 21, title: "Visionário da Prevenção", short: "Visionário", Icon: Sparkles, iconClass: "text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,1)]", bgClass: "bg-gradient-to-br from-purple-600 via-pink-600 to-red-700", glowClass: "shadow-[0_0_18px_rgba(236,72,153,0.7)]", titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-bold" },
  { months: 24, title: "Lenda da Segurança", short: "Lenda", Icon: Shield, extraIcon: Cpu, iconClass: "text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,1)]", bgClass: "bg-gradient-to-br from-cyan-500 via-emerald-500 to-blue-700", glowClass: "shadow-[0_0_22px_rgba(34,211,238,0.9),0_0_30px_rgba(16,185,129,0.7)]", pulse: true, titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 font-extrabold" },
];

function monthsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
}

interface Props {
  startDate: string | Date;
  className?: string;
}

export default function LoyaltyProgram({ startDate, className }: Props) {
  const userMonths = useMemo(() => {
    const d = typeof startDate === "string" ? new Date(startDate) : startDate;
    if (!d || isNaN(d.getTime())) return 0;
    return monthsBetween(d, new Date());
  }, [startDate]);

  const nextTier = LOYALTY_TIERS.find((t) => t.months > userMonths) ?? null;
  const prevReached = [...LOYALTY_TIERS].reverse().find((t) => t.months <= userMonths) ?? null;

  let progressPct = 100;
  let progressLabel = "Você atingiu o nível máximo da fidelidade!";
  if (nextTier) {
    const base = prevReached?.months ?? 0;
    const span = nextTier.months - base;
    const done = userMonths - base;
    progressPct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
    const remaining = nextTier.months - userMonths;
    progressLabel = `Faltam ${remaining} ${remaining === 1 ? "mês" : "meses"} para "${nextTier.title}"`;
  }

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Trophy className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-base">Programa de Fidelidade</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {userMonths} {userMonths === 1 ? "mês" : "meses"}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progressLabel}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
        {LOYALTY_TIERS.map((tier) => {
          const unlocked = tier.months <= userMonths;
          const Icon = tier.Icon;
          const Extra = tier.extraIcon;
          return (
            <div
              key={tier.months}
              aria-label={`${tier.title} — ${tier.months} ${tier.months === 1 ? "mês" : "meses"} — ${unlocked ? "desbloqueado" : "bloqueado"}`}
              className={cn(
                "shrink-0 w-[72px] sm:w-[78px] flex flex-col items-center gap-1 text-center",
                !unlocked && "opacity-40 grayscale",
              )}
            >
              <div
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center",
                  tier.bgClass,
                  unlocked ? tier.glowClass : "shadow-none",
                  unlocked && tier.pulse && "animate-pulse",
                )}
              >
                <Icon className={cn("w-6 h-6", tier.iconClass)} strokeWidth={2} />
                {Extra && unlocked && (
                  <Extra className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-cyan-200 bg-background rounded-full p-0.5 border border-cyan-400/50" />
                )}
                {!unlocked && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                  </span>
                )}
              </div>
              <p className={cn("text-[10px] leading-tight truncate w-full", unlocked ? tier.titleClass ?? "font-medium text-foreground" : "text-muted-foreground")}>
                {tier.short}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
