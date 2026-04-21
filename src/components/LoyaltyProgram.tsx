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
import { cn } from "@/lib/utils";

type IconCmp = typeof Hexagon;

interface Tier {
  months: number;
  title: string;
  Icon: IconCmp;
  /** Tailwind classes for the icon (color/effects) */
  iconClass: string;
  /** Background gradient for the crystal circle */
  bgClass: string;
  /** Glow/shadow when unlocked */
  glowClass: string;
  /** If true, render an extra Cpu badge (for Lenda 24m) */
  extraIcon?: IconCmp;
  /** Custom title style for unlocked state (e.g. multicolor) */
  titleClass?: string;
  /** Pulse animation when unlocked */
  pulse?: boolean;
}

export const LOYALTY_TIERS: Tier[] = [
  {
    months: 1,
    title: "Recruta",
    Icon: Hexagon,
    iconClass: "text-gray-400",
    bgClass: "bg-gradient-to-br from-gray-700 to-gray-900",
    glowClass: "shadow-[0_0_18px_rgba(156,163,175,0.4)]",
  },
  {
    months: 2,
    title: "Estudante",
    Icon: Hexagon,
    iconClass: "text-gray-100",
    bgClass: "bg-gradient-to-br from-gray-300 to-gray-500",
    glowClass: "shadow-[0_0_18px_rgba(229,231,235,0.45)]",
  },
  {
    months: 3,
    title: "Prevencionista Júnior",
    Icon: Gem,
    iconClass: "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]",
    bgClass: "bg-gradient-to-br from-emerald-700 to-emerald-950",
    glowClass: "shadow-[0_0_22px_rgba(52,211,153,0.55)]",
  },
  {
    months: 4,
    title: "Inspetor de Risco",
    Icon: Triangle,
    iconClass: "text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.85)]",
    bgClass: "bg-gradient-to-br from-yellow-700 to-amber-950",
    glowClass: "shadow-[0_0_22px_rgba(250,204,21,0.55)]",
  },
  {
    months: 6,
    title: "Analista de Segurança",
    Icon: Diamond,
    iconClass: "text-blue-300 drop-shadow-[0_0_6px_rgba(59,130,246,0.9)]",
    bgClass: "bg-gradient-to-br from-blue-700 to-blue-950",
    glowClass: "shadow-[0_0_24px_rgba(59,130,246,0.6)]",
  },
  {
    months: 8,
    title: "Estrategista de SESMT",
    Icon: Diamond,
    iconClass: "text-red-300 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]",
    bgClass: "bg-gradient-to-br from-red-700 to-red-950",
    glowClass: "shadow-[0_0_24px_rgba(239,68,68,0.6)]",
  },
  {
    months: 10,
    title: "Especialista em NRs",
    Icon: Gem,
    iconClass: "text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]",
    bgClass: "bg-gradient-to-br from-purple-700 to-purple-950",
    glowClass: "shadow-[0_0_24px_rgba(168,85,247,0.6)]",
  },
  {
    months: 12,
    title: "Guardião da Vida",
    Icon: Shield,
    iconClass: "text-emerald-300 drop-shadow-lg drop-shadow-[0_0_10px_rgba(16,185,129,1)]",
    bgClass: "bg-gradient-to-br from-emerald-600 to-emerald-950",
    glowClass: "shadow-[0_0_28px_rgba(16,185,129,0.7)]",
  },
  {
    months: 15,
    title: "Auditor de Ouro",
    Icon: Crown,
    iconClass: "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,1)]",
    bgClass: "bg-gradient-to-br from-amber-600 to-yellow-900",
    glowClass: "shadow-[0_0_28px_rgba(251,191,36,0.75)]",
  },
  {
    months: 18,
    title: "Mestre SST",
    Icon: Star,
    iconClass: "text-cyan-200 drop-shadow-[0_0_8px_rgba(103,232,249,1)]",
    bgClass: "bg-gradient-to-br from-cyan-600 to-sky-950",
    glowClass: "shadow-[0_0_28px_rgba(103,232,249,0.7)]",
  },
  {
    months: 21,
    title: "Visionário da Prevenção",
    Icon: Sparkles,
    iconClass: "text-pink-300 drop-shadow-[0_0_10px_rgba(236,72,153,1)]",
    bgClass: "bg-gradient-to-br from-purple-600 via-pink-600 to-red-700",
    glowClass: "shadow-[0_0_30px_rgba(236,72,153,0.7)]",
    titleClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-bold",
  },
  {
    months: 24,
    title: "Lenda da Segurança",
    Icon: Shield,
    extraIcon: Cpu,
    iconClass: "text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,1)]",
    bgClass: "bg-gradient-to-br from-cyan-500 via-emerald-500 to-blue-700",
    glowClass:
      "shadow-[0_0_40px_rgba(34,211,238,0.9),0_0_60px_rgba(16,185,129,0.7)]",
    pulse: true,
    titleClass:
      "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 font-extrabold",
  },
];

function monthsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  // Average month length to feel natural across 30/31-day months
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

  const maxMonths = LOYALTY_TIERS[LOYALTY_TIERS.length - 1].months;
  const nextTier = LOYALTY_TIERS.find((t) => t.months > userMonths) ?? null;
  const prevReached =
    [...LOYALTY_TIERS].reverse().find((t) => t.months <= userMonths) ?? null;

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

  const overallPct = Math.min(100, Math.round((userMonths / maxMonths) * 100));

  return (
    <section
      className={cn(
        "relative rounded-xl p-5 sm:p-6 bg-slate-950/80 border border-slate-800",
        "text-slate-100",
        className,
      )}
    >
      {/* Header + progress */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h2 className="font-bold text-lg">Programa de Fidelidade</h2>
          <span className="ml-auto text-xs text-slate-400">
            {userMonths} {userMonths === 1 ? "mês" : "meses"} de jornada
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 transition-all"
              style={{ width: `${nextTier ? progressPct : 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-300">{progressLabel}</p>
          <p className="text-[10px] text-slate-500">
            Progresso geral: {overallPct}% ({userMonths}/{maxMonths} meses)
          </p>
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-4 sm:space-y-5">
        {/* center line on >=sm */}
        <span
          aria-hidden
          className="hidden sm:block absolute left-1/2 top-2 bottom-2 -translate-x-1/2 w-px bg-gradient-to-b from-slate-700 via-slate-800 to-slate-700"
        />
        {LOYALTY_TIERS.map((tier, idx) => {
          const unlocked = tier.months <= userMonths;
          const sideLeft = idx % 2 === 0;
          const Icon = tier.Icon;
          const Extra = tier.extraIcon;
          return (
            <li
              key={tier.months}
              aria-label={`${tier.title} — ${tier.months} ${
                tier.months === 1 ? "mês" : "meses"
              } — ${unlocked ? "desbloqueado" : "bloqueado"}`}
              className={cn(
                "relative flex items-center gap-4 sm:gap-6",
                "sm:justify-center",
              )}
            >
              {/* Card */}
              <div
                className={cn(
                  "flex-1 sm:flex-none sm:w-[44%] flex items-center gap-3 sm:gap-4 p-3 sm:p-4",
                  "rounded-xl border bg-slate-900/70 border-slate-800",
                  "transition-all",
                  unlocked
                    ? "border-slate-700"
                    : "opacity-50 grayscale",
                  sideLeft ? "sm:order-1" : "sm:order-3 sm:flex-row-reverse",
                )}
              >
                {/* Crystal */}
                <div
                  className={cn(
                    "relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center",
                    tier.bgClass,
                    unlocked ? tier.glowClass : "shadow-none",
                    unlocked && tier.pulse ? "animate-pulse" : "",
                  )}
                >
                  <Icon
                    className={cn("w-7 h-7 sm:w-8 sm:h-8", tier.iconClass)}
                    strokeWidth={2}
                  />
                  {Extra && unlocked && (
                    <Extra className="absolute -bottom-1 -right-1 w-4 h-4 text-cyan-200 bg-slate-950 rounded-full p-0.5 border border-cyan-400/50" />
                  )}
                  {!unlocked && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className={cn("min-w-0 flex-1", !sideLeft && "sm:text-right")}>
                  <p
                    className={cn(
                      "text-sm sm:text-base leading-tight truncate",
                      unlocked
                        ? tier.titleClass ?? "font-semibold text-slate-50"
                        : "text-slate-300 font-medium",
                    )}
                  >
                    {tier.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    {tier.months} {tier.months === 1 ? "mês" : "meses"}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full border",
                      unlocked
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700",
                    )}
                  >
                    {unlocked ? "Desbloqueado" : "Bloqueado"}
                  </span>
                </div>
              </div>

              {/* Center dot (desktop) */}
              <span
                aria-hidden
                className={cn(
                  "hidden sm:block sm:order-2 w-3 h-3 rounded-full border-2",
                  unlocked
                    ? "bg-amber-300 border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                    : "bg-slate-800 border-slate-700",
                )}
              />

              {/* Spacer on opposite side (desktop) */}
              <span
                aria-hidden
                className={cn(
                  "hidden sm:block sm:w-[44%]",
                  sideLeft ? "sm:order-3" : "sm:order-1",
                )}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
